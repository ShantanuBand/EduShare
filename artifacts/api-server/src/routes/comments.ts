import { Router } from "express";
import { db, commentsTable, resourcesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const resourceId = Number(req.params.id);
    const raw = await db.select().from(commentsTable).where(eq(commentsTable.resourceId, resourceId)).orderBy(desc(commentsTable.createdAt));
    const comments = await Promise.all(raw.map(async (c) => {
      const u = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
      return { ...c, userName: u[0]?.name || "Unknown" };
    }));
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to list comments" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const resourceId = Number(req.params.id);
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "Validation error", message: "Content is required" });
      return;
    }
    const [comment] = await db.insert(commentsTable).values({
      content,
      userId: req.session.userId!,
      resourceId,
    }).returning();

    const u = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    res.status(201).json({ ...comment, userName: u[0]?.name || "Unknown" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to add comment" });
  }
});

export default router;
