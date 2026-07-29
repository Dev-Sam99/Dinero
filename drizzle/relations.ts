import { relations } from "drizzle-orm/relations";
import { locations, categories, categoryBudgets, expenses, vehicles } from "./schema";

export const categoriesRelations = relations(categories, ({one, many}) => ({
	location: one(locations, {
		fields: [categories.locationId],
		references: [locations.id]
	}),
	categoryBudgets: many(categoryBudgets),
	expenses: many(expenses),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	categories: many(categories),
	expenses: many(expenses),
}));

export const categoryBudgetsRelations = relations(categoryBudgets, ({one}) => ({
	category: one(categories, {
		fields: [categoryBudgets.categoryId],
		references: [categories.id]
	}),
}));

export const expensesRelations = relations(expenses, ({one}) => ({
	category: one(categories, {
		fields: [expenses.categoryId],
		references: [categories.id]
	}),
	vehicle: one(vehicles, {
		fields: [expenses.vehicleId],
		references: [vehicles.id]
	}),
	location: one(locations, {
		fields: [expenses.locationId],
		references: [locations.id]
	}),
}));

export const vehiclesRelations = relations(vehicles, ({many}) => ({
	expenses: many(expenses),
}));