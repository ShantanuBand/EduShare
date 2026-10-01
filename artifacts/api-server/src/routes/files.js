import { Router } from "express";
import { db, filesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) return res.status(400).json({ error: "Invalid file ID" });

    const [file] = await db.select().from(filesTable).where(eq(filesTable.id, fileId)).limit(1);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // fileData is 'data:<mimetype>;base64,<base64data>'
    const match = file.fileData.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      return res.status(500).json({ error: "Invalid file format in DB" });
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", buffer.length);
    // Security headers to prevent XSS
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `inline; filename="${file.fileName}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
