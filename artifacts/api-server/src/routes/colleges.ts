import { Router } from "express";
import { db, collegesTable, usersTable, resourcesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const colleges = await db.select().from(collegesTable).orderBy(collegesTable.name);
    const result = await Promise.all(colleges.map(async (c) => {
      const [{ count: memberCount }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.collegeId, c.id));
      const [{ count: resourceCount }] = await db.select({ count: sql<number>`count(*)` }).from(resourcesTable).where(eq(resourcesTable.collegeId, c.id));
      return { ...c, memberCount: Number(memberCount), resourceCount: Number(resourceCount) };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to list colleges" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, domain, city, state } = req.body;
    if (!name) {
      res.status(400).json({ error: "Validation error", message: "Name is required" });
      return;
    }
    const [college] = await db.insert(collegesTable).values({ name, domain, city, state }).returning();
    res.status(201).json({ ...college, memberCount: 0, resourceCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to create college" });
  }
});

export default router;
