import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db, resourcesTable, filesTable, collegesTable } from "@workspace/db";
import { eq, ilike, and, or } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import multer from "multer";

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB practically unlimited for PDF
});

router.post("/extract-text", requireAuth, (req, res, next) => {
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
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    console.log("File received:", req.file.originalname, "Size:", req.file.size, "Buffer exists:", !!req.file.buffer, "Type of buffer:", typeof req.file.buffer);
    
    if (!req.file.buffer) {
        throw new Error("No buffer found in req.file");
    }

    const { fileTypeFromBuffer } = await import("file-type");
    const type = await fileTypeFromBuffer(req.file.buffer);
    
    if (!type || type.mime !== "application/pdf") {
      return res.status(400).json({ error: "Invalid file type. Only PDF is allowed for extraction." });
    }

    const pdfData = await pdfParse(req.file.buffer);
    let text = pdfData.text;
    res.json({ text, fileName: req.file.originalname });
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: "Failed to read PDF" });
  }
});

// System prompt for EduShare Assistant
const SYSTEM_PROMPT = `
You are the EduShare AI Assistant. You help students find study materials, understand notes, and navigate the EduShare platform.
CRITICAL RULES:
1. ALWAYS use the provided tools to search for notes or colleges. NEVER invent notes, colleges, or users.
2. If the user asks a question about a specific document (e.g. summarize, MCQs, explain), and document context is provided, answer ONLY based on the document. Do not hallucinate outside information unless explicitly asked to expand.
3. If no document is selected and the user asks to summarize or quiz, tell them to select a document first.
4. If a search yields no results, politely tell the user that no matching resources were found on EduShare.
5. You can answer general platform questions (e.g., how to upload, bookmark, etc.).
`;

// Intent / Tool Declarations
const searchNotesDeclaration = {
  name: "search_edushare_notes",
  description: "Search the EduShare database for notes, study materials, or previous year questions.",
  parameters: {
    type: "OBJECT",
    properties: {
      query: { type: "STRING", description: "The search query (e.g., 'DBMS', 'Operating Systems')" },
      university: { type: "STRING", description: "Filter by university name if mentioned" },
      semester: { type: "INTEGER", description: "Filter by semester number (e.g., 5)" },
    }
  }
};

const searchUniversitiesDeclaration = {
  name: "search_colleges_universities",
  description: "Search the EduShare database for colleges or universities.",
  parameters: {
    type: "OBJECT",
    properties: {
      city: { type: "STRING", description: "Filter by city" },
      university: { type: "STRING", description: "Filter by university name" }
    }
  }
};

router.post("/assist", requireAuth, async (req, res) => {
  try {
    const { resourceId, fileId, directText, prompt, action, history } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ response: "AI is not configured. Missing API key." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let documentText = directText || "";
    let documentContext = "";

    // Determine the actual fileId to use
    let targetFileId = fileId;
    let documentTitle = req.body.documentTitle || "Uploaded Document";

    // If a resource is selected, fetch its text
    if (resourceId && !targetFileId && !directText) {
      const [resource] = await db
        .select()
        .from(resourcesTable)
        .where(eq(resourcesTable.id, resourceId));

      if (resource && resource.fileUrl && resource.fileUrl.includes("/api/files/")) {
        targetFileId = parseInt(resource.fileUrl.split("/api/files/")[1], 10);
        documentTitle = resource.title;
      }
    }

    if (targetFileId && !isNaN(targetFileId)) {
      const [fileRecord] = await db
        .select()
        .from(filesTable)
        .where(eq(filesTable.id, targetFileId));

      if (fileRecord && fileRecord.fileData) {
        // Extract base64
        const b64Data = fileRecord.fileData.split(",")[1];
        if (b64Data) {
          const buffer = Buffer.from(b64Data, "base64");
          try {
            const pdfData = await pdfParse(buffer);
            documentText = pdfData.text;
            documentTitle = fileRecord.fileName || documentTitle;
            documentContext = `\n\n--- CURRENT SELECTED DOCUMENT: ${documentTitle} ---\n${documentText}\n--- END OF DOCUMENT ---\n`;
          } catch (parseErr) {
            console.error("PDF parse error:", parseErr);
            documentContext = `\n\n[Error: Could not extract text from the selected document]`;
          }
        }
      }
    }

    if (directText && !documentContext) {
      documentContext = `\n\n--- CURRENT SELECTED DOCUMENT: ${documentTitle} ---\n${documentText}\n--- END OF DOCUMENT ---\n`;
    }

    // Build the messages array for Gemini
    const contents = [];
    
    // Convert frontend history to Gemini format (if provided)
    // Format: { role: "user" | "model", parts: [{ text: "..." }] }
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "assistant" || msg.role === "model") {
          contents.push({ role: "model", parts: [{ text: msg.content }] });
        } else if (msg.role === "user") {
          contents.push({ role: "user", parts: [{ text: msg.content }] });
        }
      }
    }

    // Append the current prompt
    let finalPrompt = prompt;
    if (action === "summarize") {
      finalPrompt = "Please summarize the selected document in bullet points.";
    } else if (action === "mcq") {
      finalPrompt = "Generate 3-5 multiple choice questions based on the selected document.";
    } else if (action === "flashcards") {
      finalPrompt = "Generate flashcards from the selected document. Format them as Q: ... A: ...";
    }

    if (documentContext) {
      finalPrompt += documentContext;
    }

    contents.push({ role: "user", parts: [{ text: finalPrompt }] });

    // Call Gemini with tools
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        tools: [{
          functionDeclarations: [searchNotesDeclaration, searchUniversitiesDeclaration]
        }]
      }
    });

    let assistantReply = "";
    
    // Handle Function Calling
    if (response.functionCalls && response.functionCalls.length > 0) {
      // For MVP, we handle the first function call, execute it, and pass result back
      const call = response.functionCalls[0];
      let toolResult = "";

      if (call.name === "search_edushare_notes") {
        const { query, university, semester } = call.args;
        let dbQuery = db.select().from(resourcesTable);
        const conditions = [eq(resourcesTable.status, "approved")];
        
        if (query) {
          conditions.push(ilike(resourcesTable.title, `%${query}%`));
        }
        if (semester) {
          conditions.push(eq(resourcesTable.semester, semester));
        }
        
        const results = await dbQuery.where(and(...conditions)).limit(5);
        
        if (results.length > 0) {
          toolResult = JSON.stringify(results.map(r => ({ id: r.id, title: r.title, subject: r.subject, semester: r.semester })));
        } else {
          toolResult = "No notes found matching the criteria.";
        }
      } else if (call.name === "search_colleges_universities") {
        const { city, university } = call.args;
        const conditions = [];
        if (city) conditions.push(ilike(collegesTable.city, `%${city}%`));
        if (university) conditions.push(ilike(collegesTable.university, `%${university}%`));
        
        let dbQuery = db.select().from(collegesTable);
        if (conditions.length > 0) {
          dbQuery = dbQuery.where(and(...conditions));
        }
        const results = await dbQuery.limit(10);
        
        if (results.length > 0) {
          toolResult = JSON.stringify(results.map(r => ({ name: r.name, city: r.city, university: r.university })));
        } else {
          toolResult = "No colleges found.";
        }
      }

      // Send the tool result back to Gemini to get the final response
      const followUpContents = [...contents];
      followUpContents.push({
        role: "model",
        parts: [{ functionCall: call }]
      });
      followUpContents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: call.name,
            response: { result: toolResult }
          }
        }]
      });

      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: followUpContents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.3
        }
      });
      
      assistantReply = finalResponse.text;
    } else {
      assistantReply = response.text;
    }

    res.json({ response: assistantReply });
    
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Failed to process AI request" });
  }
});

export default router;
