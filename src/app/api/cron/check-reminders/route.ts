import { NextResponse } from "next/server";
import { db } from "@/db";
import { reminders, notificationPreferences, pushSubscriptions, reminderDeliveries } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import webPush from "web-push";

// Optional dynamic import for resend to allow smooth dev fallback
let Resend: any = null;
try {
  Resend = require("resend").Resend;
} catch (e) {
  // Resend package optional
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret") || req.headers.get("x-cron-secret");

    const expectedSecret = process.env.CRON_SECRET || "dinero-cron-secret-key";
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }

    // 1. Query reminders active & due within remindBeforeDays window
    const dueReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.status, "active"),
          sql`${reminders.dueDate} - (${reminders.remindBeforeDays} || ' days')::interval <= CURRENT_DATE`
        )
      );

    const results = [];

    // VAPID Setup if env vars configured
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webPush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@dinero.app",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }

    const resendClient = process.env.RESEND_API_KEY && Resend ? new Resend(process.env.RESEND_API_KEY) : null;

    for (const reminder of dueReminders) {
      // 2. Fetch user preferences
      const prefList = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, reminder.userId))
        .limit(1);

      const prefs = prefList[0] || { inAppEnabled: true, pushEnabled: false, emailEnabled: false, email: null };

      // Log in-app delivery audit entry
      if (prefs.inAppEnabled) {
        await db.insert(reminderDeliveries).values({
          reminderId: reminder.id,
          channel: "in_app",
          status: "sent",
        });
      }

      // 3. Web Push Delivery
      if (prefs.pushEnabled && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        const subs = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, reminder.userId));

        for (const sub of subs) {
          try {
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              JSON.stringify({
                title: `Reminder: ${reminder.title}`,
                body: `Due on ${reminder.dueDate}${reminder.amount ? ` (Amount: $${reminder.amount})` : ""}`,
                url: "/reminders",
              })
            );

            await db.insert(reminderDeliveries).values({
              reminderId: reminder.id,
              channel: "push",
              status: "sent",
            });
          } catch (pushErr: any) {
            // Prune expired endpoint (410 Gone)
            if (pushErr.statusCode === 410) {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
            }
            await db.insert(reminderDeliveries).values({
              reminderId: reminder.id,
              channel: "push",
              status: "failed",
              errorMessage: pushErr.message || String(pushErr),
            });
          }
        }
      }

      // 4. Email Delivery via Resend
      if (prefs.emailEnabled && prefs.email && resendClient) {
        try {
          await resendClient.emails.send({
            from: "Dinero <onboarding@resend.dev>",
            to: prefs.email,
            subject: `Reminder: ${reminder.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                <h2 style="color: #b8912f;">Dinero Household Passbook</h2>
                <h3>Reminder Notification: ${reminder.title}</h3>
                <p><strong>Due Date:</strong> ${reminder.dueDate}</p>
                ${reminder.amount ? `<p><strong>Amount:</strong> $${reminder.amount}</p>` : ""}
                ${reminder.notes ? `<p><strong>Notes:</strong> ${reminder.notes}</p>` : ""}
                <p style="margin-top: 20px; font-size: 12px; color: #718096;">Sent automatically by your Dinero Reminder assistant.</p>
              </div>
            `,
          });

          await db.insert(reminderDeliveries).values({
            reminderId: reminder.id,
            channel: "email",
            status: "sent",
          });
        } catch (emailErr: any) {
          await db.insert(reminderDeliveries).values({
            reminderId: reminder.id,
            channel: "email",
            status: "failed",
            errorMessage: emailErr.message || String(emailErr),
          });
        }
      }

      // Update lastNotifiedAt timestamp
      await db
        .update(reminders)
        .set({ lastNotifiedAt: new Date() })
        .where(eq(reminders.id, reminder.id));

      results.push({ reminderId: reminder.id, title: reminder.title });
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      reminders: results,
    });
  } catch (err: any) {
    console.error("POST /api/cron/check-reminders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
