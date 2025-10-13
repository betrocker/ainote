// components/NoteCard.tsx
import Card from "@/components/ui/Card";
import Label from "@/components/ui/Label";
import SubLabel from "@/components/ui/SubLabel";
import type { Note } from "@/context/NotesContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

type Props = {
  note: Note;
  onPress?: (n: Note) => void;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  className?: string;
};

const typeMeta: Record<
  Note["type"],
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    badgeLight: string; // light theme badge bg
    badgeDark: string; // dark theme badge bg
  }
> = {
  text: {
    icon: "document-text-outline",
    color: "#0A84FF",
    badgeLight: "bg-ios-blue/15",
    badgeDark: "bg-ios-blue/22",
  },
  audio: {
    icon: "mic-outline",
    color: "#A855F7",
    badgeLight: "bg-purple-500/15",
    badgeDark: "bg-purple-500/22",
  },
  photo: {
    icon: "camera-outline",
    color: "#F59E0B",
    badgeLight: "bg-orange-500/15",
    badgeDark: "bg-orange-500/22",
  },
  video: {
    icon: "videocam-outline",
    color: "#10B981",
    badgeLight: "bg-emerald-500/15",
    badgeDark: "bg-emerald-500/22",
  },
};

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoteCard({
  note,
  onPress,
  onEdit,
  onDelete,
  className = "",
}: Props) {
  const meta = typeMeta[note.type] ?? typeMeta.text;

  return (
    <Card
      onPress={onPress ? () => onPress(note) : undefined}
      padding="lg"
      withBorder
      className={[
        // izgled “kao confirm modal”
        "rounded-[24px] overflow-hidden",
        "mb-3", // razmak između kartica
        "backdrop-blur-md",
        "bg-white/85 dark:bg-black/35", // JASNIJA razlika po temi
        "border border-black/10 dark:border-white/15",
        "shadow-sm dark:shadow-none", // suptilno u light, čisto u dark
        "active:scale-[0.99] transition-transform",
        className,
      ].join(" ")}
    >
      <View className="flex-row items-start">
        {/* Tip badge */}
        <View
          className={[
            "w-10 h-10 rounded-2xl mr-3 items-center justify-center",
            meta.badgeLight,
            "dark:" + meta.badgeDark,
            "border border-black/10 dark:border-white/12",
          ].join(" ")}
        >
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>

        {/* Tekstualni deo */}
        <View className="flex-1">
          <Label size="lg" numberOfLines={1}>
            {note.title?.trim() || "Untitled"}
          </Label>
          <SubLabel
            size="sm"
            tone="secondary"
            numberOfLines={1}
            className="mt-0.5"
          >
            {formatDate(note.createdAt)}
          </SubLabel>
        </View>

        {/* Akcije */}
        <View className="flex-row items-center ml-3">
          {onEdit && (
            <TouchableOpacity
              accessibilityLabel="Edit note"
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 rounded-xl items-center justify-center bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/12 active:opacity-90 mr-1.5"
            >
              <Ionicons name="create-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              accessibilityLabel="Delete note"
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 rounded-xl items-center justify-center bg-red-500/12 dark:bg-red-500/20 border border-red-500/25 dark:border-red-500/30 active:opacity-90"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}
