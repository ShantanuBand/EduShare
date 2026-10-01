import { Router } from "express";
import { db, ratingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, async (req, res) => {
  try {
    const resourceId = Number(req.params.id);
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res
        .status(400)
        .json({ error: "Validation error", message: "Rating must be 1-5" });
      return;
    }

    const existing = await db
      .select()
      .from(ratingsTable)
      .where(
        and(
          eq(ratingsTable.userId, req.session.userId),
          eq(ratingsTable.resourceId, resourceId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(ratingsTable)
        .set({ rating: Number(rating) })
        .where(eq(ratingsTable.id, existing[0].id));
    } else {
      await db
        .insert(ratingsTable)
        .values({
          userId: req.session.userId,
          resourceId,
          rating: Number(rating),
        });
    }

    res.json({ message: "Rating saved" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to save rating" });
  }
});

export default router;
