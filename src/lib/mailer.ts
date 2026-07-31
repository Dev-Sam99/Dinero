import nodemailer from "nodemailer";

export function createMailTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL || "",
      pass: process.env.SMTP_APP_PASSWORD || "",
    },
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  console.log("=== SEND PASSWORD RESET EMAIL CALLED ===");
  console.log("Configured SMTP_EMAIL:", process.env.SMTP_EMAIL || "<UNDEFINED/EMPTY>");
  console.log("SMTP_APP_PASSWORD configured:", process.env.SMTP_APP_PASSWORD ? `Yes (length ${process.env.SMTP_APP_PASSWORD.length})` : "No");

  const mailOptions = {
    from: `"Dinero" <${process.env.SMTP_EMAIL || "no-reply@dinero.app"}>`,
    to: toEmail,
    subject: "Reset Your Dinero Password",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #10202b; color: #f2ece0; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b8912f; margin-bottom: 10px; font-size: 24px;">Dinero</h2>
        <h3 style="color: #f2ece0; margin-top: 0;">Password Reset Request</h3>
        <p style="font-size: 14px; color: #a0b0be; line-height: 1.6;">
          We received a request to reset the password for your Dinero account (<strong>${toEmail}</strong>).
        </p>
        <p style="font-size: 14px; color: #a0b0be; line-height: 1.6;">
          Please click the button below to choose a new password:
        </p>
        <div style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #b8912f; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #e53e3e; line-height: 1.5; font-weight: 500;">
          Note: This password reset link will expire in 30 minutes.
        </p>
        <p style="font-size: 13px; color: #a0b0be; line-height: 1.5;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #243b4d; margin: 25px 0 15px 0;" />
        <p style="font-size: 11px; color: #718096; word-break: break-all;">
          Or copy and paste this link into your browser:<br />
          <a href="${resetUrl}" style="color: #b8912f;">${resetUrl}</a>
        </p>
      </div>
    `,
  };

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
    console.log("-------------------------------------------------------");
    console.log("SIMULATED RESET EMAIL (No SMTP Credentials configured):");
    console.log(`To: ${toEmail}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log("-------------------------------------------------------");
    return { simulated: true };
  }

  try {
    const transporter = createMailTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Nodemailer sendMail SUCCESS:");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    return info;
  } catch (err: any) {
    console.error("❌ Nodemailer sendMail ERROR:");
    console.error("Error Code:", err.code);
    console.error("Error Command:", err.command);
    console.error("Error Response:", err.response);
    console.error("Full Error Stack:", err);
    throw err;
  }
}
