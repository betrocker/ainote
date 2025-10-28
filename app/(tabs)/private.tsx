import { useNotes } from "@/context/NotesContext";
import { Note } from "@/types/note";
import {
  authenticateWithBiometric,
  checkBiometricSupport,
  getBiometricType,
} from "@/utils/biometric";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Pressable, Text, View } from "react-native";

export default function PrivateFolderScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { notes } = useNotes();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [privateNotes, setPrivateNotes] = useState<Note[]>([]);

  useEffect(() => {
    initBiometric();
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      loadPrivateNotes();
    }
  }, [isUnlocked, notes]);

  const initBiometric = async () => {
    const { compatible, enrolled } = await checkBiometricSupport();

    if (!compatible) {
      Alert.alert(t("privateFolder.errors.noHardware"));
      return;
    }

    if (!enrolled) {
      Alert.alert(
        t("privateFolder.errors.notEnrolled"),
        t("privateFolder.errors.notEnrolledMessage")
      );
      return;
    }

    const type = await getBiometricType();
    setBiometricType(type);
  };

  const handleUnlock = async () => {
    const success = await authenticateWithBiometric();

    if (success) {
      setIsUnlocked(true);
      loadPrivateNotes();
    } else {
      Alert.alert(
        t("privateFolder.errors.authFailed"),
        t("privateFolder.errors.authFailedMessage")
      );
    }
  };

  const loadPrivateNotes = () => {
    const filtered = notes.filter((note) => note.isPrivate === true);
    setPrivateNotes(filtered);
    console.log("🔒 [PrivateFolder] Loaded", filtered.length, "private notes");
  };

  // Locked view
  if (!isUnlocked) {
    return (
      <View className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-8">
          <BlurView
            intensity={20}
            tint="dark"
            className="w-32 h-32 rounded-full items-center justify-center mb-8"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Ionicons name="lock-closed" size={60} color="white" />
          </BlurView>

          <Text className="text-white text-3xl font-bold mb-3">
            {t("privateFolder.locked.title")}
          </Text>

          <Text className="text-white/60 text-base text-center mb-12 leading-6">
            {t("privateFolder.locked.description", { biometricType })}
          </Text>

          <Pressable
            onPress={handleUnlock}
            className="bg-white rounded-2xl px-12 py-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="finger-print" size={24} color="black" />
              <Text className="text-black text-base font-semibold">
                {t("privateFolder.locked.unlockButton")}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  // Unlocked view
  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="pt-14 pb-4 px-6 border-b border-white/10">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Ionicons name="lock-open" size={24} color="white" />
            <Text className="text-white text-2xl font-bold">
              {t("privateFolder.unlocked.title")}
            </Text>
          </View>

          <Pressable
            onPress={() => setIsUnlocked(false)}
            className="active:opacity-60"
          >
            <Ionicons name="lock-closed-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Notes List */}
      {privateNotes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons
            name="document-lock-outline"
            size={80}
            color="rgba(255,255,255,0.3)"
          />
          <Text className="text-white/60 text-lg text-center mt-6">
            {t("privateFolder.unlocked.empty.title")}
          </Text>
          <Text className="text-white/40 text-sm text-center mt-2">
            {t("privateFolder.unlocked.empty.subtitle")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={privateNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/note/${item.id}`)}
              className="bg-zinc-900 rounded-2xl p-4 mb-3 active:opacity-80"
            >
              <Text className="text-white text-lg font-semibold mb-2">
                {item.title}
              </Text>
              <Text className="text-white/60 text-sm" numberOfLines={2}>
                {item.text ||
                  item.content ||
                  t("privateFolder.unlocked.noteContent.noContent")}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
