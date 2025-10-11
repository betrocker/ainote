import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderProps = {
  title: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
};

export default function Header({
  title,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
}: HeaderProps) {
  const { theme } = useTheme();
  const iconColor = theme === "dark" ? "white" : "black";
  const blurTint = theme === "dark" ? "dark" : "light";
  const insets = useSafeAreaInsets();

  const headerHeight = insets.top + 60;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: headerHeight,
        paddingTop: insets.top,
        zIndex: 10,
        elevation: 10,
      }}
    >
      <BlurView
        intensity={50}
        tint={blurTint}
        style={StyleSheet.absoluteFill}
      />

      {/* Inline row: left icon – title – right icon */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: 44,
          paddingHorizontal: 16,
        }}
      >
        {leftIcon ? (
          <TouchableOpacity onPress={onLeftPress}>
            <Ionicons name={leftIcon} size={24} color={iconColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}

        <Text style={{ fontSize: 26, fontWeight: "700", color: iconColor }}>
          {title}
        </Text>

        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress}>
            <Ionicons name={rightIcon} size={24} color={iconColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>
    </View>
  );
}
