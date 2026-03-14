import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const collegesTable = pgTable("colleges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  city: text("city"),
  state: text("state"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCollegeSchema = createInsertSchema(collegesTable).omit({ id: true, createdAt: true });
export type InsertCollege = z.infer<typeof insertCollegeSchema>;
export type College = typeof collegesTable.$inferSelect;
