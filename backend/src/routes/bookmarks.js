import { Router } from "express";
import {
  db,
  bookmarksTable,
  resourcesTable,
  usersTable,
  collegesTable,
  categoriesTable,
  ratingsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userBookmarks = await db
      .select({ resourceId: bookmarksTable.resourceId })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, req.session.userId));
    const resourceIds = userBookmarks.map((b) => b.resourceId);

    if (resourceIds.length === 0) {
      res.json([]);
      return;
    }

    const resources = await Promise.all(
      resourceIds.map(async (rid) => {
        const [r] = await db
          .select()
          .from(resourcesTable)
          .where(eq(resourcesTable.id, rid))
          .limit(1);
        if (!r) return null;
        const uploader = await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, r.uploaderId))
          .limit(1);
        const college = r.collegeId
          ? await db
              .select({ name: collegesTable.name })
              .from(collegesTable)
              .where(eq(collegesTable.id, r.collegeId))
              .limit(1)
          : [];
        const category = r.categoryId
          ? await db
              .select({ name: categoriesTable.name })
              .from(categoriesTable)
              .where(eq(categoriesTable.id, r.categoryId))
              .limit(1)
          : [];
        const ratings = await db
          .select({ rating: ratingsTable.rating })
          .from(ratingsTable)
          .where(eq(ratingsTable.resourceId, rid));
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, rt) => sum + rt.rating, 0) / ratings.length
            : null;
        return {
          ...r,
          uploaderName: uploader[0]?.name || "Unknown",
          collegeName: college[0]?.name || null,
          categoryName: category[0]?.name || null,
          averageRating: avgRating,
          ratingCount: ratings.length,
          isBookmarked: true,
        };
      }),
    );

    res.json(resources.filter(Boolean));
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to get bookmarks" });
  }
});

router.post("/:resourceId", requireAuth, async (req, res) => {
  try {
    const resourceId = Number(req.params.resourceId);
    const existing = await db
      .select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.userId, req.session.userId),
          eq(bookmarksTable.resourceId, resourceId),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      await db
        .insert(bookmarksTable)
        .values({ userId: req.session.userId, resourceId });
    }
    res.json({ message: "Bookmarked" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to bookmark" });
  }
});

router.delete("/:resourceId", requireAuth, async (req, res) => {
  try {
    const resourceId = Number(req.params.resourceId);
    await db
      .delete(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.userId, req.session.userId),
          eq(bookmarksTable.resourceId, resourceId),
        ),
      );
    res.json({ message: "Bookmark removed" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to remove bookmark" });
  }
});

export default router;
