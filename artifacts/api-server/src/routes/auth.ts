import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, collegesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, collegeName, branch, semester } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Validation error", message: "Name, email, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Validation error", message: "Password must be at least 6 characters" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Validation error", message: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let collegeId: number | null = null;
    if (collegeName) {
      const existingCollege = await db.select().from(collegesTable).where(eq(collegesTable.name, collegeName)).limit(1);
      if (existingCollege.length > 0) {
        collegeId = existingCollege[0].id;
      } else {
        const [newCollege] = await db.insert(collegesTable).values({ name: collegeName }).returning();
        collegeId = newCollege.id;
      }
    }

    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      branch: branch || null,
      semester: semester ? Number(semester) : null,
      collegeId,
    }).returning();

    req.session.userId = user.id;
    req.session.userRole = user.role;

    let collegeName2: string | null = null;
    if (collegeId) {
      const col = await db.select().from(collegesTable).where(eq(collegesTable.id, collegeId)).limit(1);
      collegeName2 = col[0]?.name || null;
    }

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        collegeId: user.collegeId,
        collegeName: collegeName2,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
      message: "Registration successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Validation error", message: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials", message: "Invalid email or password" });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: "Blocked", message: "Your account has been blocked" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials", message: "Invalid email or password" });
      return;
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    let collegeName: string | null = null;
    if (user.collegeId) {
      const col = await db.select().from(collegesTable).where(eq(collegesTable.id, user.collegeId)).limit(1);
      collegeName = col[0]?.name || null;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        collegeId: user.collegeId,
        collegeName,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not found", message: "User not found" });
      return;
    }

    let collegeName: string | null = null;
    if (user.collegeId) {
      const col = await db.select().from(collegesTable).where(eq(collegesTable.id, user.collegeId)).limit(1);
      collegeName = col[0]?.name || null;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      collegeId: user.collegeId,
      collegeName,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: "Failed to get user" });
  }
});

export default router;
