// app/subscription.tsx ili components/SubscriptionScreen.tsx
import { usePremium } from "@/context/PremiumContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isPremium, checkPremiumStatus, rcReady } = usePremium();

  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (rcReady) fetchOfferings(); // ⬅️ tek kad RC sigurno spreman
  }, [rcReady]);

  const fetchOfferings = async () => {
    try {
      console.log("🔍 [Subscription] Fetching offerings...");
      const res = await Purchases.getOfferings();
      console.log("🧾 Offerings dump:", JSON.stringify(res, null, 2));

      if (!res.current) {
        console.log("⚠️ [Subscription] No current offering found");
        Alert.alert("Error", "No subscription plans available");
        return;
      }

      const cur = res.current;
      setOfferings(cur);

      // Pronađi annual / monthly po packageType, pa fallback na $rc_* ili prvi paket
      const annual =
        cur.availablePackages.find((p) => p.packageType === "ANNUAL") ||
        cur.availablePackages.find((p) => p.identifier === "$rc_annual");

      const monthly =
        cur.availablePackages.find((p) => p.packageType === "MONTHLY") ||
        cur.availablePackages.find((p) => p.identifier === "$rc_monthly");

      const initial = annual ?? monthly ?? cur.availablePackages[0] ?? null;
      setSelectedPackage(initial);

      if (!cur.availablePackages.length) {
        Alert.alert(
          "No plans",
          "The current offering has no available packages. Check RevenueCat dashboard."
        );
      }
    } catch (error) {
      console.error("❌ [Subscription] Error fetching offerings:", error);
      Alert.alert(
        "Error",
        "Failed to load subscription plans. Check your RevenueCat offerings."
      );
    } finally {
      setLoading(false);
    }
  };

  const purchasePackage = async (packageToBuy: PurchasesPackage) => {
    if (purchasing) return;

    setPurchasing(true);
    console.log(
      "💳 [Subscription] Purchasing package:",
      packageToBuy.identifier
    );

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

      console.log("✅ [Subscription] Purchase successful!");
      console.log(
        "🎯 [Subscription] Active entitlements:",
        Object.keys(customerInfo.entitlements.active)
      );

      if (customerInfo.entitlements.active["premium"]) {
        console.log("🎉 [Subscription] Premium activated!");
        await checkPremiumStatus();

        Alert.alert(
          "🎉 Success!",
          "Welcome to AInote Premium! Enjoy unlimited AI features.",
          [
            {
              text: "Get Started",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("❌ [Subscription] Purchase error:", error);

      if (error.userCancelled) {
        console.log("⏭️ [Subscription] User cancelled purchase");
      } else {
        Alert.alert(
          "Purchase Failed",
          error.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    setLoading(true);
    try {
      console.log("🔄 [Subscription] Restoring purchases...");
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active["premium"]) {
        console.log("✅ [Subscription] Premium restored!");
        await checkPremiumStatus();
        Alert.alert("Success", "Your premium subscription has been restored!");
        router.back();
      } else {
        console.log("ℹ️ [Subscription] No active purchases found");
        Alert.alert(
          "No Purchases Found",
          "You don't have any active subscriptions to restore."
        );
      }
    } catch (error) {
      console.error("❌ [Subscription] Restore error:", error);
      Alert.alert("Error", "Failed to restore purchases");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-ios-bg dark:bg-iosd-bg items-center justify-center">
        <ActivityIndicator size="large" color="#A855F7" />
        <Text className="text-ios-secondary dark:text-iosd-label2 mt-4">
          Loading plans...
        </Text>
      </View>
    );
  }

  if (!offerings || offerings.availablePackages.length === 0) {
    return (
      <View className="flex-1 bg-ios-bg dark:bg-iosd-bg items-center justify-center p-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label mt-4 text-center">
          No Plans Available
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 bg-ios-blue rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const monthlyPackage = offerings.availablePackages.find(
    (pkg) => pkg.identifier === "$rc_monthly"
  );
  const annualPackage = offerings.availablePackages.find(
    (pkg) => pkg.identifier === "$rc_annual"
  );

  return (
    <View className="flex-1 bg-ios-bg dark:bg-iosd-bg">
      {/* Header */}
      <View className="px-6 pt-12 pb-6 bg-gradient-to-b from-purple-500 to-pink-500">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center bg-white/20 mb-4"
        >
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
            <Ionicons name="diamond" size={40} color="#FFF" />
          </View>
          <Text className="text-3xl font-bold text-white mb-2">
            AInote Premium
          </Text>
          <Text className="text-white/80 text-center text-base">
            Unlock unlimited AI features
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Benefits */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-ios-label dark:text-iosd-label mb-4">
              What you'll get:
            </Text>

            {[
              {
                icon: "infinite",
                text: "Unlimited AI transcriptions",
                color: "#A855F7",
              },
              {
                icon: "mic",
                text: "Audio & video note analysis",
                color: "#EF4444",
              },
              {
                icon: "cloud-upload",
                text: "Cloud sync across devices",
                color: "#3B82F6",
              },
              {
                icon: "search",
                text: "Advanced search & organization",
                color: "#10B981",
              },
            ].map((benefit, idx) => (
              <View key={idx} className="flex-row items-center mb-4">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: `${benefit.color}15` }}
                >
                  <Ionicons
                    name={benefit.icon as any}
                    size={24}
                    color={benefit.color}
                  />
                </View>
                <Text className="flex-1 text-base text-ios-label dark:text-iosd-label">
                  {benefit.text}
                </Text>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
            ))}
          </View>

          {/* Plans */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-ios-label dark:text-iosd-label mb-4">
              Choose your plan:
            </Text>

            {/* Annual Package */}
            {annualPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPackage(annualPackage)}
                className={`mb-3 p-4 rounded-2xl border-2 ${
                  selectedPackage?.identifier === annualPackage.identifier
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-ios-sep dark:border-iosd-sep bg-white/70 dark:bg-white/5"
                }`}
              >
                {/* Best Value Badge */}
                <View className="absolute -top-2 right-4 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    BEST VALUE
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-ios-label dark:text-iosd-label">
                      Annual
                    </Text>
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                      {annualPackage.product.priceString}/year
                    </Text>
                  </View>

                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selectedPackage?.identifier === annualPackage.identifier
                        ? "border-purple-500 bg-purple-500"
                        : "border-ios-sep dark:border-iosd-sep"
                    }`}
                  >
                    {selectedPackage?.identifier ===
                      annualPackage.identifier && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                </View>

                <Text className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Save 44% compared to monthly
                </Text>
              </TouchableOpacity>
            )}

            {/* Monthly Package */}
            {monthlyPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPackage(monthlyPackage)}
                className={`p-4 rounded-2xl border-2 ${
                  selectedPackage?.identifier === monthlyPackage.identifier
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-ios-sep dark:border-iosd-sep bg-white/70 dark:bg-white/5"
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-ios-label dark:text-iosd-label">
                      Monthly
                    </Text>
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                      {monthlyPackage.product.priceString}/month
                    </Text>
                  </View>

                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selectedPackage?.identifier === monthlyPackage.identifier
                        ? "border-purple-500 bg-purple-500"
                        : "border-ios-sep dark:border-iosd-sep"
                    }`}
                  >
                    {selectedPackage?.identifier ===
                      monthlyPackage.identifier && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                </View>

                <Text className="text-xs text-ios-secondary dark:text-iosd-label2">
                  Flexible monthly billing
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={() => selectedPackage && purchasePackage(selectedPackage)}
            disabled={!selectedPackage || purchasing}
            className={`py-4 rounded-2xl items-center justify-center mb-4 ${
              !selectedPackage || purchasing
                ? "bg-gray-400"
                : "bg-gradient-to-r from-purple-500 to-pink-500"
            }`}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white text-lg font-bold">
                Start 7-Day Free Trial
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases */}
          <TouchableOpacity
            onPress={restorePurchases}
            disabled={loading}
            className="py-3 items-center"
          >
            <Text className="text-ios-blue text-sm font-medium">
              Restore Purchases
            </Text>
          </TouchableOpacity>

          {/* Fine Print */}
          <Text className="text-xs text-ios-secondary dark:text-iosd-label2 text-center mt-4 leading-5">
            7-day free trial, then {selectedPackage?.product.priceString} per{" "}
            {selectedPackage?.identifier.includes("annual") ? "year" : "month"}.
            Cancel anytime. Terms apply.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
