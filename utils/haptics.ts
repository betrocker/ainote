// utils/haptics.ts
import * as Haptics from "expo-haptics";

export const haptics = {
  // Light tap - za button taps, switches
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium tap - za important actions
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy tap - za destructive actions
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Success - za completed actions
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Warning - za warnings
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // Error - za errors
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Selection - za picker/slider changes
  selection: () => {
    Haptics.selectionAsync();
  },
};
