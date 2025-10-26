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
      console.log("🎯 Premium status:", hasPremium);
    } catch (error) {
      console.error("❌ Premium check error:", error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log("🚀 Initializing RevenueCat...");

        if (!RC_CONFIGURED) {
          const apiKey = __DEV__
            ? "test_XoMhxRwNNtjeaunyRfdBDGyYleo"
            : "goog_CMYmfINawxxWjDzuGttzYHVFIml";

          Purchases.configure({ apiKey });
          setRcReady(true);
          RC_CONFIGURED = true;
          console.log("✅ Purchases configured");
        } else {
          console.log("ℹ️ Purchases already configured");
        }

        await checkPremiumStatus();

        Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
          console.log("🔄 Customer info updated");
          const hasPremium = "premium" in info.entitlements.active;
          setIsPremium(hasPremium);
        });
      } catch (error) {
        console.error("❌ Init error:", error);
        setIsPremium(false);
        setLoading(false);
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
