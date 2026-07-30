import { pgTable, unique, serial, text, boolean, foreignKey, integer, numeric, timestamp, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const locations = pgTable("locations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	active: boolean().default(true).notNull(),
	color: text().default('#2f7d76').notNull(),
}, (table) => [
	unique("locations_name_key").on(table.name),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	locationId: integer("location_id").notNull(),
	monthlyBudget: numeric("monthly_budget", { precision: 10, scale:  2 }).default('0').notNull(),
	keywords: text().array().default([""]).notNull(),
	iconOverride: text("icon_override"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.id],
			name: "categories_location_id_fkey"
		}),
	unique("categories_name_key").on(table.name),
]);

export const categoryBudgets = pgTable("category_budgets", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id").notNull(),
	monthlyBudget: numeric("monthly_budget", { precision: 10, scale:  2 }).notNull(),
	effectiveFrom: date("effective_from").notNull(),
	effectiveTo: date("effective_to"),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "category_budgets_category_id_fkey"
		}).onDelete("cascade"),
]);

export const budgetOverrides = pgTable("budget_overrides", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id").notNull(),
	year: integer("year").notNull(),
	month: integer("month").notNull(),
	amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
	note: text("note"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [categories.id],
		name: "budget_overrides_category_id_fkey"
	}).onDelete("cascade"),
	unique("budget_overrides_category_year_month_key").on(table.categoryId, table.year, table.month),
]);

export const familyMembers = pgTable("family_members", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	keywords: text().array().default([""]).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("family_members_name_key").on(table.name),
]);

export const expenses = pgTable("expenses", {
	id: serial().primaryKey().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	rawText: text("raw_text").notNull(),
	note: text(),
	categoryId: integer("category_id"),
	vehicleId: integer("vehicle_id"),
	familyMemberId: integer("family_member_id"),
	locationId: integer("location_id").notNull(),
	date: date().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "expenses_category_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.vehicleId],
			foreignColumns: [vehicles.id],
			name: "expenses_vehicle_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.familyMemberId],
			foreignColumns: [familyMembers.id],
			name: "expenses_family_member_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.id],
			name: "expenses_location_id_fkey"
		}),
]);

export const vehicles = pgTable("vehicles", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	type: text().default('bike').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("vehicles_name_key").on(table.name),
]);
