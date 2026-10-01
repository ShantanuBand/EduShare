import { Router } from "express";
import {
  db,
  resourcesTable,
  usersTable,
  collegesTable,
  categoriesTable,
  ratingsTable,
  bookmarksTable,
} from "@workspace/db";
import { eq, and, ilike, sql, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { 
  ListResourcesQueryParams, 
  CreateResourceBody, 
  GetResourceParams, 
  UpdateResourceParams, 
  UpdateResourceBody, 
  DeleteResourceParams, 
  IncrementDownloadParams 
} from "@workspace/api-zod";

const router = Router();

router.get("/", validateRequest({ query: ListResourcesQueryParams }), async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const collegeId = req.query.collegeId
      ? Number(req.query.collegeId)
      : undefined;
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined;
    const branch = req.query.branch;
    const semester = req.query.semester
      ? Number(req.query.semester)
      : undefined;
    const fileType = req.query.fileType;
    const sortBy = req.query.sortBy || "newest";

    const topic = req.query.topic;
    const academicYear = req.query.academicYear ? Number(req.query.academicYear) : undefined;
    const examType = req.query.examType;

    const conditions = [eq(resourcesTable.status, "approved")];

    if (search) {
      conditions.push(
        sql`(${resourcesTable.title} ilike ${"%" + search + "%"} OR ${resourcesTable.description} ilike ${"%" + search + "%"} OR ${resourcesTable.subject} ilike ${"%" + search + "%"})`,
      );
    }
    if (collegeId) conditions.push(eq(resourcesTable.collegeId, collegeId));
    if (categoryId) conditions.push(eq(resourcesTable.categoryId, categoryId));
    if (branch) conditions.push(ilike(resourcesTable.branch, `%${branch}%`));
    if (semester) conditions.push(eq(resourcesTable.semester, semester));
    if (fileType) conditions.push(eq(resourcesTable.fileType, fileType));
    if (topic) conditions.push(ilike(resourcesTable.topic, `%${topic}%`));
    if (academicYear) conditions.push(eq(resourcesTable.academicYear, academicYear));
    if (examType) conditions.push(eq(resourcesTable.examType, examType));

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    let orderBy;
    switch (sortBy) {
      case "popular":
        orderBy = desc(resourcesTable.viewCount);
        break;
      case "mostDownloaded":
        orderBy = desc(resourcesTable.downloadCount);
        break;
      case "topRated":
        orderBy = desc(
          sql`(SELECT COALESCE(AVG(r.rating), 0) FROM ratings r WHERE r.resource_id = ${resourcesTable.id})`,
        );
        break;
      default:
        orderBy = desc(resourcesTable.createdAt);
    }

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(resourcesTable)
      .where(where);
    const total = Number(count);

    const rawResources = await db
      .select()
      .from(resourcesTable)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const userId = req.session.userId;
    const bookmarkedIds = userId
      ? (
          await db
            .select({ resourceId: bookmarksTable.resourceId })
            .from(bookmarksTable)
            .where(eq(bookmarksTable.userId, userId))
        ).map((b) => b.resourceId)
      : [];

    let likedIds = [];
    if (userId) {
      const likesTable = (await import("@workspace/db")).likesTable;
      likedIds = (
        await db
          .select({ resourceId: likesTable.resourceId })
          .from(likesTable)
          .where(eq(likesTable.userId, userId))
      ).map((l) => l.resourceId);
    }

    let resources = [];
    if (rawResources.length > 0) {
      const uploaderIds = [...new Set(rawResources.map((r) => r.uploaderId).filter(Boolean))];
      const collegeIds = [...new Set(rawResources.map((r) => r.collegeId).filter(Boolean))];
      const categoryIds = [...new Set(rawResources.map((r) => r.categoryId).filter(Boolean))];
      const resourceIds = rawResources.map((r) => r.id);

      const [users, colleges, categories, allRatings, likesTableObj] = await Promise.all([
        uploaderIds.length > 0 ? db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, uploaderIds)) : [],
        collegeIds.length > 0 ? db.select({ id: collegesTable.id, name: collegesTable.name }).from(collegesTable).where(inArray(collegesTable.id, collegeIds)) : [],
        categoryIds.length > 0 ? db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable).where(inArray(categoriesTable.id, categoryIds)) : [],
        db.select({ resourceId: ratingsTable.resourceId, rating: ratingsTable.rating }).from(ratingsTable).where(inArray(ratingsTable.resourceId, resourceIds)),
        import("@workspace/db").then(m => m.likesTable).catch(() => null)
      ]);

      const allLikes = likesTableObj ? await db
        .select({ resourceId: likesTableObj.resourceId, count: sql`count(*)` })
        .from(likesTableObj)
        .where(inArray(likesTableObj.resourceId, resourceIds))
        .groupBy(likesTableObj.resourceId) : [];

      const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
      const collegeMap = Object.fromEntries(colleges.map((c) => [c.id, c.name]));
      const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
      const likesMap = Object.fromEntries(allLikes.map((l) => [l.resourceId, Number(l.count)]));

      const ratingsByResource = {};
      for (const rt of allRatings) {
        if (!ratingsByResource[rt.resourceId]) ratingsByResource[rt.resourceId] = [];
        ratingsByResource[rt.resourceId].push(rt.rating);
      }

      resources = rawResources.map((r) => {
        const ratings = ratingsByResource[r.id] || [];
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

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
          topic: r.topic,
          academicYear: r.academicYear,
          examType: r.examType,
          tags: r.tags,
          downloadCount: r.downloadCount,
          viewCount: r.viewCount,
          status: r.status,
          uploaderId: r.uploaderId,
          uploaderName: userMap[r.uploaderId] || "Unknown",
          collegeId: r.collegeId,
          collegeName: collegeMap[r.collegeId] || null,
          categoryId: r.categoryId,
          categoryName: categoryMap[r.categoryId] || null,
          averageRating: avgRating,
          ratingCount: ratings.length,
          likesCount: likesMap[r.id] || 0,
          isLiked: likedIds.includes(r.id),
          isBookmarked: bookmarkedIds.includes(r.id),
          createdAt: r.createdAt,
        };
      });
    }

    res.json({ resources, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to list resources" });
  }
});

router.post("/", requireAuth, validateRequest({ body: CreateResourceBody }), async (req, res) => {
  try {
    const {
      title,
      description,
      fileName,
      fileType,
      fileSize,
      fileUrl,
      subject,
      branch,
      semester,
      topic,
      academicYear,
      examType,
      tags,
      categoryId,
      collegeId,
    } = req.body;

    const [resource] = await db
      .insert(resourcesTable)
      .values({
        title,
        description: description || null,
        fileName,
        fileType,
        fileSize: Number(fileSize),
        fileUrl,
        subject: subject || null,
        branch: branch || null,
        semester: semester ? Number(semester) : null,
        topic: topic || null,
        academicYear: academicYear ? Number(academicYear) : null,
        examType: examType || null,
        tags: tags || [],
        status: "approved",
        uploaderId: req.session.userId,
        collegeId: collegeId ? Number(collegeId) : null,
        categoryId: categoryId ? Number(categoryId) : null,
      })
      .returning();

    const uploader = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    res.status(201).json({
      ...resource,
      uploaderName: uploader[0]?.name || "Unknown",
      collegeName: null,
      categoryName: null,
      averageRating: null,
      ratingCount: 0,
      likesCount: 0,
      isLiked: false,
      isBookmarked: false,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to create resource" });
  }
});

router.get("/:id", validateRequest({ params: GetResourceParams }), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [resource] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.id, id))
      .limit(1);
    if (!resource) {
      res
        .status(404)
        .json({ error: "Not found", message: "Resource not found" });
      return;
    }

    await db
      .update(resourcesTable)
      .set({ viewCount: resource.viewCount + 1 })
      .where(eq(resourcesTable.id, id));

    const uploader = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, resource.uploaderId))
      .limit(1);
    const college = resource.collegeId
      ? await db
          .select({ name: collegesTable.name })
          .from(collegesTable)
          .where(eq(collegesTable.id, resource.collegeId))
          .limit(1)
      : [];
    const category = resource.categoryId
      ? await db
          .select({ name: categoriesTable.name })
          .from(categoriesTable)
          .where(eq(categoriesTable.id, resource.categoryId))
          .limit(1)
      : [];
    const ratings = await db
      .select({ rating: ratingsTable.rating })
      .from(ratingsTable)
      .where(eq(ratingsTable.resourceId, id));
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, rt) => sum + rt.rating, 0) / ratings.length
        : null;

    const userId = req.session.userId;
    const bookmarked = userId
      ? (
          await db
            .select()
            .from(bookmarksTable)
            .where(
              and(
                eq(bookmarksTable.userId, userId),
                eq(bookmarksTable.resourceId, id),
              ),
            )
            .limit(1)
        ).length > 0
      : false;

    const userRating = userId
      ? (
          await db
            .select({ rating: ratingsTable.rating })
            .from(ratingsTable)
            .where(
              and(
                eq(ratingsTable.userId, userId),
                eq(ratingsTable.resourceId, id),
              ),
            )
            .limit(1)
        )[0]?.rating || null
      : null;

    let likesCount = 0;
    let isLiked = false;
    try {
      const likesTable = (await import("@workspace/db")).likesTable;
      const [{ count: lCount }] = await db
        .select({ count: sql`count(*)` })
        .from(likesTable)
        .where(eq(likesTable.resourceId, id));
      likesCount = Number(lCount);

      if (userId) {
        const userLike = await db
          .select()
          .from(likesTable)
          .where(
            and(
              eq(likesTable.userId, userId),
              eq(likesTable.resourceId, id)
            )
          )
          .limit(1);
        isLiked = userLike.length > 0;
      }
    } catch (e) {}

    const { commentsTable } = await import("@workspace/db");
    const rawComments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.resourceId, id))
      .orderBy(desc(commentsTable.createdAt));
    const comments = await Promise.all(
      rawComments.map(async (c) => {
        const u = await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, c.userId))
          .limit(1);
        return { ...c, userName: u[0]?.name || "Unknown" };
      }),
    );

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
      topic: resource.topic,
      academicYear: resource.academicYear,
      examType: resource.examType,
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
      likesCount: likesCount,
      isLiked: isLiked,
      createdAt: resource.createdAt,
      comments,
      userRating,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to get resource" });
  }
});

router.put("/:id", requireAuth, validateRequest({ params: UpdateResourceParams, body: UpdateResourceBody }), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.id, id))
      .limit(1);
    if (!existing) {
      res
        .status(404)
        .json({ error: "Not found", message: "Resource not found" });
      return;
    }
    if (
      existing.uploaderId !== req.session.userId &&
      req.session.userRole !== "admin"
    ) {
      res.status(403).json({ error: "Forbidden", message: "Not authorized" });
      return;
    }

    const { title, description, subject, branch, semester, tags, categoryId } =
      req.body;
    const [updated] = await db
      .update(resourcesTable)
      .set({
        title: title || existing.title,
        description: description ?? existing.description,
        subject: subject ?? existing.subject,
        branch: branch ?? existing.branch,
        semester: semester != null ? Number(semester) : existing.semester,
        tags: tags || existing.tags,
        categoryId:
          categoryId != null ? Number(categoryId) : existing.categoryId,
        updatedAt: new Date(),
      })
      .where(eq(resourcesTable.id, id))
      .returning();

    res.json({
      ...updated,
      uploaderName: "Unknown",
      collegeName: null,
      categoryName: null,
      averageRating: null,
      ratingCount: 0,
      isBookmarked: false,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to update resource" });
  }
});

router.delete("/:id", requireAuth, validateRequest({ params: DeleteResourceParams }), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.id, id))
      .limit(1);
    if (!existing) {
      res
        .status(404)
        .json({ error: "Not found", message: "Resource not found" });
      return;
    }
    if (
      existing.uploaderId !== req.session.userId &&
      req.session.userRole !== "admin"
    ) {
      res.status(403).json({ error: "Forbidden", message: "Not authorized" });
      return;
    }
    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.json({ message: "Resource deleted" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to delete resource" });
  }
});

router.post("/:id/download", validateRequest({ params: IncrementDownloadParams }), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db
      .update(resourcesTable)
      .set({ downloadCount: sql`${resourcesTable.downloadCount} + 1` })
      .where(eq(resourcesTable.id, id));
    res.json({ message: "Download recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed" });
  }
});

export default router;
