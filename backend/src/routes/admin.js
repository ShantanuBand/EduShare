import { Router } from "express";
import {
  db,
  usersTable,
  resourcesTable,
  collegesTable,
  categoriesTable,
  ratingsTable,
} from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAdmin);

router.get("/stats", async (req, res) => {
  try {
    const [{ totalUsers }] = await db
      .select({ totalUsers: sql`count(*)` })
      .from(usersTable);
    const [{ totalResources }] = await db
      .select({ totalResources: sql`count(*)` })
      .from(resourcesTable);
    const [{ totalDownloads }] = await db
      .select({ totalDownloads: sql`coalesce(sum(download_count), 0)` })
      .from(resourcesTable);
    const [{ totalColleges }] = await db
      .select({ totalColleges: sql`count(*)` })
      .from(collegesTable);
    const [{ pendingResources }] = await db
      .select({ pendingResources: sql`count(*)` })
      .from(resourcesTable)
      .where(eq(resourcesTable.status, "pending"));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [{ recentUploads }] = await db
      .select({ recentUploads: sql`count(*)` })
      .from(resourcesTable)
      .where(sql`created_at >= ${sevenDaysAgo}`);

    res.json({
      totalUsers: Number(totalUsers),
      totalResources: Number(totalResources),
      totalDownloads: Number(totalDownloads),
      totalColleges: Number(totalColleges),
      pendingResources: Number(pendingResources),
      recentUploads: Number(recentUploads),
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to get stats" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(usersTable);
    const total = Number(count);
    const users = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const result = await Promise.all(
      users.map(async (u) => {
        let collegeName = null;
        if (u.collegeId) {
          const col = await db
            .select({ name: collegesTable.name })
            .from(collegesTable)
            .where(eq(collegesTable.id, u.collegeId))
            .limit(1);
          collegeName = col[0]?.name || null;
        }
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          branch: u.branch,
          semester: u.semester,
          collegeId: u.collegeId,
          collegeName,
          isBlocked: u.isBlocked,
          createdAt: u.createdAt,
        };
      }),
    );

    res.json({
      users: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to list users" });
  }
});

router.put("/users/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isBlocked } = req.body;
    await db
      .update(usersTable)
      .set({ isBlocked: Boolean(isBlocked) })
      .where(eq(usersTable.id, id));
    res.json({ message: isBlocked ? "User blocked" : "User unblocked" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to update user" });
  }
});

router.get("/resources", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = db.select().from(resourcesTable);
    const countQuery = db.select({ count: sql`count(*)` }).from(resourcesTable);

    if (status) {
      query = query.where(eq(resourcesTable.status, status));
      countQuery.where(eq(resourcesTable.status, status));
    }

    const [{ count }] = await countQuery;
    const resources = await query
      .orderBy(desc(resourcesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const result = await Promise.all(
      resources.map(async (r) => {
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
          .where(eq(ratingsTable.resourceId, r.id));
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
          isBookmarked: false,
        };
      }),
    );

    res.json({
      resources: result,
      total: Number(count),
      page,
      totalPages: Math.ceil(Number(count) / limit),
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to list resources" });
  }
});

router.put("/resources/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res
        .status(400)
        .json({
          error: "Validation error",
          message: "Status must be approved or rejected",
        });
      return;
    }
    await db
      .update(resourcesTable)
      .set({ status })
      .where(eq(resourcesTable.id, id));
    res.json({ message: `Resource ${status}` });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        error: "Server error",
        message: "Failed to update resource status",
      });
  }
});

export default router;
