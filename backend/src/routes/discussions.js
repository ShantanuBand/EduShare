import { Router } from "express";
import { db, discussionsTable, discussionCommentsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rawDiscussions = await db
      .select()
      .from(discussionsTable)
      .orderBy(desc(discussionsTable.createdAt));
      
    const discussions = await Promise.all(
      rawDiscussions.map(async (d) => {
        const u = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, d.authorId)).limit(1);
        return { ...d, authorName: u[0]?.name || "Unknown" };
      })
    );
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const [discussion] = await db
      .insert(discussionsTable)
      .values({
        title,
        content,
        authorId: req.session.userId,
      })
      .returning();
    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [discussion] = await db.select().from(discussionsTable).where(eq(discussionsTable.id, id)).limit(1);
    if (!discussion) return res.status(404).json({ message: "Not found" });
    
    const u = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, discussion.authorId)).limit(1);
    
    const rawComments = await db.select().from(discussionCommentsTable).where(eq(discussionCommentsTable.discussionId, id)).orderBy(desc(discussionCommentsTable.createdAt));
    const comments = await Promise.all(
      rawComments.map(async (c) => {
        const cu = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, c.authorId)).limit(1);
        return { ...c, authorName: cu[0]?.name || "Unknown" };
      })
    );

    res.json({ ...discussion, authorName: u[0]?.name || "Unknown", comments });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;
    const [comment] = await db
      .insert(discussionCommentsTable)
      .values({
        discussionId: id,
        content,
        authorId: req.session.userId,
      })
      .returning();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
