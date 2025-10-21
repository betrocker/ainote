// utils/plural.ts

/**
 * Plural rules za srpski jezik
 * 1, 21, 31... → singular (beležka)
 * 2-4, 22-24... → few (beležke)
 * 0, 5-20, 25-30... → other (beležaka)
 */
export function getPluralFormSr(count: number): "one" | "few" | "other" {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "one";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "few";
  }

  return "other";
}

/**
 * Plural rules za engleski/nemački
 */
export function getPluralFormEn(count: number): "one" | "other" {
  return count === 1 ? "one" : "other";
}

/**
 * Universal plural helper
 */
export function getPlural(
  count: number,
  forms: { one: string; few?: string; other: string },
  lang: string = "en"
): string {
  if (lang === "sr" && forms.few) {
    const form = getPluralFormSr(count);
    return forms[form] || forms.other;
  }

  const form = getPluralFormEn(count);
  return forms[form] || forms.other;
}
