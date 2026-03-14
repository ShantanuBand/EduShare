import { Router } from "express";
import { db, resourcesTable, usersTable, collegesTable, categoriesTable, ratingsTable, bookmarksTable } from "@workspace/db";
import { eq, and, ilike, sql, desc, asc, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const collegeId = req.query.collegeId ? Number(req.query.collegeId) : undefined;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const branch = req.query.branch as string | undefined;
    const semester = req.query.semester ? Number(req.query.semester) : undefined;
    const fileType = req.query.fileType as string | undefined;
    const sortBy = (req.query.sortBy as string) || "newest";

    const conditions: any[] = [eq(resourcesTable.status, "approved")];

    if (search) {
      conditions.push(
        sql`(${resourcesTable.title} ilike ${"%" + search + "%"} OR ${resourcesTable.description} ilike ${"%" + search + "%"} OR ${resourcesTable.subject} ilike ${"%" + search + "%"})`
      );
    }
    if (collegeId) conditions.push(eq(resourcesTable.collegeId, collegeId));
    if (categoryId) conditions.push(eq(resourcesTable.categoryId, categoryId));
    if (branch) conditions.push(ilike(resourcesTable.branch, `%${branch}%`));
    if (semester) conditions.push(eq(resourcesTable.semester, semester));
    if (fileType) conditions.push(eq(resourcesTable.fileType, fileType));

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    let orderBy: any;
    switch (sortBy) {
      case "popular":
        orderBy = desc(resourcesTable.viewCount);
        break;
      case "mostDownloaded":
        orderBy = desc(resourcesTable.downloadCount);
        break;
      case "topRated":
        orderBy = desc(sql`(SELECT COALESCE(AVG(r.rating), 0) FROM ratings r WHERE r.resource_id = ${resourcesTable.id})`);
        break;
      default:
        orderBy = desc(resourcesTable.createdAt);
    }

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(resourcesTable).where(where);
    const total = Number(count);

    const rawResources = await db.select().from(resourcesTable).where(where).orderBy(orderBy).limit(limit).offset(offset);

    const userId = req.session.userId;
    const bookmarkedIds = userId
      ? (await db.select({ resourceId: bookmarksTable.resourceId }).from(bookmarksTable).where(eq(bookmarksTable.userId, userId))).map(b => b.resourceId)
      : [];

    const resources = await Promise.all(rawResources.map(async (r) => {
      const uploader = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.uploaderId)).limit(1);
      const college = r.collegeId ? await db.select({ name: collegesTable.name }).from(collegesTable).where(eq(collegesTable.id, r.collegeId)).limit(1) : [];
      const category = r.categoryId ? await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, r.categoryId)).limit(1) : [];
      const ratings = await db.select({ rating: ratingsTable.rating }).from(ratingsTable).where(eq(ratingsTable.resourceId, r.id));
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, rt) => sum + rt.rating, 0) / ratings.length : null;

      return {
        id: r.id,
        title: r.title,
        description: r.description,
        fileName: r.fileName,
        fileType: r.fileType,
        fileSize: r.fileSize,
        fileUrl: r.fileUrl,
        subject: r.subject,
        branch: r.branch,
        semester: r.semester,
        tags: r.tags,
        downloadCount: r.downloadCount,
        viewCount: r.viewCount,
        status: r.status,
        uploaderId: r.uploaderId,
        uploaderName: uploader[0]?.name || "Unknown",
        collegeId: r.collegeId,
        collegeName: college[0]?.name || null,
        categoryId: r.categoryId,
        categoryName: category[0]?.name || null,
        averageRating: avgRating,
        ratingCount: ratings.length,
        isBookmarked: bookmarkedIds.includes(r.id),
        createdAt: r.createdAt,
      };
    }));

    res.json({ resources, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to list resources" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, fileName, fileType, fileSize, fileUrl, subject, branch, semester, tags, categoryId, collegeId } = req.body;

    if (!title || !fileName || !fileType || !fileSize || !fileUrl) {
      res.status(400).json({ error: "Validation error", message: "Title, fileName, fileType, fileSize, and fileUrl are required" });
      return;
    }

    const [resource] = await db.insert(resourcesTable).values({
      title,
      description: description || null,
      fileName,
      fileType,
      fileSize: Number(fileSize),
      fileUrl,
      subject: subject || null,
      branch: branch || null,
      semester: semester ? Number(semester) : null,
      tags: tags || [],
      status: "approved",
      uploaderId: req.session.userId!,
      collegeId: collegeId ? Number(collegeId) : null,
      categoryId: categoryId ? Number(categoryId) : null,
    }).returning();

    const uploader = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);

    res.status(201).json({
      ...resource,
      uploaderName: uploader[0]?.name || "Unknown",
      collegeName: null,
      categoryName: null,
      averageRating: null,
      ratingCount: 0,
      isBookmarked: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to create resource" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!resource) {
      res.status(404).json({ error: "Not found", message: "Resource not found" });
      return;
    }

    await db.update(resourcesTable).set({ viewCount: resource.viewCount + 1 }).where(eq(resourcesTable.id, id));

    const uploader = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, resource.uploaderId)).limit(1);
    const college = resource.collegeId ? await db.select({ name: collegesTable.name }).from(collegesTable).where(eq(collegesTable.id, resource.collegeId)).limit(1) : [];
    const category = resource.categoryId ? await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, resource.categoryId)).limit(1) : [];
    const ratings = await db.select({ rating: ratingsTable.rating }).from(ratingsTable).where(eq(ratingsTable.resourceId, id));
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, rt) => sum + rt.rating, 0) / ratings.length : null;

    const userId = req.session.userId;
    const bookmarked = userId
      ? (await db.select().from(bookmarksTable).where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.resourceId, id))).limit(1)).length > 0
      : false;

    const userRating = userId
      ? (await db.select({ rating: ratingsTable.rating }).from(ratingsTable).where(and(eq(ratingsTable.userId, userId), eq(ratingsTable.resourceId, id))).limit(1))[0]?.rating || null
      : null;

    const { commentsTable } = await import("@workspace/db");
    const rawComments = await db.select().from(commentsTable).where(eq(commentsTable.resourceId, id)).orderBy(desc(commentsTable.createdAt));
    const comments = await Promise.all(rawComments.map(async (c) => {
      const u = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
      return { ...c, userName: u[0]?.name || "Unknown" };
    }));

    res.json({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileName: resource.fileName,
      fileType: resource.fileType,
      fileSize: resource.fileSize,
      fileUrl: resource.fileUrl,
      subject: resource.subject,
      branch: resource.branch,
      semester: resource.semester,
      tags: resource.tags,
      downloadCount: resource.downloadCount,
      viewCount: resource.viewCount + 1,
      status: resource.status,
      uploaderId: resource.uploaderId,
      uploaderName: uploader[0]?.name || "Unknown",
      collegeId: resource.collegeId,
      collegeName: college[0]?.name || null,
      categoryId: resource.categoryId,
      categoryName: category[0]?.name || null,
      averageRating: avgRating,
      ratingCount: ratings.length,
      isBookmarked: bookmarked,
      createdAt: resource.createdAt,
      comments,
      userRating,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to get resource" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Not found", message: "Resource not found" });
      return;
    }
    if (existing.uploaderId !== req.session.userId && req.session.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Not authorized" });
      return;
    }

    const { title, description, subject, branch, semester, tags, categoryId } = req.body;
    const [updated] = await db.update(resourcesTable).set({
      title: title || existing.title,
      description: description ?? existing.description,
      subject: subject ?? existing.subject,
      branch: branch ?? existing.branch,
      semester: semester != null ? Number(semester) : existing.semester,
      tags: tags || existing.tags,
      categoryId: categoryId != null ? Number(categoryId) : existing.categoryId,
      updatedAt: new Date(),
    }).where(eq(resourcesTable.id, id)).returning();

    res.json({ ...updated, uploaderName: "Unknown", collegeName: null, categoryName: null, averageRating: null, ratingCount: 0, isBookmarked: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to update resource" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Not found", message: "Resource not found" });
      return;
    }
    if (existing.uploaderId !== req.session.userId && req.session.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Not authorized" });
      return;
    }
    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.json({ message: "Resource deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to delete resource" });
  }
});

router.post("/:id/download", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.update(resourcesTable).set({ downloadCount: sql`${resourcesTable.downloadCount} + 1` }).where(eq(resourcesTable.id, id));
    res.json({ message: "Download recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed" });
  }
});

export default router;
