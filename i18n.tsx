// i18n.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./locales/de/common.json";
import en from "./locales/en/common.json";
import sr from "./locales/sr/common.json";

const STORAGE_KEY = "lng";
const SUPPORTED_LANGUAGES = ["en", "sr", "de"];
const LANGUAGE_MAPPING: { [key: string]: string } = {
  hr: "sr",
  bs: "sr",
  sh: "sr",
};

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (cb: (lng: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return cb(stored);
      }
    } catch (error) {
      if (__DEV__) console.error("Error reading language storage:", error);
    }

    const deviceLocales = Localization.getLocales?.() || [];
    const deviceLanguage = deviceLocales[0]?.languageCode || "en";

    if (SUPPORTED_LANGUAGES.includes(deviceLanguage)) {
      cb(deviceLanguage);
      return;
    }

    const mappedLanguage = LANGUAGE_MAPPING[deviceLanguage];
    if (mappedLanguage) {
      cb(mappedLanguage);
      return;
    }

    cb("en");
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch (error) {
      if (__DEV__) console.error("Error caching language:", error);
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

export default i18n;
