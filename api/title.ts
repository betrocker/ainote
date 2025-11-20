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
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(200).json({
        title: "Untitled Note",
        success: true,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Ti si ekspert za kreiranje kratkih, jasnih i preciznih naslova. " +
            "Analiziraj tekst i kreiraj naslov od 3-6 reči koji najbolje opisuje suštinu sadržaja. " +
            "Naslov mora biti na srpskom jeziku. " +
            "Budi konkretan, izbegavaj generičke fraze. " +
            "Ako je tekst lista ili zadaci, koristi akcione reči. " +
            "Vrati SAMO naslov, bez navodnika ili dodatnih objašnjenja.",
        },
        {
          role: "user",
          content: `Kreiraj naslov za:\n\n${text.slice(0, 500)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 30,
    });

    const generatedTitle = response.choices[0]?.message?.content?.trim();

    if (generatedTitle && generatedTitle.length > 0) {
      const cleanTitle = generatedTitle
        .replace(/^["']|["']$/g, "")
        .slice(0, 80);
      return res.status(200).json({
        title: cleanTitle,
        success: true,
      });
    }

    return res.status(200).json({
      title: "Untitled Note",
      success: true,
    });
  } catch (error: any) {
    console.error("Title generation error:", error);
    return res.status(500).json({
      error: error.message || "Title generation failed",
      success: false,
    });
  }
}
