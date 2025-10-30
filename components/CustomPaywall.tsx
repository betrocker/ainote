// components/CustomPaywall.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CustomPaywallProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CustomPaywall({
  visible,
  onClose,
  onSuccess,
}: CustomPaywallProps) {
  const { t } = useTranslation("common");
  const { colorScheme } = useColorScheme();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();

      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const pkgs = offerings.current.availablePackages;
        setPackages(pkgs);

        // Auto-select najčešći paket (obično monthly)
        const monthly = pkgs.find((p) => p.identifier === "$rc_monthly");
        setSelectedPackage(monthly || pkgs[0]);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
      Alert.alert(t("paywall.error.title"), t("paywall.error.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Dodaj ovu funkciju u CustomPaywall komponentu
  const getTrialInfo = (pkg: PurchasesPackage) => {
    const defaultOption = pkg.product.defaultOption;
    const freePhase = defaultOption?.freePhase;

    if (freePhase) {
      const { value, unit } = freePhase.billingPeriod;

      if (unit === "DAY") {
        return t("paywall.trial.days", { count: value });
      } else if (unit === "WEEK") {
        return t("paywall.trial.weeks", { count: value });
      } else if (unit === "MONTH") {
        return t("paywall.trial.months", { count: value });
      }
    }

    return null;
  };

  const handlePurchase = async () => {
    if (!selectedPackage || purchasing) return;

    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

      if (customerInfo.entitlements.active["premium"]) {
        onSuccess?.();
        onClose();
        Alert.alert(t("paywall.success.title"), t("paywall.success.message"));
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(
          t("paywall.error.title"),
          t("paywall.error.purchaseFailed")
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active["premium"]) {
        onSuccess?.();
        onClose();
        Alert.alert(t("paywall.restore.success"), t("paywall.restore.message"));
      } else {
        Alert.alert(
          t("paywall.restore.noPurchases"),
          t("paywall.restore.noPurchasesMessage")
        );
      }
    } catch (error) {
      Alert.alert(t("paywall.error.title"), t("paywall.error.restoreFailed"));
    } finally {
      setPurchasing(false);
    }
  };

  const getPackagePrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const getPackageName = (pkg: PurchasesPackage) => {
    if (pkg.identifier === "$rc_monthly") return t("paywall.plans.monthly");
    if (pkg.identifier === "$rc_annual") return t("paywall.plans.annual");
    if (pkg.identifier === "$rc_lifetime") return t("paywall.plans.lifetime");
    return pkg.product.title;
  };

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={StyleSheet.absoluteFill}
        className="bg-black/70 dark:bg-black/85"
      >
        <BlurView
          intensity={isDark ? 80 : 50}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View className="flex-1 justify-end">
        <View className="bg-white dark:bg-gray-900 rounded-t-3xl overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <Text className="text-2xl font-monaBold text-gray-900 dark:text-white">
              {t("paywall.title")}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center"
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? "#fff" : "#000"}
              />
            </Pressable>
          </View>

          <ScrollView className="max-h-[70vh]">
            {/* Features */}
            <View className="p-6">
              <Text className="text-lg font-monaBold text-gray-900 dark:text-white mb-4">
                {t("paywall.features.title")}
              </Text>

              {[
                { icon: "infinite", text: t("paywall.features.unlimited") },
                { icon: "videocam", text: t("paywall.features.video") },
                { icon: "cloud", text: t("paywall.features.sync") },
                { icon: "search", text: t("paywall.features.search") },
              ].map((feature, idx) => (
                <View key={idx} className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center mr-3">
                    <Ionicons
                      name={feature.icon as any}
                      size={20}
                      color="white"
                    />
                  </View>
                  <Text className="text-base text-gray-700 dark:text-gray-300 flex-1">
                    {feature.text}
                  </Text>
                  <Ionicons name="checkmark" size={24} color="#22C55E" />
                </View>
              ))}
            </View>

            {/* Packages */}
            {loading ? (
              <View className="p-6">
                <ActivityIndicator size="large" />
              </View>
            ) : (
              <View className="px-6 pb-6">
                <Text className="text-lg font-monaBold text-gray-900 dark:text-white mb-4">
                  {t("paywall.choosePlan")}
                </Text>

                {packages.map((pkg) => {
                  const isSelected =
                    selectedPackage?.identifier === pkg.identifier;
                  const isAnnual = pkg.identifier === "$rc_annual";
                  const trialInfo = getTrialInfo(pkg); // Dodaj ovo

                  return (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => setSelectedPackage(pkg)}
                      className={`mb-3 rounded-2xl border-2 overflow-hidden ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      }`}
                    >
                      {/* Best Value Badge */}
                      {isAnnual && (
                        <View className="bg-green-500 py-1.5">
                          <Text className="text-white text-xs font-monaBold text-center">
                            {t("paywall.bestValue")}
                          </Text>
                        </View>
                      )}

                      <View className="p-4 flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-lg font-monaBold text-gray-900 dark:text-white">
                            {getPackageName(pkg)}
                          </Text>

                          {/* Prikaži Free Trial ako postoji */}
                          {trialInfo && (
                            <View className="bg-green-500 px-2 py-1 rounded-md mt-1 self-start">
                              <Text className="text-white text-xs font-monaBold">
                                {trialInfo}
                              </Text>
                            </View>
                          )}

                          <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {getPackagePrice(pkg)}
                          </Text>
                        </View>

                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Terms */}
            <View className="px-6 pb-6">
              <Text className="text-xs text-center text-gray-500 dark:text-gray-400 leading-5">
                {t("paywall.terms")}
              </Text>
            </View>
          </ScrollView>

          {/* CTA Buttons */}
          <View
            className="p-6 border-t border-gray-200 dark:border-gray-800"
            style={{ paddingBottom: Math.max(insets.bottom + 24, 24) }} // Dynamic bottom padding
          >
            <Pressable
              onPress={handlePurchase}
              disabled={!selectedPackage || purchasing}
              className={`py-4 rounded-2xl items-center ${
                purchasing || !selectedPackage
                  ? "bg-gray-300 dark:bg-gray-700"
                  : "bg-blue-500"
              }`}
            >
              {purchasing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-monaBold">
                  {t("paywall.subscribe")}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleRestore}
              disabled={purchasing}
              className="py-3 mt-3"
            >
              <Text className="text-center text-blue-500 font-medium">
                {t("paywall.restore.button")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
