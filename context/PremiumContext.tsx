import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
} from "react-native-purchases";

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  checkPremiumStatus: () => Promise<void>;
  rcReady: boolean;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  loading: true,
  checkPremiumStatus: async () => {},
  rcReady: false,
});

let RC_CONFIGURED = false;

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rcReady, setRcReady] = useState(false);

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremium = "premium" in customerInfo.entitlements.active;
      setIsPremium(hasPremium);
      console.log("🎯 [Premium] Status:", hasPremium);
      console.log("👤 [Premium] Customer ID:", customerInfo.originalAppUserId);
    } catch (error) {
      console.error("❌ [Premium] Check error:", error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  const debugOfferings = async () => {
    try {
      console.log("\n📦 [RevenueCat] Fetching offerings...");
      const offerings: PurchasesOfferings = await Purchases.getOfferings();

      console.log(
        "📦 [RevenueCat] Current offering ID:",
        offerings.current?.identifier || "NONE"
      );
      console.log(
        "📦 [RevenueCat] All offering IDs:",
        Object.keys(offerings.all)
      );

      if (offerings.current) {
        console.log(
          "📦 [RevenueCat] Current offering packages:",
          offerings.current.availablePackages.length
        );

        offerings.current.availablePackages.forEach((pkg, idx) => {
          console.log(`   ${idx + 1}. Package:`, {
            identifier: pkg.identifier,
            productId: pkg.product.identifier,
            price: pkg.product.priceString,
            title: pkg.product.title,
            currencyCode: pkg.product.currencyCode,
          });
        });
      } else {
        console.warn("⚠️ [RevenueCat] No current offering set!");
        console.log(
          "💡 [RevenueCat] Available offerings:",
          Object.keys(offerings.all)
        );

        // Pokušaj da prikažeš sve offerings
        Object.entries(offerings.all).forEach(([key, offering]) => {
          console.log(
            `   - Offering "${key}":`,
            offering.availablePackages.length,
            "packages"
          );
        });
      }
    } catch (error) {
      console.error("❌ [RevenueCat] Offerings error:", error);
    }
  };

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log("\n🚀 [RevenueCat] Initializing...");
        console.log(
          "🔧 [RevenueCat] Environment:",
          __DEV__ ? "DEVELOPMENT" : "PRODUCTION"
        );

        if (!RC_CONFIGURED) {
          const apiKey = __DEV__
            ? "test_XoMhxRwNNtjeaunyRfdBDGyYleo" // Test Store key
            : "goog_CMYmfINawxxWjDzuGttzYHVFIml"; // Production key

          console.log(
            "🔑 [RevenueCat] Using API key:",
            apiKey.substring(0, 10) + "..."
          );

          Purchases.configure({ apiKey });
          RC_CONFIGURED = true;
          console.log("✅ [RevenueCat] Configured successfully");
        } else {
          console.log("ℹ️ [RevenueCat] Already configured");
        }

        // Check if actually configured
        const isConfigured = await Purchases.isConfigured();
        console.log("✅ [RevenueCat] Is configured:", isConfigured);

        setRcReady(true);

        // Check premium status
        await checkPremiumStatus();

        // Debug offerings after short delay
        setTimeout(async () => {
          await debugOfferings();
        }, 1000);

        // Listen for updates
        Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
          console.log("🔄 [RevenueCat] Customer info updated");
          const hasPremium = "premium" in info.entitlements.active;
          setIsPremium(hasPremium);
          console.log("🎯 [Premium] New status:", hasPremium);
        });

        console.log("✅ [RevenueCat] Initialization complete\n");
      } catch (error) {
        console.error("❌ [RevenueCat] Init error:", error);
        setIsPremium(false);
        setLoading(false);
        setRcReady(false);
      }
    };

    initializeRevenueCat();
  }, []);

  return (
    <PremiumContext.Provider
      value={{ isPremium, loading, checkPremiumStatus, rcReady }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
