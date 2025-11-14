// utils/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export async function registerForPushNotifications(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0A84FF",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  return true;
}

export async function scheduleDueDateNotification(
  noteId: string,
  title: string,
  dueDate: string
): Promise<string | null> {
  try {
    const dueDateTime = new Date(dueDate + "T09:00:00");
    const now = new Date();

    if (dueDateTime <= now) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📅 Due Today",
        body: title,
        data: { noteId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDateTime,
      },
    });

    return notificationId;
  } catch (error) {
    if (__DEV__) console.error("Error scheduling notification:", error);
    return null;
  }
}

export async function scheduleReminderNotification(
  noteId: string,
  title: string,
  dueDate: string
): Promise<string | null> {
  try {
    const dueDateTime = new Date(dueDate + "T09:00:00");
    const reminderTime = new Date(dueDateTime);
    reminderTime.setDate(reminderTime.getDate() - 1);

    const now = new Date();

    if (reminderTime <= now) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Reminder",
        body: `${title} is due tomorrow`,
        data: { noteId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });

    return notificationId;
  } catch (error) {
    if (__DEV__) console.error("Error scheduling reminder:", error);
    return null;
  }
}

export async function cancelNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    if (__DEV__) console.error("Error cancelling notification:", error);
  }
}

export async function cancelAllNotificationsForNote(noteId: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const noteNotifications = scheduled.filter(
      (n) => n.content.data?.noteId === noteId
    );

    for (const notification of noteNotifications) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  } catch (error) {
    if (__DEV__) console.error("Error cancelling notifications:", error);
  }
}

export async function scheduleDailyDigest(): Promise<string | null> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const existingDigest = scheduled.find(
      (n) => n.content.data?.type === "daily_digest"
    );

    if (existingDigest) {
      await Notifications.cancelScheduledNotificationAsync(
        existingDigest.identifier
      );
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 Daily Digest",
        body: "You have notes due today",
        data: { type: "daily_digest" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });

    return notificationId;
  } catch (error) {
    if (__DEV__) console.error("Error scheduling daily digest:", error);
    return null;
  }
}
