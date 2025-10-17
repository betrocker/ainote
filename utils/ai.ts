// utils/ai.ts
import Constants from "expo-constants";

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
  // Jednostavni brojevi
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

  // Pattern: "dvadeset tri" → 23
  const compoundPattern =
    /\b(dvadeset|trideset|četrdeset|cetrdeset|pedeset|šezdeset|sezdeset|sedamdeset|osamdeset|devedeset)\s+(jedan|jedna|jedno|dva|dve|tri|četiri|cetiri|pet|šest|sest|sedam|osam|devet)\b/gi;

  result = result.replace(compoundPattern, (match, tens, ones) => {
    const tensNum = SERBIAN_NUMBERS[tens.toLowerCase()] || 0;
    const onesNum = SERBIAN_NUMBERS[ones.toLowerCase()] || 0;
    return String(tensNum + onesNum);
  });

  console.log(
    "🔢 [parseCompoundNumber]:",
    text.slice(0, 40),
    "→",
    result.slice(0, 40)
  );
  return result;
}

export type Fact = {
  subject: string;
  predicate: "due_on" | "number" | "note_contains" | "topic";
  object: string;
  weight?: number;
  sourceNoteId?: string;
};

// --- Relativne fraze tipa "za 10 dana", "za 2 nedelje"
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

// relativne reči
const SERBIAN_REL = { danas: 0, sutra: 1, prekosutra: 2, juče: -1, juce: -1 };

function relativeKeywordToISO(word: string, now = new Date()): string | null {
  const key = word.toLowerCase();
  if (!(key in SERBIAN_REL)) return null;
  return toISODate(addDays(now, SERBIAN_REL[key as keyof typeof SERBIAN_REL]));
}

// 12.10.2025, 12/10/2025, 12.10. (pretpostavi tekuću god; pomeri u budućnost ako je prošlo)
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

  // ⭐ NORMALIZUJ TEKSTUALNE BROJEVE
  const normalized = normalizeNumberWords(raw);
  const now = new Date();

  // 1) Relativne reči (danas, sutra, itd.)
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

  // 2) Relativne fraze "za X dana / nedelja"
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

  // 3) Brojevi (kilometraža, cene, itd.)
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

  // ⭐ 4) EKSTRAKTUJ IMENA MESTA - Prioritet: Poznati gradovi
  const textLower = raw.toLowerCase();
  const foundPlaces = new Set<string>();

  for (const city of KNOWN_CITIES) {
    if (textLower.includes(city)) {
      foundPlaces.add(city);
      facts.push({
        subject: raw.slice(0, 50),
        predicate: "topic",
        object: city,
        weight: 3.0, // Najviši weight za verifikovane gradove
        sourceNoteId: noteId,
      });
      console.log(`📍 [genFactsFromText] Found known city: ${city}`);
    }
  }

  // 5) Sadržaj kao fallback (uvek dodaj za pretragu)
  facts.push({
    subject: raw.slice(0, 50),
    predicate: "note_contains",
    object: raw.toLowerCase(),
    weight: 0.5,
    sourceNoteId: noteId,
  });

  // 6) Teme auto-servisa
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

  console.log(
    `📊 [genFactsFromText] Generated ${facts.length} facts for note ${noteId?.slice(0, 8)}`
  );
  facts.forEach((f, i) => {
    console.log(
      `  [${i}] ${f.predicate}: ${f.object.slice(0, 40)} (weight: ${f.weight})`
    );
  });

  return facts;
}

type NoteLike = {
  id: string;
  type: "text" | "audio" | "photo" | "video";
  title?: string;
  text?: string;
  ai?: { facts?: Fact[] };
};

// ⭐ NOVA funkcija za normalizaciju
function normalizeNumberWords(text: string): string {
  let normalized = text;

  // ⭐ PRVO parsiraj složene brojeve
  normalized = parseCompoundNumber(normalized);

  // Zatim zameni preostale jednostavne tekstualne brojeve
  for (const [word, num] of Object.entries(SERBIAN_NUMBERS)) {
    // "za pet dana" → "za 5 dana"
    const dayRegex = new RegExp(`\\bza\\s+${word}\\s+(dan|dana)\\b`, "gi");
    normalized = normalized.replace(dayRegex, `za ${num} dana`);

    // "za pet nedelja" → "za 5 nedelje"
    const weekRegex = new RegExp(
      `\\bza\\s+${word}\\s+(nedelju|nedelje|nedelja|ned|n\\.)\\b`,
      "gi"
    );
    normalized = normalized.replace(weekRegex, `za ${num} nedelje`);
  }

  // Kilometraža
  normalized = normalized.replace(/\bpedeset\s+hiljada\b/gi, "50000");
  normalized = normalized.replace(/\bsto\s+hiljada\b/gi, "100000");

  console.log("🔢 [normalizeNumberWords] Original:", text.slice(0, 60));
  console.log("🔢 [normalizeNumberWords] Normalized:", normalized.slice(0, 60));

  return normalized;
}

function score(query: string, note: NoteLike, f: Fact): number {
  const q = query.toLowerCase();
  let s = f.weight ?? 0;

  // ⭐ Boost za exact match u object-u
  if (f.object?.toLowerCase() === q) {
    s += 3; // Jako povećaj score za tačan match
  } else if (f.object?.toLowerCase().includes(q)) {
    s += 1.5; // Srednji boost za parcijalni match
  }

  // Subject match
  if (f.subject?.toLowerCase().includes(q)) {
    s += 0.8;
  }

  return s;
}

// format za due_on
function formatHuman(iso: string, now = new Date()) {
  try {
    const d = new Date(iso + "T00:00:00");
    const diffDays = Math.round(
      (+d - +new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
        86400000
    );
    if (diffDays === 0) return "danas";
    if (diffDays === 1) return "sutra";
    if (diffDays > 1 && diffDays <= 14) return `za ${diffDays} dana`;
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ask(query: string, notes: NoteLike[]) {
  const q = query.toLowerCase();
  const entries: { noteId: string; score: number; why: string[] }[] = [];

  for (const n of notes) {
    const facts = n.ai?.facts ?? [];
    let total = 0;
    const why: string[] = [];

    // 1) Facts score
    for (const f of facts) {
      const sc = score(query, n, f);
      if (sc > 0) {
        total += sc;
        if (f.predicate === "due_on") {
          why.push(`datum:${formatHuman(f.object)}`);
        } else if (f.predicate === "number") {
          why.push(`broj:${f.object}`);
        } else {
          const obj =
            f.object.length > 40 ? f.object.slice(0, 40) + "…" : f.object;
          why.push(`${f.predicate}:${obj}`);
        }
      }
    }

    // 2) Plain text - multiword query match
    if (n.text) {
      const textLower = n.text.toLowerCase();
      const queryWords = q.split(/\s+/).filter((w) => w.length > 2);

      // ⭐ BONUS: Ako beleška sadrži SVE reči iz upita - veliki boost
      const allWordsMatch = queryWords.every((word) =>
        textLower.includes(word)
      );
      if (allWordsMatch && queryWords.length >= 2) {
        total += 3.0; // ⭐ Veliki bonus za potpuni match
        why.push(`full_query_match`);
      }

      // Regular word matching
      for (const word of queryWords) {
        if (textLower.includes(word)) {
          total += 1.2;
          why.push(`text_match:${word}`);
        }
      }
    }

    // 3) Title match
    if (n.title && n.title.toLowerCase().includes(q)) {
      total += 0.8;
      why.push("title_match");
    }

    if (total > 0) {
      console.log(
        `🔍 [ask] Note ${n.id.slice(0, 8)}: score=${total.toFixed(1)}, why=${why.join(", ")}`
      );
      entries.push({ noteId: n.id, score: total, why });
    }
  }

  entries.sort((a, b) => b.score - a.score);
  const top = entries[0];
  const topNote = top ? notes.find((n) => n.id === top.noteId) : undefined;

  // Izvuci due_on
  let dueOn: string | null = null;
  if (topNote?.ai?.facts) {
    const due = topNote.ai.facts.find((f) => f.predicate === "due_on");
    if (due) dueOn = due.object;
  }

  // Pretty output
  const pretty = topNote
    ? [
        topNote.title &&
        topNote.title !== "Voice note" &&
        topNote.title !== "Audio"
          ? topNote.title
          : topNote.text?.slice(0, 80) || "Beleška",
        dueOn ? `• rok: ${formatHuman(dueOn)}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "Nisam našao relevantne beleške.";

  console.log(
    `🎯 [ask] Top match: ${top?.noteId.slice(0, 8)} (score: ${top?.score.toFixed(1)})`
  );

  return {
    matches: entries,
    answer: pretty,
    topNoteId: top?.noteId ?? null,
    dueOn,
  };
}

export async function transcribeAudio(
  uri: string,
  opts?: {
    language?: string;
    prompt?: string;
    apiKey?: string;
    model?: string;
    temperature?: number;
  }
): Promise<string> {
  console.log("🔊 [transcribeAudio] Called with:");
  console.log("  URI:", uri);
  console.log("  Options:", opts);
  try {
    if (!uri) {
      console.log("🔊 [transcribeAudio] Empty URI - returning");
      return "";
    }

    const apiKey =
      opts?.apiKey ||
      (process.env.EXPO_PUBLIC_OPENAI_API_KEY as string | undefined) ||
      (Constants?.expoConfig?.extra?.OPENAI_API_KEY as string | undefined) ||
      // @ts-ignore
      (Constants as any)?.manifest2?.extra?.OPENAI_API_KEY ||
      "";

    console.log("🔊 [transcribeAudio] API key exists:", !!apiKey);
    console.log("🔊 [transcribeAudio] API key length:", apiKey?.length || 0);

    if (!apiKey) {
      if (__DEV__) {
        console.log("🔊 [transcribeAudio] DEV fallback - no key");
        return "DEV transcript: snimljena glasovna beleška";
      }
      console.log("🔊 [transcribeAudio] No API key - returning empty");
      return "";
    }

    // ⭐ MIME TYPE correction
    const guessMime = (u: string) => {
      const name = (u.split("?")[0] || "").split("/").pop() || "";
      const ext = name.toLowerCase().split(".").pop();
      switch (ext) {
        case "m4a":
          return "audio/m4a";
        case "mp4":
          return "audio/mp4";
        case "mp3":
          return "audio/mpeg";
        case "wav":
          return "audio/wav";
        default:
          return "audio/m4a"; // ⭐ default za expo-av
      }
    };

    const filename = (uri.split("?")[0] || "").split("/").pop() || "audio.m4a";
    const mime = guessMime(uri);

    console.log("[transcribeAudio] Starting:");
    console.log("  URI:", uri);
    console.log("  Filename:", filename);
    console.log("  MIME:", mime);

    const form = new FormData();

    // ⭐ KLJUČNA PROMENA: React Native FormData format
    const fileData: any = {
      uri,
      name: filename,
      type: mime,
    };

    form.append("file", fileData);
    form.append("model", opts?.model ?? "whisper-1");
    if (opts?.language) form.append("language", opts.language);
    if (opts?.prompt) form.append("prompt", opts.prompt);
    form.append("temperature", String(opts?.temperature ?? 0));
    form.append("response_format", "json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // ⭐ NE dodavaj Content-Type - fetch automatski postavlja za FormData
      } as any,
      body: form as any,
    });

    // ⭐ DETALJNO LOGOVANJE
    console.log("[transcribeAudio] Response status:", res.status);
    console.log("[transcribeAudio] Rate limit headers:");
    console.log(
      "  Remaining requests:",
      res.headers.get("x-ratelimit-remaining-requests")
    );
    console.log(
      "  Limit requests:",
      res.headers.get("x-ratelimit-limit-requests")
    );
    console.log(
      "  Reset requests:",
      res.headers.get("x-ratelimit-reset-requests")
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.log("[transcribeAudio] ❌ ERROR:", res.status);
      console.log("[transcribeAudio] Body:", errText);

      try {
        const errJson = JSON.parse(errText);
        console.log("[transcribeAudio] Error type:", errJson.error?.type);
        console.log("[transcribeAudio] Error message:", errJson.error?.message);

        // User-friendly poruke
        if (errJson.error?.type === "insufficient_quota") {
          return "Nedovoljno kredita. Dodaj $5 na platform.openai.com.";
        }
        if (res.status === 429) {
          return "Rate limit (3 req/min na free tier). Dodaj kredit za više.";
        }
        if (errJson.error?.message?.includes("Invalid file format")) {
          return "Neispravan audio format. Pokušaj ponovo.";
        }
      } catch {}

      return "";
    }

    const data = (await res.json()) as { text?: string };
    const transcript = (data?.text || "").trim();

    console.log("[transcribeAudio] ✅ Success");
    console.log("  Length:", transcript.length, "chars");
    console.log("  Preview:", transcript.slice(0, 100));

    if (!transcript) {
      console.log("[transcribeAudio] ⚠️ Empty transcription");
      return "";
    }

    return transcript;
  } catch (e: any) {
    console.log("[transcribeAudio] ❌ Exception:", e?.message || e);
    return "";
  }
}
