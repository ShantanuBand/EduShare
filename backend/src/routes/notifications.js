import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.session.userId))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/read", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, id));
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
