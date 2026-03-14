import { Router } from "express";
import { db, categoriesTable, resourcesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    const result = await Promise.all(categories.map(async (c) => {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(resourcesTable).where(eq(resourcesTable.categoryId, c.id));
      return { ...c, resourceCount: Number(count) };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to list categories" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: "Validation error", message: "Name is required" });
      return;
    }
    const [category] = await db.insert(categoriesTable).values({ name, description }).returning();
    res.status(201).json({ ...category, resourceCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to create category" });
  }
});

export default router;
