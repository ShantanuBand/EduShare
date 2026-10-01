import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { type, targetId, reason } = req.body;
    const [report] = await db
      .insert(reportsTable)
      .values({
        type,
        targetId,
        reason,
        reporterId: req.session.userId,
      })
      .returning();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const reports = await db
      .select()
      .from(reportsTable)
      .orderBy(desc(reportsTable.createdAt));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [report] = await db
      .update(reportsTable)
      .set({ status })
      .where(eq(reportsTable.id, id))
      .returning();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
