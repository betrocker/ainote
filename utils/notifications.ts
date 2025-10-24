// utils/notifications.ts - ISPRAVLJENO SA TYPE PROPERTY
import * as Device from "expo-device";
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
  console.log("🔔 [registerForPushNotifications] Starting...");
  console.log("🔔 Device.isDevice:", Device.isDevice);
  console.log("🔔 Platform.OS:", Platform.OS);

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0A84FF",
    });
    console.log("🔔 Android notification channel created");
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log("🔔 Existing permission status:", existingStatus);

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    console.log("🔔 Requesting permissions...");
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log("🔔 Permission request result:", status);
  }

  if (finalStatus !== "granted") {
    console.log("❌ Notification permission denied");
    return false;
  }

  console.log("✅ Notification permission granted (local notifications)");
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
      console.log("⚠️ Due date is in the past, skipping notification");
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

    console.log("✅ Scheduled notification:", notificationId);
    console.log("⏰ Will trigger on:", dueDateTime.toISOString());
    return notificationId;
  } catch (error) {
    console.error("❌ Error scheduling notification:", error);
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
      console.log("⚠️ Reminder time is in the past, skipping");
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

    console.log("✅ Scheduled reminder:", notificationId);
    console.log("⏰ Will trigger on:", reminderTime.toISOString());
    return notificationId;
  } catch (error) {
    console.error("❌ Error scheduling reminder:", error);
    return null;
  }
}

export async function cancelNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log("✅ Cancelled notification:", notificationId);
  } catch (error) {
    console.error("❌ Error cancelling notification:", error);
  }
}

export async function cancelAllNotificationsForNote(noteId: string) {
  try {
    console.log(
      "🔕 [cancelAllNotifications] Starting for:",
      noteId.slice(0, 8)
    );

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(
      "🔕 [cancelAllNotifications] Total scheduled:",
      scheduled.length
    );

    const noteNotifications = scheduled.filter(
      (n) => n.content.data?.noteId === noteId
    );
    console.log(
      "🔕 [cancelAllNotifications] Found for this note:",
      noteNotifications.length
    );

    for (const notification of noteNotifications) {
      console.log(
        "🔕 [cancelAllNotifications] Cancelling:",
        notification.identifier
      );
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }

    console.log(
      `✅ Cancelled ${noteNotifications.length} notifications for note ${noteId.slice(0, 8)}`
    );
  } catch (error) {
    console.error("❌ Error cancelling notifications:", error);
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

    console.log("✅ Scheduled daily digest:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("❌ Error scheduling daily digest:", error);
    return null;
  }
}

export async function getAllScheduledNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log("📅 Total scheduled notifications:", scheduled.length);

    scheduled.forEach((n, index) => {
      console.log(`\n📬 Notification ${index + 1}:`);
      console.log("  ID:", n.identifier);
      console.log("  Title:", n.content.title);
      console.log("  Body:", n.content.body);
      console.log("  Trigger:", n.trigger);
    });

    return scheduled;
  } catch (error) {
    console.error("❌ Error getting scheduled notifications:", error);
    return [];
  }
}

export async function scheduleTestNotification(
  seconds: number = 5,
  noteId?: string // Opcioni noteId
) {
  try {
    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + seconds);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 Test Notification",
        body: `This is a test notification after ${seconds} seconds`,
        data: {
          test: true,
          ...(noteId && { noteId }), // Dodaj noteId ako postoji
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log(`✅ Test notification scheduled for ${seconds}s:`, id);
    console.log("⏰ Will trigger at:", triggerDate.toISOString());
    return id;
  } catch (error) {
    console.error("❌ Test notification error:", error);
    return null;
  }
}
