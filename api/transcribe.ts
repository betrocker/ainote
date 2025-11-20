import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audioBase64, language = "sr" } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const openai = new OpenAI({ apiKey });

    // Konvertuj base64 u buffer
    const buffer = Buffer.from(audioBase64, "base64");

    // Kreiraj File objekat
    const file = new File([buffer], "audio.m4a", { type: "audio/m4a" });

    const response = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language,
    });

    return res.status(200).json({
      text: response.text,
      success: true,
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return res.status(500).json({
      error: error.message || "Transcription failed",
      success: false,
    });
  }
}
