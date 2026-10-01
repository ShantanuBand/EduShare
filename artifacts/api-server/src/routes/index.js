import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import resourcesRouter from "./resources.js";
import commentsRouter from "./comments.js";
import commentDeleteRouter from "./commentDelete.js";
import ratingsRouter from "./ratings.js";
import bookmarksRouter from "./bookmarks.js";
import collegesRouter from "./colleges.js";
import categoriesRouter from "./categories.js";
import usersRouter from "./users.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/resources", resourcesRouter);
router.use("/resources/:id/comments", commentsRouter);
router.use("/comments", commentDeleteRouter);
router.use("/resources/:id/rating", ratingsRouter);
router.use("/bookmarks", bookmarksRouter);
router.use("/colleges", collegesRouter);
router.use("/categories", categoriesRouter);
router.use("/users", usersRouter);
router.use("/admin", adminRouter);

import likesRouter from "./likes.js";
import discussionsRouter from "./discussions.js";
import reportsRouter from "./reports.js";
import notificationsRouter from "./notifications.js";
import aiRouter from "./ai.js";
import uploadRouter from "./upload.js";
import filesRouter from "./files.js";

router.use("/resources/:id/like", likesRouter);
router.use("/discussions", discussionsRouter);
router.use("/reports", reportsRouter);
router.use("/notifications", notificationsRouter);
router.use("/ai", aiRouter);
router.use("/upload", uploadRouter);
router.use("/files", filesRouter);

export default router;
