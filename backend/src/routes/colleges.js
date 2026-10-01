import { Router } from "express";
import { db, collegesTable, usersTable, resourcesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const colleges = await db
      .select()
      .from(collegesTable)
      .orderBy(collegesTable.city, collegesTable.university, collegesTable.name);
      
    // Remove the N+1 queries for memberCount and resourceCount as they are unused by the frontend 
    // and cause a 30+ second DB timeout when 500+ colleges exist.
    const result = colleges.map(c => ({
      ...c,
      memberCount: 0,
      resourceCount: 0
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to list colleges" });
  }
});

import { validateRequest } from "../middleware/validate.js";
import { CreateCollegeBody } from "@workspace/api-zod";

router.post("/", requireAdmin, validateRequest({ body: CreateCollegeBody }), async (req, res) => {
  try {
    const { name, domain, city, state, university } = req.body;
    const [college] = await db
      .insert(collegesTable)
      .values({ name, domain, city, state, university })
      .returning();
    res.status(201).json({ ...college, memberCount: 0, resourceCount: 0 });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", message: "Failed to create college" });
  }
});

export default router;
