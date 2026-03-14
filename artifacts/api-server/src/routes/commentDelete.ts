import { Router } from "express";
import { db, commentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(commentsTable).where(eq(commentsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Not found", message: "Comment not found" });
      return;
    }
    if (existing.userId !== req.session.userId && req.session.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Not authorized" });
      return;
    }
    await db.delete(commentsTable).where(eq(commentsTable.id, id));
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to delete comment" });
  }
});

export default router;
