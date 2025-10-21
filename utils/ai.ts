// utils/ai.ts
import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

const KNOWN_CITIES = [
  "beograd",
  "novi sad",
  "niš",
  "nis",
  "kragujevac",
  "subotica",
  "leskovac",
  "zrenjanin",
  "pančevo",
  "pancevo",
  "čačak",
  "cacak",
  "kruševac",
  "krusevac",
  "kraljevo",
  "smederevo",
  "jagodina",
  "valjevo",
  "užice",
  "uzice",
  "vranje",
  "šabac",
  "sabac",
  "sombor",
  "požarevac",
  "pozarevac",
  "pirot",
  "zaječar",
  "zajecar",
];

const SERBIAN_NUMBERS: Record<string, number> = {
  jedan: 1,
  jedna: 1,
  jedno: 1,
  dva: 2,
  dve: 2,
  tri: 3,
  četiri: 4,
  cetiri: 4,
  pet: 5,
  šest: 6,
  sest: 6,
  sedam: 7,
  osam: 8,
  devet: 9,
  deset: 10,
  jedanaest: 11,
  dvanaest: 12,
  trinaest: 13,
  četrnaest: 14,
  cetrnaest: 14,
  petnaest: 15,
  šesnaest: 16,
  sesnaest: 16,
  sedamnaest: 17,
  osamnaest: 18,
  devetnaest: 19,
  dvadeset: 20,
  trideset: 30,
  četrdeset: 40,
  cetrdeset: 40,
  pedeset: 50,
  šezdeset: 60,
  sezdeset: 60,
  sedamdeset: 70,
  osamdeset: 80,
  devedeset: 90,
};

function parseCompoundNumber(text: string): string {
  let result = text;

  const compoundPattern =
    /\b(dvadeset|trideset|četrdeset|cetrdeset|pedeset|šezdeset|sezdeset|sedamdeset|osamdeset|devedeset)\s+(jedan|jedna|jedno|dva|dve|tri|četiri|cetiri|pet|šest|sest|sedam|osam|devet)\b/gi;

  result = result.replace(compoundPattern, (match, tens, ones) => {
    const tensNum = SERBIAN_NUMBERS[tens.toLowerCase()] || 0;
    const onesNum = SERBIAN_NUMBERS[ones.toLowerCase()] || 0;
    return String(tensNum + onesNum);
  });

  return result;
}

export type Fact = {
  subject: string;
  predicate: "due_on" | "number" | "note_contains" | "topic";
  object: string;
  weight?: number;
  sourceNoteId?: string;
};

const REL_IN_X = [
  { re: /\bza\s+(\d+)\s*d(an|ana)?\b/i, unit: "day" as const },
  {
    re: /\bza\s+(\d+)\s*n(edelju|edelje|edelja|edelju|ed|\.)\b/i,
    unit: "week" as const,
  },
];

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);
}

const SERBIAN_REL = { danas: 0, sutra: 1, prekosutra: 2, juče: -1, juce: -1 };

function relativeKeywordToISO(word: string, now = new Date()): string | null {
  const key = word.toLowerCase();
  if (!(key in SERBIAN_REL)) return null;
  return toISODate(addDays(now, SERBIAN_REL[key as keyof typeof SERBIAN_REL]));
}

function normalizeDateToken(tok: string, now = new Date()): string | null {
  const m = tok.match(/^(\d{1,2})[.\-\/](\d{1,2})(?:[.\-\/](\d{2,4}))?$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  let year = y
    ? y.length === 2
      ? Number(y) >= 70
        ? 1900 + Number(y)
        : 2000 + Number(y)
      : Number(y)
    : now.getFullYear();
  const candidate = new Date(Number(year), Number(mo) - 1, Number(d));
  if (isNaN(+candidate)) return null;
  if (!y && candidate < now) candidate.setFullYear(candidate.getFullYear() + 1);
  return toISODate(candidate);
}

export function genFactsFromText(text: string, noteId?: string): Fact[] {
  const facts: Fact[] = [];
  const raw = (text || "").trim();
  if (!raw) return facts;

  const normalized = normalizeNumberWords(raw);
  const now = new Date();

  // 1) Relativne reči
  for (const t of normalized.split(/\s+/)) {
    const rel = relativeKeywordToISO(t, now);
    if (rel) {
      facts.push({
        subject: raw.slice(0, 50),
        predicate: "due_on",
        object: rel,
        weight: 2,
        sourceNoteId: noteId,
      });
    } else {
      const iso = normalizeDateToken(t.replace(/[,;]+$/, ""), now);
      if (iso) {
        facts.push({
          subject: raw.slice(0, 50),
          predicate: "due_on",
          object: iso,
          weight: 2,
          sourceNoteId: noteId,
        });
      }
    }
  }

  // 2) Relativne fraze
  for (const rule of REL_IN_X) {
    const m = normalized.match(rule.re);
    if (m) {
      const n = Number(m[1]);
      const days = rule.unit === "day" ? n : n * 7;
      const iso = toISODate(addDays(now, days));
      facts.push({
        subject: raw.slice(0, 50),
        predicate: "due_on",
        object: iso,
        weight: 2.2,
        sourceNoteId: noteId,
      });
    }
  }

  // 3) Brojevi
  const nums = normalized.match(/\b(\d{4,6})\b/g);
  if (nums) {
    for (const n of nums) {
      facts.push({
        subject: raw.slice(0, 50),
        predicate: "number",
        object: n,
        weight: 1,
        sourceNoteId: noteId,
      });
    }
  }

  // 4) Mesta
  const textLower = raw.toLowerCase();
  for (const city of KNOWN_CITIES) {
    if (textLower.includes(city)) {
      facts.push({
        subject: raw.slice(0, 50),
        predicate: "topic",
        object: city,
        weight: 3.0,
        sourceNoteId: noteId,
      });
    }
  }

  // 5) Sadržaj
  facts.push({
    subject: raw.slice(0, 50),
    predicate: "note_contains",
    object: raw.toLowerCase(),
    weight: 0.5,
    sourceNoteId: noteId,
  });

  // 6) Auto servis tema
  if (
    /\b(zamena|promena|servis|ulje|filter|kočnice|gume|točkova|menjača|vode|brisač|brisača)\b/i.test(
      raw
    )
  ) {
    facts.push({
      subject: "auto_service",
      predicate: "topic",
      object: "car_maintenance",
      weight: 1.5,
      sourceNoteId: noteId,
    });
  }

  return facts;
}

type NoteLike = {
  id: string;
  type: "text" | "audio" | "photo" | "video";
  title?: string;
  text?: string;
  ai?: { facts?: Fact[] };
};

function normalizeNumberWords(text: string): string {
  let normalized = text;

  normalized = parseCompoundNumber(normalized);

  for (const [word, num] of Object.entries(SERBIAN_NUMBERS)) {
    const dayRegex = new RegExp(`\\bza\\s+${word}\\s+(dan|dana)\\b`, "gi");
    normalized = normalized.replace(dayRegex, `za ${num} dana`);

    const weekRegex = new RegExp(
      `\\bza\\s+${word}\\s+(nedelju|nedelje|nedelja|ned|n\\.)\\b`,
      "gi"
    );
    normalized = normalized.replace(weekRegex, `za ${num} nedelje`);
  }

  normalized = normalized.replace(/\bpedeset\s+hiljada\b/gi, "50000");
  normalized = normalized.replace(/\bsto\s+hiljada\b/gi, "100000");

  return normalized;
}

function score(query: string, note: NoteLike, f: Fact): number {
  const q = query.toLowerCase();
  let s = f.weight ?? 0;

  if (f.object?.toLowerCase() === q) {
    s += 3;
  } else if (f.object?.toLowerCase().includes(q)) {
    s += 1.5;
  }

  if (f.subject?.toLowerCase().includes(q)) {
    s += 0.8;
  }

  return s;
}

// ⭐ POBOLJŠANA formatHuman funkcija
function formatHuman(iso: string, now = new Date()): string {
  try {
    const d = new Date(iso + "T00:00:00");
    const diffDays = Math.round(
      (+d - +new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
        86400000
    );

    if (diffDays === 0) return "danas";
    if (diffDays === 1) return "sutra";
    if (diffDays === 2) return "prekosutra";
    if (diffDays === -1) return "juče";
    if (diffDays > 2 && diffDays <= 7) return `za ${diffDays} dana`;
    if (diffDays > 7 && diffDays <= 30) {
      const weeks = Math.round(diffDays / 7);
      return `za ${weeks} ${weeks === 1 ? "nedelju" : weeks <= 4 ? "nedelje" : "nedelja"}`;
    }
    if (diffDays < -1 && diffDays >= -7) return `pre ${-diffDays} dana`;

    return d.toLocaleDateString("sr-RS", {
      day: "2-digit",
      month: "long",
      year: diffDays > 365 ? "numeric" : undefined,
    });
  } catch {
    return iso;
  }
}

// ⭐ FINALNA ask funkcija
export function ask(query: string, notes: NoteLike[]) {
  // ⭐ Očisti query od interpunkcije
  const q = query
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:]+/g, "");
  const entries: {
    noteId: string;
    score: number;
    why: string[];
    hasRelevantMatch: boolean;
  }[] = [];

  console.log(`🔍 [ask] Query: "${query}"`);
  console.log(`🔍 [ask] Cleaned: "${q}"`);
  console.log(`🔍 [ask] Total notes: ${notes.length}`);

  // ⭐ Izvuci ključne reči (bez stop words i interpunkcije)
  const queryWords = q
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter(
      (w) =>
        ![
          "kada",
          "sta",
          "šta",
          "gdje",
          "gde",
          "koji",
          "koja",
          "koje",
          "ima",
          "idem",
          "sam",
          "ide",
          "idu",
        ].includes(w)
    );

  console.log(`🔍 [ask] Query keywords: [${queryWords.join(", ")}]`);

  // ⭐ Ako nema keyword-a (npr. samo "kada?"), koristi ceo query
  if (queryWords.length === 0) {
    queryWords.push(q);
  }

  for (const n of notes) {
    const facts = n.ai?.facts ?? [];
    let total = 0;
    const why: string[] = [];
    let hasRelevantMatch = false;

    // 1) Facts score - sa PRAVOM proverom
    for (const f of facts) {
      const objectLower = (f.object || "")
        .toLowerCase()
        .replace(/[?!.,;:]+/g, "");
      const subjectLower = (f.subject || "")
        .toLowerCase()
        .replace(/[?!.,;:]+/g, "");

      // ⭐ Proveri da li bilo koja query reč postoji u fact-u
      const matchesQuery = queryWords.some(
        (word) =>
          objectLower.includes(word) ||
          subjectLower.includes(word) ||
          word.includes(objectLower) // Za "nis" da matchuje "niš"
      );

      if (matchesQuery) {
        hasRelevantMatch = true;
        total += f.weight || 1;

        if (f.predicate === "due_on") {
          why.push(`datum:${formatHuman(f.object)}`);
        } else if (f.predicate === "number") {
          why.push(`broj:${f.object}`);
        } else if (f.predicate === "topic") {
          why.push(`mesto:${f.object}`);
        }
      }
      // ⭐ Special case: datum pitanja bez specific topic
      else if (
        f.predicate === "due_on" &&
        (query.toLowerCase().includes("kada") ||
          query.toLowerCase().includes("when"))
      ) {
        // Ne računaj ovaj fact ako nema topic match
        continue;
      }
    }

    // 2) Text & Title match
    if (n.text || n.title) {
      const textLower = (n.text || "").toLowerCase().replace(/[?!.,;:]+/g, "");
      const titleLower = (n.title || "")
        .toLowerCase()
        .replace(/[?!.,;:]+/g, "");
      const combined = textLower + " " + titleLower;

      const matchedWords = queryWords.filter((word) => combined.includes(word));

      if (matchedWords.length > 0) {
        hasRelevantMatch = true;

        const matchRatio = matchedWords.length / queryWords.length;
        total += matchRatio * 3.0; // ⭐ Povećan bonus

        // Title exact match
        if (titleLower === q || titleLower.includes(q)) {
          total += 3.0;
          why.push("exact_title");
        }
        // Title partial match
        else if (queryWords.some((w) => titleLower.includes(w))) {
          total += 1.5;
          why.push("title");
        }

        // Full query in text
        if (combined.includes(q)) {
          total += 2.0;
          why.push("full_text");
        }

        why.push(`${matchedWords.length}/${queryWords.length}w`);
      }
    }

    // ⭐ Samo dodaj ako ima relevantni match i dobar score
    if (hasRelevantMatch && total > 2.0) {
      // ⭐ Povećan threshold
      entries.push({ noteId: n.id, score: total, why, hasRelevantMatch });
    }
  }

  entries.sort((a, b) => b.score - a.score);

  console.log(`🎯 [ask] Found ${entries.length} relevant matches`);
  entries.slice(0, 5).forEach((e, i) => {
    const note = notes.find((n) => n.id === e.noteId);
    console.log(
      `  [${i + 1}] ${note?.title?.slice(0, 20) || e.noteId.slice(0, 8)}: ${e.score.toFixed(1)} (${e.why.join(", ")})`
    );
  });

  const top = entries[0];
  const topNote = top ? notes.find((n) => n.id === top.noteId) : undefined;

  // ❌ Nema relevantnih rezultata
  if (!topNote || entries.length === 0) {
    return {
      matches: [],
      answer: `Nisam pronašao beležke koje sadrže "${queryWords.join(" ")}". Pokušaj sa drugim rečima ili kreiraj novu belešku.`,
      topNoteId: null,
      dueOn: null,
    };
  }

  // ✅ Ima rezultata
  const facts = topNote.ai?.facts ?? [];

  const dueFact = facts.find((f) => f.predicate === "due_on");
  const dueOn = dueFact?.object || null;

  const numberFact = facts.find((f) => f.predicate === "number");
  const topicFact = facts.find((f) => f.predicate === "topic");

  // ⭐ GENERISANJE ODGOVORA
  let answer = "";

  // 1️⃣ Mesto + datum (najviši prioritet za "kada idem u X")
  if (topicFact && dueFact) {
    const place =
      topicFact.object.charAt(0).toUpperCase() + topicFact.object.slice(1);
    answer = `Putovanje u ${place} - ${formatHuman(dueFact.object)}`;
  }
  // 2️⃣ Samo datum
  else if (dueFact && (q.includes("kada") || q.includes("when"))) {
    answer = `${topNote.title || "Pronađeno"} - ${formatHuman(dueFact.object)}`;
  }
  // 3️⃣ Broj
  else if (numberFact && /\d{3,}/.test(q)) {
    answer = `${topNote.title || "Pronađeno"} - ${numberFact.object}`;
    if (dueFact) {
      answer += ` (${formatHuman(dueFact.object)})`;
    }
  }
  // 4️⃣ Samo mesto
  else if (topicFact) {
    const place =
      topicFact.object.charAt(0).toUpperCase() + topicFact.object.slice(1);
    answer = `${topNote.title || `Beležka o ${place}`}`;
    if (dueFact) {
      answer += ` - ${formatHuman(dueFact.object)}`;
    }
  }
  // 5️⃣ Generic
  else {
    answer = topNote.title || "Pronađena beležka";

    if (topNote.text && topNote.text.length > 20) {
      const snippet = topNote.text.slice(0, 100).trim();
      if (snippet !== topNote.title) {
        answer += `\n\n${snippet}${topNote.text.length > 100 ? "..." : ""}`;
      }
    }

    if (dueFact) {
      answer += `\n\n📅 ${formatHuman(dueFact.object)}`;
    }
  }

  console.log(`💬 [ask] Answer: ${answer.slice(0, 80)}...`);

  return {
    matches: entries,
    answer,
    topNoteId: topNote.id,
    dueOn,
  };
}

// ⭐ Ostale funkcije ostaju iste
export async function extractTextFromImage(
  imageUri: string
): Promise<string | null> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API key not found");

    const manipResult = await ImageManipulator.manipulateAsync(imageUri, [], {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const file = new File(manipResult.uri);
    const base64 = await file.base64();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Izvuci sav tekst sa ove slike. Vrati samo tekst bez objašnjenja.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Vision API error");
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim();

    return extractedText || null;
  } catch (error) {
    console.error("OCR extraction error:", error);
    throw error;
  }
}

export async function transcribeAudio(
  audioUri: string,
  options?: { language?: string; prompt?: string }
): Promise<string> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API key not found");

    const formData = new FormData();

    formData.append("file", {
      uri: audioUri,
      type: "audio/m4a",
      name: "audio.m4a",
    } as any);

    formData.append("model", "whisper-1");

    if (options?.language) {
      formData.append("language", options.language);
    }

    if (options?.prompt) {
      formData.append("prompt", options.prompt);
    }

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Whisper API error");
    }

    const data = await response.json();
    return data.text?.trim() || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

export async function generateSmartTitle(text: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not found");
    return "Untitled Note";
  }

  if (!text || text.trim().length < 10) {
    return "Untitled Note";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return "Untitled Note";
    }

    const data = await response.json();
    const generatedTitle = data.choices?.[0]?.message?.content?.trim();

    if (generatedTitle && generatedTitle.length > 0) {
      return generatedTitle.replace(/^["']|["']$/g, "").slice(0, 80);
    }

    return "Untitled Note";
  } catch (error) {
    console.error("Error generating smart title:", error);
    return "Untitled Note";
  }
}

export async function generateSummary(text: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not found");
    return "";
  }

  if (!text || text.trim().length < 50) {
    return "";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Ti si ekspert za kreiranje kratkih, jasnih sažetaka. " +
              "Analiziraj tekst i napravi koncizni sažetak od 2-3 rečenice (maksimum 100 reči). " +
              "Fokusiraj se na ključne informacije, datume, brojeve i akcione tačke. " +
              "Sažetak mora biti na srpskom jeziku. " +
              "Budi objektivan i precizan. " +
              "Ako tekst sadrži zadatke ili akcije, istakni ih. " +
              "Vrati SAMO sažetak, bez naslova ili dodatnih objašnjenja.",
          },
          {
            role: "user",
            content: `Napravi sažetak:\n\n${text}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return "";
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    return summary || "";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "";
  }
}
