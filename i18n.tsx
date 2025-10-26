// i18n.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./locales/de/common.json";
import en from "./locales/en/common.json";
import sr from "./locales/sr/common.json";

const STORAGE_KEY = "lng";

// Podržani jezici
const SUPPORTED_LANGUAGES = ["en", "sr", "de"];

// Mapiranje sličnih jezika
const LANGUAGE_MAPPING: { [key: string]: string } = {
  hr: "sr", // Hrvatski -> Srpski
  bs: "sr", // Bosanski -> Srpski
  sh: "sr", // Srpskohrvatski -> Srpski
};

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (cb: (lng: string) => void) => {
    try {
      // 1. Proveri sačuvani jezik
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        console.log("💾 [i18n] Using stored language:", stored);
        return cb(stored);
      }
    } catch (error) {
      console.error("❌ [i18n] Error reading storage:", error);
    }

    // 2. Detektuj jezik uređaja
    const deviceLocales = Localization.getLocales?.() || [];
    const deviceLanguage = deviceLocales[0]?.languageCode || "en";
    console.log("📱 [i18n] Device language detected:", deviceLanguage);
    console.log("🌍 [i18n] Full device locales:", deviceLocales);

    // 3. Proveri da li je jezik direktno podržan
    if (SUPPORTED_LANGUAGES.includes(deviceLanguage)) {
      console.log("✅ [i18n] Language directly supported:", deviceLanguage);
      cb(deviceLanguage);
      return;
    }

    // 4. Proveri mapiranje sličnih jezika
    const mappedLanguage = LANGUAGE_MAPPING[deviceLanguage];
    if (mappedLanguage) {
      console.log(`🔄 [i18n] Mapping ${deviceLanguage} -> ${mappedLanguage}`);
      cb(mappedLanguage);
      return;
    }

    // 5. Fallback na engleski
    console.log("🌐 [i18n] Using fallback language: en");
    cb("en");
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
      console.log("💾 [i18n] Language cached:", lng);
    } catch (error) {
      console.error("❌ [i18n] Error caching language:", error);
    }
  },
};

i18n
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
      escapeValue: false,
    },
    returnObjects: true,
    keySeparator: ".",
    react: {
      useSuspense: false,
    },
  });

// Event listener za praćenje promene jezika
i18n.on("languageChanged", (lng) => {
  console.log("🎉 [i18n] Language changed to:", lng);
});

console.log("🚀 [i18n] Initial language:", i18n.language);

export default i18n;
