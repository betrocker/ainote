// utils/facts-extractor.ts
import type { Fact } from "@/context/SemanticNotesContext";
import { nanoid } from "nanoid/non-secure";

function normalize(input: string) {
  return (input || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// podržano: danas/sutra/prekosutra + dd.mm.yyyy / dd.mm.yy
function parseDate(text: string, now = new Date()): string | null {
  if (/\bsutra\b/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toIsoDate(d);
  }
  if (/\bprekosutra\b/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return toIsoDate(d);
  }
  if (/\bdanas\b/.test(text)) {
    return toIsoDate(now);
  }
  // dd.mm.yyyy ili dd.mm.yy
  const m = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    let yyyy = parseInt(m[3], 10);
    if (yyyy < 100) yyyy += 2000;
    const d = new Date(yyyy, mm - 1, dd);
    if (!isNaN(d.getTime())) return toIsoDate(d);
  }
  return null;
}

// ── MILEAGE PARSER (50k, 100 000, 100k, ... ) ────────────────────────────────
function parseMileage(text: string): {
  value: number | null;
  unit: "km" | "mi";
} {
  let value: number | null = null;
  let unit: "km" | "mi" = "km";

  const kMatch = text.match(/\b(\d{2,3})\s*k\b/); // 50k, 120k
  if (kMatch) value = Number(kMatch[1]) * 1000;

  if (value == null) {
    const numMatch = text.match(/\b(\d{2,3}(?:[ .,_]*\d{3})|\d{5,7})\b/);
    if (numMatch) {
      const raw = numMatch[1].replace(/[ .,_]/g, "");
      const n = Number(raw);
      if (!Number.isNaN(n)) value = n;
    }
  }

  if (/\bmi|mile|miles\b/.test(text)) unit = "mi";
  else if (/\bkm|kilomet/.test(text)) unit = "km";

  return { value, unit };
}

// vrlo lagani sr/eng ekstraktor (regex + heuristike)
export function extractFacts(textRaw: string): Fact[] {
  const text = (textRaw || "").toLowerCase().trim();
  if (!text) return [];

  const facts: Fact[] = [];

  // --- OIL CHANGE / ZAMENA ULJA ---
  // primeri: "sledeca zamena ulja na 100000km", "next oil change at 100,000 km"
  const oilKeywords = ["zamena ulja", "ulje", "oil change"];
  const containsOil = oilKeywords.some((k) => text.includes(k));

  if (containsOil) {
    // uhvati broj + jedinicu (km/mi)
    // dozvolimo razmake i tačke/zaraze kao separator hiljada
    const mileageRegex =
      /(\d{4,7})(?:\s?|\.)*(km|kilomet(?:ar|ra|ara)?|mi|miles)\b/;
    const m = text.match(mileageRegex);

    let trigger: Fact["trigger"] | undefined;
    let object: string | undefined;

    if (m) {
      const value = Number(m[1].replace(/\./g, ""));
      const unitRaw = m[2];
      const unit = /mi|mile/.test(unitRaw) ? "mi" : "km";
      trigger = { kind: "mileage", value, unit, cmp: ">=" };
      object = `${value} ${unit}`;
    }

    facts.push({
      id: nanoid(),
      domain: "car",
      subject: "oil change",
      predicate: "next_due",
      object,
      trigger,
      confidence: trigger ? 0.95 : 0.7,
      sourceSpan: textRaw,
    });
  }

  // --- TODO: datumi, rokovi, intervali (možemo širiti postepeno) ---
  // npr. dd.mm.yyyy, yyyy-mm-dd, "za 6 meseci", "svakih 10k km", itd.

  return facts;
}
