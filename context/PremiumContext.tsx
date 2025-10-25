// context/PremiumContext.tsx
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
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();

      console.log(
        "👤 [PremiumContext] Customer ID:",
        customerInfo.originalAppUserId
      );
      console.log(
        "✅ [PremiumContext] Active entitlements:",
        Object.keys(customerInfo.entitlements.active)
      );

      const hasPremium = "premium" in customerInfo.entitlements.active;
      console.log("🎯 [PremiumContext] Premium status:", hasPremium);

      setIsPremium(hasPremium);
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

        const useTestStore =
          process.env.EXPO_PUBLIC_USE_TEST_STORE === "true" || __DEV__;

        const apiKey = useTestStore
          ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY ||
            "test_XoMhxRwNNtjeaunyRfdBDGyYleo"
          : process.env.EXPO_PUBLIC_REVENUECAT_PROD_KEY ||
            "goog_CMYmfINawxxWjDzuGttzYHVFIml";

        console.log(
          "🔑 [PremiumContext] Using",
          useTestStore ? "Test Store" : "Google Play"
        );

        // Check if already configured
        let isConfigured = false;
        try {
          await Purchases.getCustomerInfo();
          isConfigured = true;
          console.log("✅ [PremiumContext] RevenueCat already configured");
        } catch (e) {
          console.log("⚙️ [PremiumContext] Configuring for first time...");
        }

        if (!isConfigured) {
          // ⭐ configure je void - ne vraća Promise
          Purchases.configure({ apiKey });

          // ⭐ Dodaj mali delay da osiguraš da je native module spreman
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log("✅ [PremiumContext] RevenueCat configured");
        }

        // Proveri premium status
        await checkPremiumStatus();

        // Dodaj listener NAKON što je sve spremno
        Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
          console.log("🔄 [PremiumContext] Customer info updated");

          const hasPremium = "premium" in info.entitlements.active;
          setIsPremium(hasPremium);

          if (hasPremium) {
            console.log("🎉 [PremiumContext] User upgraded to premium!");
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
