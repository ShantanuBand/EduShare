import { Router } from "express";
import { db, categoriesTable, resourcesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.name);
    const result = await Promise.all(
      categories.map(async (c) => {
        const [{ count }] = await db
          .select({ count: sql`count(*)` })
          .from(resourcesTable)
          .where(eq(resourcesTable.categoryId, c.id));
        return { ...c, resourceCount: Number(count) };
      }),
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to list categories" });
  }
});

import { validateRequest } from "../middleware/validate.js";
import { CreateCategoryBody } from "@workspace/api-zod";

router.post("/", requireAdmin, validateRequest({ body: CreateCategoryBody }), async (req, res) => {
  try {
    const { name, description } = req.body;
    const [category] = await db
      .insert(categoriesTable)
      .values({ name, description })
      .returning();
    res.status(201).json({ ...category, resourceCount: 0 });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to create category" });
  }
});

export default router;
