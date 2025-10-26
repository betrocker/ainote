// src/lib/revenuecat-init.ts
import Purchases, { LOG_LEVEL } from "react-native-purchases";

// 1) Uvek postavi validan log handler ODMAH (pre bilo čega drugog)
Purchases.setLogHandler((level, message) => {
  if (__DEV__) {
    // Ne koristimo console.warn/error da ne boji svaki log crveno
    console.log(`[RevenueCat ${level}] ${message}`);
  }
});

// 2) Po želji nivo logovanja (pre configure – bezbedno)
try {
  Purchases.setLogLevel(LOG_LEVEL?.DEBUG ?? 3);
} catch {
  // ignore
}
