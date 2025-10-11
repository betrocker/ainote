// app/home.tsx
import ScreenScroll from "@/components/ScreenScroll";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { useModal } from "@/context/ModalContext";
import { useNotes } from "@/context/NotesContext";
import Header from "@components/Header";
import ScreenBackground from "@components/ScreenBackground";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View className="px-3 py-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 mr-2 mb-2">
      <Text className="text-[12px] text-ios-label dark:text-iosd-label">
        {label}: <Text className="font-semibold">{value}</Text>
      </Text>
    </View>
  );
}

function MiniWeekChart({ counts }: { counts: number[] }) {
  // jednostavan bar chart bez dodatnih biblioteka
  const max = Math.max(1, ...counts);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const { t } = useTranslation("common");

  return (
    <View className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 p-4">
      <Text className="text-ios-label dark:text-iosd-label font-medium mb-3">
        {t("home.thisWeek")}
      </Text>
      <View className="flex-row justify-between items-end h-28">
        {counts.map((v, i) => {
          const h = Math.round((v / max) * 100); // %
          return (
            <View key={i} className="items-center" style={{ width: 24 }}>
              <View
                className="w-3 rounded-lg bg-apple-blue/80"
                style={{ height: `${h}%` }}
              />
              <Text className="mt-2 text-[11px] text-ios-secondary dark:text-iosd-secondary">
                {days[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notes } = useNotes();
  const { colorScheme } = useColorScheme();
  const { prompt } = useModal();
  const { openModal } = useModal();
  const { alert } = useModal();
  const { confirm } = useModal();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const canSave = name.trim() || email.trim();

  // Statistika
  const { total, todayCount, byType, weekCounts } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const byType = { text: 0, audio: 0, photo: 0, image: 0 } as Record<
      string,
      number
    >;
    let todayCount = 0;

    const weekCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    const getWeekIndex = (d: Date) => {
      const js = d.getDay(); // 0..Sun
      return (js + 6) % 7; // 0=Mon
    };

    (notes || []).forEach((n) => {
      // @ts-ignore (ako Note ima drugačiji shape, prilagodi datume)
      const created = n.createdAt ? new Date(n.createdAt) : new Date();
      if (created.toDateString() === todayStr) todayCount++;
      if (n.type && byType[n.type] !== undefined) byType[n.type]++;

      const idx = getWeekIndex(created);
      weekCounts[idx]++;
    });

    return {
      total: notes?.length || 0,
      todayCount,
      byType,
      weekCounts,
    };
  }, [notes]);

  return (
    <ScreenBackground variant="grouped">
      <Header
        title={t("screen.home.title")}
        rightIcon="settings-outline"
        onRightPress={() => router.push("/settings")}
      />

      <ScreenScroll
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero pozdrav */}
        <View className="mb-6">
          <Text className="text-ios-secondary dark:text-iosd-label2 text-[16px]">
            {t("home.welcome")}
          </Text>
          <Text className="text-2xl font-monaBold text-ios-label dark:text-iosd-label mt-1">
            {t("home.notesToday", { count: todayCount })}
          </Text>
        </View>

        {/* Statistika u pilovima */}
        <View className="mb-6">
          <Text className="section-title text-ios-label dark:text-iosd-label mb-3">
            {t("home.stats")}
          </Text>
          <View className="flex-row flex-wrap">
            <StatPill label={t("home.total")} value={total} />
            <StatPill label="Text" value={byType.text || 0} />
            <StatPill label="Audio" value={byType.audio || 0} />
            <StatPill label="Photo" value={byType.photo || 0} />
          </View>
        </View>

        {/* Nedeljni mini graf */}
        <MiniWeekChart counts={weekCounts} />

        <Button variant="primary" title="Primary" className="mb-4 mt-4" />
        <Button variant="secondary" title="Second" className="mb-4" />
        <Button variant="destructive" title="Destructive button" />

        <View className="flex-1 px-4 pt-4">
          <Label>Ime i prezime</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Unesi svoje ime"
            returnKeyType="next"
            textContentType="name"
          />

          <Label>Email</Label>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="primer@domen.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            returnKeyType="done"
          />

          <Button
            title="Snimi"
            variant="secondary"
            className="mt-2"
            disabled={!canSave}
            onPress={() => {
              /* snimi */
            }}
          />
        </View>

        <View className="p-4">
          <Button
            title="Otvori prompt"
            onPress={() =>
              prompt({
                title: "A Short Title Is Best",
                message: "A message should be a short, complete sentence.",
                placeholder: "Placeholder",
                submitLabel: "Continue",
                cancelLabel: "Cancel",
                submitVariant: "primary", // plavo
                cancelVariant: "secondary", // sivo
                onSubmit: (v) => console.log("unos:", v),
              })
            }
          />
        </View>

        <View className="p-4">
          <Button
            title="Otvori 3 akcije"
            onPress={() =>
              openModal({
                title: "Choose Action",
                message: "Pick one of the options below.",
                actions: [
                  {
                    label: "Option 1",
                    variant: "secondary",
                    onPress: () => {},
                  },
                  { label: "Option 2", variant: "primary", onPress: () => {} }, // plavo
                  {
                    label: "Delete",
                    variant: "destructive",
                    onPress: () => {},
                  },
                ],
                twoPlusOneForThree: true,
              })
            }
          />

          <Button
            title="Otvori akcije"
            variant="primary"
            onPress={() =>
              openModal({
                title: "More Actions",
                actions: [
                  { label: "One", variant: "secondary", onPress: () => {} },
                  { label: "Two", variant: "primary", onPress: () => {} },
                  { label: "Three", variant: "destructive", onPress: () => {} },
                ],
                twoPlusOneForThree: false,
              })
            }
          />

          <Button
            title="Prikaži Alert"
            onPress={() => alert("Ovo je informativna poruka.", "Info")}
          />

          <Button
            title="Prikaži Confirm"
            onPress={() =>
              confirm(
                "Da li si siguran?",
                () => {
                  // callback kad korisnik potvrdi
                  console.log("Potvrđeno!");
                },
                "Potvrda"
              )
            }
          />
        </View>
      </ScreenScroll>
    </ScreenBackground>
  );
}
