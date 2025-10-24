// context/PremiumContext.tsx
import Constants from "expo-constants";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  checkPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  loading: true,
  checkPremiumStatus: async () => {},
});

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPremiumStatus = async () => {
    try {
      // ⭐ FORCE REFRESH - ne koristi cache
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();

      // ⭐ Log EVERYTHING za debug
      console.log(
        "👤 [PremiumContext] Customer ID:",
        customerInfo.originalAppUserId
      );
      console.log(
        "📦 [PremiumContext] All entitlements:",
        Object.keys(customerInfo.entitlements.all)
      );
      console.log(
        "✅ [PremiumContext] Active entitlements:",
        Object.keys(customerInfo.entitlements.active)
      );
      console.log(
        "🛒 [PremiumContext] Purchased products:",
        customerInfo.allPurchasedProductIdentifiers
      );
      console.log(
        "📅 [PremiumContext] Active subscriptions:",
        customerInfo.activeSubscriptions
      );

      // ⭐ EKSPLICITNA provera - mora biti u active, ne u all
      const hasPremium = "premium" in customerInfo.entitlements.active;

      console.log("🎯 [PremiumContext] Premium status:", hasPremium);
      console.log(
        "🔍 [PremiumContext] Premium entitlement exists in active?",
        hasPremium
      );

      setIsPremium(hasPremium);

      if (hasPremium) {
        const premiumEntitlement = customerInfo.entitlements.active["premium"];
        console.log("✅ [PremiumContext] Premium details:", {
          identifier: premiumEntitlement.identifier,
          productIdentifier: premiumEntitlement.productIdentifier,
          expirationDate: premiumEntitlement.expirationDate,
          isActive: premiumEntitlement.isActive,
          willRenew: premiumEntitlement.willRenew,
        });
      } else {
        console.log(
          "❌ [PremiumContext] No premium entitlement found in active entitlements"
        );
      }
    } catch (error) {
      console.error("❌ [PremiumContext] Error checking premium:", error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log("🚀 [PremiumContext] Configuring RevenueCat...");

        const isExpoGo = Constants.appOwnership === "expo";

        const apiKey = isExpoGo
          ? "test_XoMhxRwNNtjeaunyRfdBDGyYleo"
          : "goog_CMYmfINawxxWjDzuGttzYHVFIml";

        console.log(
          "🔑 [PremiumContext] Using",
          isExpoGo ? "Test Store" : "Google Play",
          "API key"
        );

        try {
          await Purchases.getCustomerInfo();
          console.log("✅ [PremiumContext] RevenueCat already configured");
        } catch (e) {
          console.log(
            "⚙️ [PremiumContext] Configuring RevenueCat for first time..."
          );
          await Purchases.configure({ apiKey });
          Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
          console.log("✅ [PremiumContext] RevenueCat configured successfully");

          const info = await Purchases.getCustomerInfo();
          console.log(
            "✅ [PremiumContext] New customer created:",
            info.originalAppUserId
          );
        }

        // ⭐ ODMAH proveri premium status
        await checkPremiumStatus();

        // Listener za promene
        Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
          console.log("🔄 [PremiumContext] Customer info updated");

          const hasPremium = "premium" in info.entitlements.active;
          console.log("🔄 [PremiumContext] New premium status:", hasPremium);

          setIsPremium(hasPremium);

          if (hasPremium) {
            console.log("🎉 [PremiumContext] User upgraded to premium!");
          } else {
            console.log("⏹️ [PremiumContext] Premium expired or cancelled");
          }
        });
      } catch (error) {
        console.error("❌ [PremiumContext] Initialization error:", error);
        setIsPremium(false);
        setLoading(false);
      }
    };

    initializeRevenueCat();

    return () => {
      console.log("🛑 [PremiumContext] Cleanup");
    };
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, checkPremiumStatus, loading }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  return context;
};
