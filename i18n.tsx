import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
// (Opcionalno) ICU plugin za napredne formate i pluralizaciju
// import ICU from "i18next-icu";

import de from "./locales/de/common.json";
import en from "./locales/en/common.json";
import sr from "./locales/sr/common.json";

const STORAGE_KEY = "lng";

// Custom language detector za RN (čita iz AsyncStorage, fallback na sistem)
const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (cb: (lng: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) return cb(stored);
    } catch {}
    // Fallback na prvi jezik sistema, npr. "sr-RS" -> "sr"
    const sys = Localization.getLocales?.()[0]?.languageCode ?? "en";
    cb(sys);
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch {}
  },
};

i18n
  // .use(ICU()) // uključi ako koristiš i18next-icu
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources: {
      en: { common: en },
      sr: { common: sr },
      de: { common: de },
    },
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // RN ne traži HTML escaping
    },
    returnObjects: true,
    // Preporuka: eksplicitno uključi keySeparator po potrebi (default je ".")
    keySeparator: ".",
  });

export default i18n;
