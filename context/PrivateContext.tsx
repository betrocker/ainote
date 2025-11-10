// context/PrivateContext.tsx
import { usePremium } from "@/context/PremiumContext";
import * as LocalAuthentication from "expo-local-authentication";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, AppState } from "react-native";

interface PrivateContextType {
  isUnlocked: boolean;
  isAuthAvailable: boolean;
  isInPrivateFolder: boolean;
  authenticateUser: () => Promise<boolean>;
  lockFolder: () => void;
  setIsInPrivateFolder: (value: boolean) => void;
  checkAuthAvailability: () => Promise<void>;
}

const PrivateContext = createContext<PrivateContextType | undefined>(undefined);

const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000;

export function PrivateProvider({ children }: { children: React.ReactNode }) {
  const { isPremium } = usePremium(); // ✅ Dodaj ovo
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthAvailable, setIsAuthAvailable] = useState(false);
  const [isInPrivateFolder, setIsInPrivateFolder] = useState(false);
  const appState = useRef(AppState.currentState);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    checkAuthAvailability();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: any) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      console.log("🔒 [Private] App foregrounded - locking folder");
      lockFolder();
    } else if (nextAppState.match(/inactive|background/)) {
      console.log("🔒 [Private] App backgrounded - locking folder");
      lockFolder();
    }

    appState.current = nextAppState;
  };

  const checkAuthAvailability = async () => {
    // ✅ Ako nema premium, biometrija nije "dostupna"
    if (!isPremium) {
      setIsAuthAvailable(false);
      return;
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsAuthAvailable(compatible && enrolled);
  };

  const authenticateUser = async (): Promise<boolean> => {
    try {
      // ✅ Premium provera pre biometrije
      if (!isPremium) {
        Alert.alert(
          "Premium Feature",
          "Private folder requires Premium subscription."
        );
        return false;
      }

      if (!isAuthAvailable) {
        Alert.alert(
          "Not Available",
          "Biometric authentication is not available on this device."
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Private Folder",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        setIsUnlocked(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          console.log("⏱️ [Private] Auto-lock timeout reached");
          setIsUnlocked(false);
          setIsInPrivateFolder(false);
          timeoutRef.current = null;
        }, AUTO_LOCK_TIMEOUT) as unknown as number;

        return true;
      }

      return false;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  };

  const lockFolder = () => {
    console.log("🔒 [Private] Locking folder");
    setIsUnlocked(false);
    setIsInPrivateFolder(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ✅ Re-check auth availability kada se premium status promeni
  useEffect(() => {
    checkAuthAvailability();
  }, [isPremium]);

  return (
    <PrivateContext.Provider
      value={{
        isUnlocked,
        isAuthAvailable,
        isInPrivateFolder,
        authenticateUser,
        lockFolder,
        setIsInPrivateFolder,
        checkAuthAvailability,
      }}
    >
      {children}
    </PrivateContext.Provider>
  );
}

export const usePrivate = () => {
  const context = useContext(PrivateContext);
  if (!context) {
    throw new Error("usePrivate must be used within PrivateProvider");
  }
  return context;
};
