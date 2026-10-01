import { Router } from "express";
import { db, likesTable, resourcesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const [resource] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.id, resourceId));

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const [existing] = await db
      .select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.userId, req.session.userId),
          eq(likesTable.resourceId, resourceId)
        )
      );

    if (existing) {
      return res.status(400).json({ message: "Already liked" });
    }

    await db.insert(likesTable).values({
      userId: req.session.userId,
      resourceId,
    });

    res.json({ message: "Liked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    await db
      .delete(likesTable)
      .where(
        and(
          eq(likesTable.userId, req.session.userId),
          eq(likesTable.resourceId, resourceId)
        )
      );
    res.json({ message: "Unliked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
