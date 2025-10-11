import AppModal from "@/components/ui/AppModal";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type LangCode = "sr" | "en" | "de";
type Lang = { code: LangCode; label: string; emoji: string };

const LANGS: Lang[] = [
  { code: "sr", label: "Srpski", emoji: "🇷🇸" },
  { code: "en", label: "English", emoji: "🇬🇧" }, // zastava radi jasnoće UI-ja
  { code: "de", label: "Deutsch", emoji: "🇩🇪" },
];

export default function LanguagePicker() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = i18n.language || "en";

  const selectedCode = useMemo<LangCode>(() => {
    const base = (current || "en").split("-")[0] as LangCode | string;
    return ["sr", "en", "de"].includes(base) ? (base as LangCode) : "en";
  }, [current]);

  const apply = (code: LangCode) => {
    if (code !== selectedCode) i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <>
      {/* Settings row (otvara modal) */}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center py-3 px-6 active:opacity-90"
        accessibilityRole="button"
      >
        <View className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center mr-3">
          <Ionicons name="language-outline" size={18} color="white" />
        </View>

        <View className="flex-1">
          <Text className="text-base text-ios-label dark:text-iosd-label">
            App Language
          </Text>
          <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
            {LANGS.find((l) => l.code === selectedCode)?.label}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#999" />
      </Pressable>

      {/* Separator (po želji, ako je u kartici sa više redova) */}
      {/* <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" /> */}

      {/* Modal sa listom jezika */}
      <AppModal
        visible={open}
        onClose={() => setOpen(false)}
        title="App Language"
        message="Choose your preferred language"
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
                  "flex-row items-center justify-between px-4 py-3 rounded-2xl",
                  active
                    ? "bg-ios-blue/15 dark:bg-ios-blue/20"
                    : "bg-white/70 dark:bg-white/10",
                  idx > 0 ? "mt-2" : "",
                  "border border-black/10 dark:border-white/10",
                ].join(" ")}
              >
                <View className="flex-row items-center">
                  <Text className="text-lg mr-2">{l.emoji}</Text>
                  <Text className="text-base text-ios-label dark:text-iosd-label">
                    {l.label}
                  </Text>
                </View>

                {active ? (
                  <View className="w-7 h-7 rounded-full bg-ios-blue items-center justify-center">
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                ) : (
                  <View className="w-7 h-7 rounded-full border border-black/20 dark:border-white/20" />
                )}
              </Pressable>
            );
          })}

          {/* Footer dugme za zatvaranje (opciono) */}
          <Pressable
            onPress={() => setOpen(false)}
            className="mt-4 self-center px-5 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 active:opacity-90"
          >
            <Text className="text-sm text-ios-label dark:text-iosd-label">
              Close
            </Text>
          </Pressable>
        </View>
      </AppModal>
    </>
  );
}
