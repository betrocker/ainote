// utils/ai.ts
import Constants from "expo-constants";

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

  const now = new Date();

  // 1) relativne reči
  for (const t of raw.split(/\s+/)) {
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

  // 2) relativne fraze "za X dana / nedelja"
  for (const rule of REL_IN_X) {
    const m = raw.match(rule.re);
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

  // 3) brojevi (npr. kilometraža)
  const nums = raw.match(/\b(\d{4,6})\b/g);
  if (nums)
    for (const n of nums)
      facts.push({
        subject: raw.slice(0, 50),
        predicate: "number",
        object: n,
        weight: 1,
        sourceNoteId: noteId,
      });

  // 4) sadržaj kao fallback
  facts.push({
    subject: raw.slice(0, 50),
    predicate: "note_contains",
    object: raw.toLowerCase(),
    weight: 0.5,
    sourceNoteId: noteId,
  });

  // 5) teme auto-servisa (heuristike)
  if (
    /\b(zamena|promena|servis|ulje|filter|kočnice|gume|točkova|menjača|vode)\b/i.test(
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

function score(query: string, note: NoteLike, f: Fact): number {
  const q = query.toLowerCase();
  let s = f.weight ?? 0;
  if (f.object?.includes(q)) s += 1.2;
  if (f.subject?.toLowerCase().includes(q)) s += 0.8;
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

    // 1) facts score
    for (const f of facts) {
      const sc = score(query, n, f);
      if (sc > 0) {
        total += sc;
        if (f.predicate === "due_on") {
          why.push(`datum:${formatHuman(f.object)}`);
        } else {
          // skraćeni “explain”
          const obj =
            f.object.length > 40 ? f.object.slice(0, 40) + "…" : f.object;
          why.push(`${f.predicate}:${obj}`);
        }
      }
    }

    // 2) plain text uvek (NE samo kad nema facts)
    if (n.text) {
      const hit = n.text.toLowerCase().includes(q);
      if (hit) {
        total += 0.9; // malo veći boost da se ne izgubi iza facts
        why.push("plain_text_hit");
      }
    }

    // 3) title match (često dovoljna sugestija)
    if (n.title && n.title.toLowerCase().includes(q)) {
      total += 0.8;
      why.push("title_match");
    }

    if (total > 0) entries.push({ noteId: n.id, score: total, why });
  }

  entries.sort((a, b) => b.score - a.score);
  const top = entries[0];
  const topNote = top ? notes.find((n) => n.id === top.noteId) : undefined;

  // pokušaj da izvučeš due_on za top note
  let dueOn: string | null = null;
  if (topNote?.ai?.facts) {
    const due = topNote.ai.facts.find((f) => f.predicate === "due_on");
    if (due) dueOn = due.object;
  }

  const pretty = topNote
    ? [
        topNote.title || "Beleška",
        dueOn ? `• rok: ${formatHuman(dueOn)}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "Nisam našao relevantne beleške.";

  return {
    matches: entries,
    answer: pretty,
    topNoteId: top?.noteId ?? null,
    dueOn,
  };
}

/**
 * Transkribuje lokalni audio fajl (uri: file://…) preko OpenAI Whisper API-ja.
 * Vraća plain text ili "" ako nešto pođe po zlu (ne diže error u UI-u).
 *
 * API ključ:
 * - EXPO_PUBLIC_OPENAI_API_KEY (env)
 * - ili app.json/app.config.js: extra.OPENAI_API_KEY
 */
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
  try {
    if (!uri) return "";

    const apiKey =
      opts?.apiKey ||
      (process.env.EXPO_PUBLIC_OPENAI_API_KEY as string | undefined) ||
      (Constants?.expoConfig?.extra?.OPENAI_API_KEY as string | undefined) ||
      // @ts-ignore
      (Constants as any)?.manifest2?.extra?.OPENAI_API_KEY ||
      "";

    if (!apiKey) {
      if (__DEV__) {
        console.log("[transcribeAudio] No API key found (DEV fallback).");
        return "DEV transcript: snimljena glasovna beleška"; // ⭐ vidiš odmah u UI + ASK radi
      }
      console.log("[transcribeAudio] No API key found.");
      return "";
    }

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
        case "ogg":
          return "audio/ogg";
        case "webm":
          return "audio/webm";
        case "caf":
          return "audio/x-caf";
        default:
          return "application/octet-stream";
      }
    };

    const filename = (uri.split("?")[0] || "").split("/").pop() || "note.m4a";
    const mime = guessMime(uri);

    const form = new FormData();
    const fileAny: any = { uri, name: filename, type: mime };
    (form as any).append("file", fileAny);

    form.append("model", opts?.model ?? "whisper-1");
    if (opts?.language) form.append("language", opts.language);
    if (opts?.prompt) form.append("prompt", opts.prompt);
    form.append("temperature", String(opts?.temperature ?? 0));
    form.append("response_format", "json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` } as any,
      body: form as any,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.log("[transcribeAudio] Whisper error:", res.status, errText);
      return "";
    }

    const data = (await res.json()) as { text?: string };
    const out = (data?.text || "").trim();
    if (!out) console.log("[transcribeAudio] Empty transcription.");
    return out;
  } catch (e) {
    console.log("[transcribeAudio] Exception:", e);
    return "";
  }
}
