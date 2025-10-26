import AppModal from "@/components/ui/AppModal";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type LangCode = "sr" | "en" | "de";
type Lang = { code: LangCode; label: string; emoji: string };

const LANGS: Lang[] = [
  { code: "sr", label: "Srpski", emoji: "🇷🇸" },
  { code: "en", label: "English", emoji: "🇬🇧" },
  { code: "de", label: "Deutsch", emoji: "🇩🇪" },
];

export default function LanguagePicker() {
  const { i18n, t } = useTranslation("common");
  const { colorScheme } = useColorScheme();
  const [open, setOpen] = useState(false);
  const [pendingLang, setPendingLang] = useState<LangCode | null>(null);
  const current = i18n.language || "en";
  const isDark = colorScheme === "dark";
  const isMountedRef = useRef(true);

  const selectedCode = useMemo<LangCode>(() => {
    const base = (current || "en").split("-")[0] as LangCode | string;
    return ["sr", "en", "de"].includes(base) ? (base as LangCode) : "en";
  }, [current]);

  // Cleanup na unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Efekt za promenu jezika nakon što se modal zatvori
  useEffect(() => {
    if (!open && pendingLang && pendingLang !== selectedCode) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          i18n.changeLanguage(pendingLang).catch(console.error);
          setPendingLang(null);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open, pendingLang, selectedCode, i18n]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const apply = useCallback(
    (code: LangCode) => {
      if (code === selectedCode) {
        setOpen(false);
        return;
      }

      // Samo postavi pending lang i zatvori modal
      setPendingLang(code);
      setOpen(false);
    },
    [selectedCode]
  );

  return (
    <>
      {/* Settings row */}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center py-3 px-6 active:opacity-70"
        accessibilityRole="button"
      >
        <View className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center mr-3">
          <Ionicons name="language-outline" size={18} color="white" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-medium text-ios-label dark:text-iosd-label">
            {t("settings.language.title")}
          </Text>
          <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
            {LANGS.find((l) => l.code === selectedCode)?.label}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#8E8E93" : "#999999"}
        />
      </Pressable>

      {/* Modal */}
      <AppModal
        visible={open}
        onClose={handleClose}
        title={t("settings.language.modal.title")}
        message={t("settings.language.modal.subtitle")}
      >
        <View className="px-2 pb-2">
          {LANGS.map((l, idx) => {
            const active = l.code === selectedCode;
            return (
              <Pressable
                key={l.code}
                onPress={() => apply(l.code)}
                accessibilityRole="button"
                className={[
                  "flex-row items-center justify-between px-4 py-3.5 rounded-2xl",
                  active
                    ? "bg-ios-blue/20 dark:bg-ios-blue/30"
                    : "bg-white dark:bg-white/20",
                  idx > 0 ? "mt-2" : "",
                  "border",
                  active
                    ? "border-ios-blue/30 dark:border-ios-blue/40"
                    : "border-black/5 dark:border-white/20",
                  "active:opacity-70",
                ].join(" ")}
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{l.emoji}</Text>
                  <Text className="text-base font-medium text-ios-label dark:text-iosd-label">
                    {l.label}
                  </Text>
                </View>

                {active ? (
                  <View className="w-7 h-7 rounded-full bg-ios-blue items-center justify-center shadow-sm">
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </View>
                ) : (
                  <View className="w-7 h-7 rounded-full border-2 border-black/15 dark:border-white/30" />
                )}
              </Pressable>
            );
          })}

          <Pressable
            onPress={handleClose}
            className="mt-4 self-center px-6 py-2.5 rounded-full bg-white dark:bg-white/20 border border-black/10 dark:border-white/20 active:opacity-70"
            accessibilityRole="button"
          >
            <Text className="text-sm font-medium text-ios-label dark:text-iosd-label">
              {t("settings.language.modal.close")}
            </Text>
          </Pressable>
        </View>
      </AppModal>
    </>
  );
}
