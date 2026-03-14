import { Router } from "express";
import { db, usersTable, resourcesTable, collegesTable, bookmarksTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not found", message: "User not found" });
      return;
    }

    let collegeName: string | null = null;
    if (user.collegeId) {
      const col = await db.select({ name: collegesTable.name }).from(collegesTable).where(eq(collegesTable.id, user.collegeId)).limit(1);
      collegeName = col[0]?.name || null;
    }

    const [{ count: uploadCount }] = await db.select({ count: sql<number>`count(*)` }).from(resourcesTable).where(eq(resourcesTable.uploaderId, user.id));
    const [{ total: downloadCount }] = await db.select({ total: sql<number>`coalesce(sum(download_count), 0)` }).from(resourcesTable).where(eq(resourcesTable.uploaderId, user.id));

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      collegeId: user.collegeId,
      collegeName,
      uploadCount: Number(uploadCount),
      downloadCount: Number(downloadCount),
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to get profile" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, branch, semester, collegeId } = req.body;
    const [user] = await db.update(usersTable).set({
      name: name || undefined,
      branch: branch ?? undefined,
      semester: semester != null ? Number(semester) : undefined,
      collegeId: collegeId != null ? Number(collegeId) : undefined,
    }).where(eq(usersTable.id, req.session.userId!)).returning();

    let collegeName: string | null = null;
    if (user.collegeId) {
      const col = await db.select({ name: collegesTable.name }).from(collegesTable).where(eq(collegesTable.id, user.collegeId)).limit(1);
      collegeName = col[0]?.name || null;
    }

    const [{ count: uploadCount }] = await db.select({ count: sql<number>`count(*)` }).from(resourcesTable).where(eq(resourcesTable.uploaderId, user.id));
    const [{ total: downloadCount }] = await db.select({ total: sql<number>`coalesce(sum(download_count), 0)` }).from(resourcesTable).where(eq(resourcesTable.uploaderId, user.id));

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      collegeId: user.collegeId,
      collegeName,
      uploadCount: Number(uploadCount),
      downloadCount: Number(downloadCount),
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to update profile" });
  }
});

router.get("/:id/resources", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const resources = await db.select().from(resourcesTable).where(eq(resourcesTable.uploaderId, userId)).orderBy(desc(resourcesTable.createdAt));
    res.json(resources.map(r => ({
      ...r,
      uploaderName: "Unknown",
      collegeName: null,
      categoryName: null,
      averageRating: null,
      ratingCount: 0,
      isBookmarked: false,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to get user resources" });
  }
});

export default router;
