import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

import { db, filesTable } from "@workspace/db";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

router.post("/", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "Unknown upload error" });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { fileTypeFromBuffer } = await import("file-type");
    const type = await fileTypeFromBuffer(req.file.buffer);
    
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    
    // Fallback logic for text-based files that file-type can't detect easily (optional, but let's stick to safe binaries)
    if (!type || !allowedMimeTypes.includes(type.mime)) {
      return res.status(400).json({ error: "Invalid file type. Only PDF and images are allowed." });
    }
    
    // Store as base64 using the verified mime type
    const fileData = `data:${type.mime};base64,${req.file.buffer.toString('base64')}`;
    
    // Insert into DB
    const [insertedFile] = await db.insert(filesTable).values({
      fileName: req.file.originalname,
      fileType: type.mime,
      fileSize: req.file.size,
      fileData: fileData
    }).returning();
    
    // We will serve this file via a new endpoint /api/files/:id
    const fileUrl = `/api/files/${insertedFile.id}`;
    const fullUrl = `${req.protocol}://${req.get("host")}${fileUrl}`;
    
    res.status(200).json({
      url: fullUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: type.mime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
