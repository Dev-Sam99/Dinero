import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  for (const line of envConfig.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function run() {
  const { db } = await import("./index");
  const { sql } = await import("drizzle-orm");

  console.log("Starting DB Schema Update for Reminders & Prepaid Expenses...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "reminders" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" VARCHAR(10) NOT NULL,
        "title" TEXT NOT NULL,
        "notes" TEXT,
        "amount" NUMERIC(10, 2),
        "category_id" INTEGER REFERENCES "categories"("id") ON DELETE SET NULL,
        "location_id" INTEGER REFERENCES "locations"("id") ON DELETE SET NULL,
        "vehicle_id" INTEGER REFERENCES "vehicles"("id") ON DELETE SET NULL,
        "due_date" DATE NOT NULL,
        "recurrence" VARCHAR(20) DEFAULT 'none',
        "recurrence_day" INTEGER,
        "recurrence_interval_days" INTEGER,
        "remind_before_days" INTEGER NOT NULL DEFAULT 1,
        "status" VARCHAR(10) NOT NULL DEFAULT 'active',
        "last_notified_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "reminder_deliveries" (
        "id" SERIAL PRIMARY KEY,
        "reminder_id" INTEGER NOT NULL REFERENCES "reminders"("id") ON DELETE CASCADE,
        "channel" VARCHAR(10) NOT NULL,
        "sent_at" TIMESTAMP DEFAULT NOW(),
        "status" VARCHAR(10) NOT NULL,
        "error_message" TEXT
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "push_subscriptions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "endpoint" TEXT NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "user_id" INTEGER PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
        "push_enabled" BOOLEAN NOT NULL DEFAULT false,
        "email_enabled" BOOLEAN NOT NULL DEFAULT false,
        "email" TEXT
      );
    `);

    await db.execute(sql`
      ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "is_prepaid" BOOLEAN NOT NULL DEFAULT false;
    `);

    await db.execute(sql`
      ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "coverage_days" INTEGER;
    `);

    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
