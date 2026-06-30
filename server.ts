import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to avoid crashing if key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Popular Trains Schedules for ticket parser cross-referencing
const POPULAR_TRAINS: Record<string, { name: string; route: string; scheduledDep: string }> = {
  "12002": { name: "New Delhi Bhopal Shatabdi Express", route: "NDLS to BPL", scheduledDep: "06:00 AM" },
  "12626": { name: "Kerala Express", route: "NDLS to TVC", scheduledDep: "11:25 AM" },
  "12952": { name: "Mumbai Rajdhani Express", route: "NDLS to MMCT", scheduledDep: "04:55 PM" },
  "12050": { name: "Gatimaan Express", route: "NZM to AGC", scheduledDep: "08:10 AM" },
  "12302": { name: "Howrah Rajdhani Express", route: "NDLS to HWH", scheduledDep: "04:50 PM" },
};

// 2. Gemini AI Task Suggestions Endpoint
// Helper function to retry Gemini requests if there is a transient 503 or demand/limit issue
async function generateContentWithRetry(ai: any, params: any, maxRetries = 2, delayMs = 1200): Promise<any> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorStr = String(error.message || error || "");
      const isTransient =
        errorStr.includes("503") ||
        errorStr.includes("demand") ||
        errorStr.includes("UNAVAILABLE") ||
        errorStr.includes("500") ||
        errorStr.includes("ResourceExhausted") ||
        errorStr.includes("rate limit");

      if (isTransient && attempt < maxRetries) {
        attempt++;
        console.warn(`[Gemini API] Server reported high demand or resource exhaustion (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// Helper to convert 12-hour/flexible time formats to HH:MM format
function convertTo24Hour(timeStr: string): string {
  if (!timeStr) return "12:00";
  const clean = timeStr.trim().toUpperCase();
  
  // Try matching HH:MM AM/PM
  const matchAmpm = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/);
  if (matchAmpm) {
    let hours = parseInt(matchAmpm[1], 10);
    const minutes = matchAmpm[2];
    const ampm = matchAmpm[3];
    if (ampm === "PM" && hours < 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Try matching standard HH:MM
  const matchStandard = clean.match(/^(\d+):(\d+)/);
  if (matchStandard) {
    const hours = Math.min(23, Math.max(0, parseInt(matchStandard[1], 10)));
    const minutes = matchStandard[2].substring(0, 2);
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  return "12:00";
}

// 1.5 Parse Ticket Endpoint
// Accepts base64 encoded ticket file (.img, .pdf, .txt) and extracts train details using Gemini AI.
app.post("/api/parse-ticket", async (req, res) => {
  const { base64Data, mimeType, fileName } = req.body;

  if (!base64Data) {
    return res.status(400).json({ error: "No base64 file data provided" });
  }

  // 1. Try to extract using Gemini if available
  const ai = getAiClient();
  if (ai) {
    try {
      let part: any;
      if (mimeType && (mimeType.startsWith("text/") || mimeType === "application/json")) {
        const textContent = Buffer.from(base64Data, "base64").toString("utf-8");
        part = { text: `Please parse this ticket contents and extract details:\n\n${textContent}` };
      } else {
        part = {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || "image/png"
          }
        };
      }

      const prompt = `
Analyze this ticket file. Extract the following details:
- Train Number: must be a 5-digit number (e.g. "12002", "12626") if visible.
- Departure Date: date of departure in YYYY-MM-DD format if visible.
- Departure Time: time of departure in HH:MM format if visible.

Output your response strictly as a JSON object matching the requested schema.
`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: [part, prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trainNumber: { type: Type.STRING, description: "The 5-digit train number or null" },
              departureDate: { type: Type.STRING, description: "Departure date in YYYY-MM-DD or null" },
              departureTime: { type: Type.STRING, description: "Departure time in HH:MM format or null" }
            },
            required: ["trainNumber", "departureDate", "departureTime"]
          }
        }
      });

      const text = response.text || "";
      const parsed = JSON.parse(text.trim());

      let trainNumber = parsed.trainNumber ? String(parsed.trainNumber).trim() : null;
      let departureDate = parsed.departureDate ? String(parsed.departureDate).trim() : null;
      let departureTime = parsed.departureTime ? String(parsed.departureTime).trim() : null;

      // Cross-reference NTES if departureTime was not explicitly mentioned in the ticket
      if (trainNumber && !departureTime) {
        const matched = POPULAR_TRAINS[trainNumber];
        if (matched) {
          departureTime = convertTo24Hour(matched.scheduledDep);
        }
      }

      // Final defaults if values are missing
      if (!departureDate) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        departureDate = `${yyyy}-${mm}-${dd}`;
      }
      if (!departureTime) {
        departureTime = "12:00";
      }

      // Ensure departureTime is formatted correctly as HH:MM
      departureTime = convertTo24Hour(departureTime);

      return res.json({
        success: true,
        trainNumber,
        departureDate,
        departureTime,
        message: "Parsed ticket details successfully using Gemini AI."
      });

    } catch (e) {
      console.error("Gemini ticket parser failed, using local regex parser fallback:", e);
    }
  }

  // 2. Fallback parser using regex if Gemini is not available or fails
  try {
    let textContent = "";
    if (mimeType && (mimeType.startsWith("text/") || mimeType === "application/json")) {
      textContent = Buffer.from(base64Data, "base64").toString("utf-8");
    } else {
      textContent = fileName || "";
    }

    // Try finding 5-digit sequence
    const trainMatch = textContent.match(/\b\d{5}\b/);
    const trainNumber = trainMatch ? trainMatch[0] : "12002"; // default to Bhopal Shatabdi

    // Try finding YYYY-MM-DD
    const dateMatch = textContent.match(/\b\d{4}-\d{2}-\d{2}\b/);
    let departureDate = dateMatch ? dateMatch[0] : null;
    if (!departureDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      departureDate = `${yyyy}-${mm}-${dd}`;
    }

    // Look up departureTime or default
    let departureTime = null;
    const timeMatch = textContent.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (timeMatch) {
      departureTime = timeMatch[0];
    } else if (trainNumber && POPULAR_TRAINS[trainNumber]) {
      departureTime = convertTo24Hour(POPULAR_TRAINS[trainNumber].scheduledDep);
    } else {
      departureTime = "12:00";
    }

    return res.json({
      success: true,
      trainNumber,
      departureDate,
      departureTime: convertTo24Hour(departureTime),
      message: "Parsed ticket details via local regex fallback parser."
    });
  } catch (err) {
    console.error("Ticket parsing error:", err);
    res.status(500).json({ error: "Failed to parse ticket file." });
  }
});

// Dynamically analyzes the user's tasks and outputs customized guidelines, summaries, focus topics and search terms
app.post("/api/suggest", async (req, res) => {
  const { title, description, category, userRole } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const roleStr = userRole || "General User";
  const catStr = category || "General";

  // Check if Gemini is configured
  const ai = getAiClient();
  if (!ai) {
    // Elegant local fallback suggestions if API key is not configured yet
    return res.json(getLocalFallback(title, description, catStr, roleStr));
  }

  try {
    const prompt = `
Analyze the following task and generate a highly helpful response in strictly valid JSON format.

Task Context:
- Category: ${catStr}
- Task Title: ${title}
- Task Description: ${description || "No description provided"}
- User's Role in their Profile: ${roleStr}

You must return a JSON object with exactly the following keys:
1. "summary": A brief 1-2 sentence human-friendly summary of the task and its key deadlines or risks. If it's a meeting, provide a quick concise meeting objectives outline.
2. "suggestions": An array of 3 actionable, highly specific tips to help the user prepare, avoid mistakes, or save time for this task.
3. "focusTopics": (Only applicable for meetings/submissions, otherwise empty array) An array of 3 topics/questions the user should focus on based on their role as "${roleStr}".
4. "googleQuery": A highly specific Google search query string related to this task (e.g. "how to prepare travel check-in" or "best react animation practices").
5. "youtubeQuery": A highly specific YouTube search query string (e.g. "train boarding guide" or "node js express crash course").

Example JSON output style:
{
  "summary": "This is a meeting regarding project milestones.",
  "suggestions": ["Review design document", "Prepare timeline estimation", "Check team availability"],
  "focusTopics": ["Resource constraints", "Deployment strategies", "User testing results"],
  "googleQuery": "project management tips",
  "youtubeQuery": "efficient project scheduling tutorials"
}

Respond with only the valid raw JSON object. Do not wrap in markdown blocks like \`\`\`json.
`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    try {
      const parsed = JSON.parse(text.trim());
      // Append formatted search links for safety and utility
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(parsed.googleQuery || title)}`;
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.youtubeQuery || title)}`;
      const driveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(title)}`;

      res.json({
        summary: parsed.summary || `Preparation guidelines for "${title}".`,
        suggestions: parsed.suggestions || ["Prepare prerequisites in advance.", "Review guidelines and materials."],
        focusTopics: parsed.focusTopics || [],
        googleSearchUrl,
        youtubeSearchUrl,
        driveSearchUrl,
      });
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", text, e);
      res.json(getLocalFallback(title, description, catStr, roleStr));
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.json(getLocalFallback(title, description, catStr, roleStr));
  }
});

// Fallback logic to guarantee an ultra-responsive app experience even without API keys
function getLocalFallback(title: string, description: string, category: string, role: string) {
  const desc = description || "";
  let summary = `This is a standard ${category.toLowerCase()} task requiring timely attention.`;
  let suggestions = [
    "Set an early buffer alert to prevent last-minute rushes.",
    "Verify all dependencies, equipment, or documents needed.",
    "Draft a quick notes checklist to track steps step-by-step."
  ];
  let focusTopics: string[] = [];
  let gQuery = title;
  let ytQuery = title;

  const titleLower = title.toLowerCase();

  if (category === "project" || titleLower.includes("project") || titleLower.includes("submission") || titleLower.includes("assignment")) {
    summary = `Critical project submission task. Double check formatting guidelines, drive structures, and rubric criteria.`;
    suggestions = [
      "Conduct a final proofread of files before packaging.",
      "Check Google Drive or shared folders permission levels so evaluators can view.",
      "Verify that the build/compile runs correctly in a clean test context."
    ];
    gQuery = `${title} submission checklist`;
    ytQuery = `${title} presentation tutorial`;
  } else if (category === "meeting" || titleLower.includes("meeting") || titleLower.includes("sync") || titleLower.includes("review")) {
    summary = `Professional interaction. Focus on key deliverables, roadblock solutions, and next steps.`;
    suggestions = [
      "Review the agenda at least 15 minutes before joining.",
      "Keep screen shares or slide notes pre-loaded on your desktop.",
      "Take concise meeting minutes or key action item lists."
    ];
    focusTopics = [
      `Impact of decisions on your role as ${role}`,
      "Key milestones and timeline constraints",
      "Immediate blockers needing collaborative resolution"
    ];
    gQuery = `how to run a productive meeting as ${role}`;
    ytQuery = `meeting facilitation tips`;
  } else if (category === "travel_train" || titleLower.includes("train") || titleLower.includes("irctc")) {
    summary = `Train itinerary check. Be prepared to monitor real-time NTES schedules from 30 minutes prior.`;
    suggestions = [
      "Keep your digital travel ticket PDF and identity card easily accessible on your phone.",
      "Verify the coach number and seat alignment from official station layouts.",
      "Double-check luggage locks and power-bank charge levels before boarding."
    ];
    gQuery = `Where is my train live train locator ${title}`;
    ytQuery = `train cabin luggage and travel tips`;
  } else if (category === "travel_flight" || titleLower.includes("flight") || titleLower.includes("airline") || titleLower.includes("airport")) {
    summary = `Flight itinerary checklist. Remember to perform web check-in 24 hours prior and reach 5 hours early.`;
    suggestions = [
      "Complete online web check-in 24 hours before boarding to select a preferred seat.",
      "Aim to arrive at the airport terminal at least 3-5 hours early to clear bag-drop and security.",
      "Measure check-in and cabin baggage weight to stay strictly within airline limitations."
    ];
    gQuery = `airport pre-boarding guidelines checklist`;
    ytQuery = `airport check in and security line hacks`;
  } else if (category === "call" || titleLower.includes("call") || titleLower.includes("missed")) {
    summary = `Urgent contact callback reminder to maintain healthy professional and personal networks.`;
    suggestions = [
      "Review past messages or emails from this caller to recall pending discussions.",
      "Select a quiet, distraction-free environment to place the return call.",
      "If unanswered, leave a polite and clear SMS or voice message outlining your availability."
    ];
    gQuery = `how to handle urgent callbacks professionally`;
    ytQuery = `effective voice message etiquettes`;
  }

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(gQuery)}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`;
  const driveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(title)}`;

  return {
    summary,
    suggestions,
    focusTopics,
    googleSearchUrl,
    youtubeSearchUrl,
    driveSearchUrl,
  };
}

// 3. Vite development server setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
