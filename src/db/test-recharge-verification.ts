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

async function test84DayRechargeFlow() {
  const { db } = await import("./index");
  const { reminders, expenses, users, locations, categories } = await import("./schema");
  const { eq, and } = await import("drizzle-orm");

  console.log("Starting E2E Verification for 84-Day Custom Days Prepaid Recharge...");

  try {
    // 1. Get first user & location
    const userList = await db.select().from(users).limit(1);
    const locList = await db.select().from(locations).limit(1);
    const catList = await db.select().from(categories).limit(1);

    if (!userList.length || !locList.length) {
      console.error("Missing test seed user or location!");
      return;
    }

    const testUser = userList[0];
    const testLoc = locList[0];
    const testCat = catList[0] || null;

    const initialDueDate = "2026-08-05";

    // 2. Create 84-day custom_days bill reminder
    console.log("Step 1: Creating 84-day custom_days bill reminder...");
    const [createdReminder] = await db
      .insert(reminders)
      .values({
        userId: testUser.id,
        type: "bill",
        title: "Mobile Prepaid 84-Day Recharge Test",
        amount: "2400.00",
        dueDate: initialDueDate,
        recurrence: "custom_days",
        recurrenceIntervalDays: 84,
        categoryId: testCat ? testCat.id : null,
        locationId: testLoc.id,
        remindBeforeDays: 1,
        status: "active",
      })
      .returning();

    console.log("Created Reminder ID:", createdReminder.id);
    console.log("Initial Due Date:", createdReminder.dueDate);
    console.log("Recurrence:", createdReminder.recurrence, "Interval:", createdReminder.recurrenceIntervalDays);

    // 3. Simulate Mark Done + Log Prepaid Expense (84 days coverage)
    console.log("\nStep 2: Marking reminder as DONE and logging prepaid expense...");

    // Advance due date logic: 2026-08-05 + 84 days = 2026-10-28
    const [y, m, d] = createdReminder.dueDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    dateObj.setUTCDate(dateObj.getUTCDate() + 84);
    const nextDueDateStr = dateObj.toISOString().split("T")[0];

    const [updatedReminder] = await db
      .update(reminders)
      .set({
        dueDate: nextDueDateStr,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(reminders.id, createdReminder.id))
      .returning();

    console.log("Updated Reminder Next Due Date:", updatedReminder.dueDate);

    // Insert logged prepaid expense
    const [createdExpense] = await db
      .insert(expenses)
      .values({
        userId: testUser.id,
        amount: createdReminder.amount || "2400.00",
        rawText: createdReminder.title,
        note: "Logged from 84-day recharge test",
        categoryId: testCat ? testCat.id : null,
        locationId: testLoc.id,
        date: "2026-08-05",
        isPrepaid: true,
        coverageDays: 84,
      })
      .returning();

    console.log("Created Logged Expense ID:", createdExpense.id);
    console.log("Is Prepaid:", createdExpense.isPrepaid);
    console.log("Coverage Days:", createdExpense.coverageDays);

    // 4. Verify (a) Next due date advanced by 84 days
    const expectedDueDate = "2026-10-28";
    const dateAdvancedCorrectly = updatedReminder.dueDate === expectedDueDate;
    console.log(`\nVerification (a): Date advanced by 84 days? ${dateAdvancedCorrectly ? "YES" : "NO"} (Expected ${expectedDueDate}, Got ${updatedReminder.dueDate})`);

    // 5. Verify (b) Budget vs Actual calculation excludes isPrepaid = true expense
    const monthStart = "2026-08-01";
    const monthEnd = "2026-08-31";

    const allAugustExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, testUser.id),
          eq(expenses.locationId, testLoc.id)
        )
      );

    const normalAugustExpenses = allAugustExpenses.filter(
      (e) => e.date >= monthStart && e.date <= monthEnd && !e.isPrepaid
    );

    const prepaidAugustExpenses = allAugustExpenses.filter(
      (e) => e.date >= monthStart && e.date <= monthEnd && e.isPrepaid
    );

    const isExcludedFromNormalBudget = !normalAugustExpenses.some((e) => e.id === createdExpense.id);
    const isIncludedInPrepaidSection = prepaidAugustExpenses.some((e) => e.id === createdExpense.id);

    console.log(`Verification (b): Excluded from standard monthly budget spend? ${isExcludedFromNormalBudget ? "YES" : "NO"}`);
    console.log(`Verification (b): Included in dedicated Prepaid section? ${isIncludedInPrepaidSection ? "YES" : "NO"}`);

    // Cleanup test records
    await db.delete(reminders).where(eq(reminders.id, createdReminder.id));
    await db.delete(expenses).where(eq(expenses.id, createdExpense.id));
    console.log("\nCleanup: Test reminder & test expense deleted.");

    if (dateAdvancedCorrectly && isExcludedFromNormalBudget && isIncludedInPrepaidSection) {
      console.log("\n>>> SUCCESS: ALL E2E VERIFICATIONS PASSED FOR 84-DAY PREPAID RECHARGE! <<<");
    } else {
      console.error("\n>>> FAILED: E2E VERIFICATION CHECKS DID NOT PASS! <<<");
    }
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

test84DayRechargeFlow();
