// context/ThemeContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme; // trenutno aktivna tema
  setTheme: (t: Theme) => void; // eksplicitno postavljanje
  toggle: () => void; // brzi prekidač
  ready: boolean; // true kada je tema učitana iz storage-a
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
  ready: false,
});

const STORAGE_KEY = "@theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // NativeWind-ov kontrolisani scheme
  const { colorScheme, setColorScheme } = useColorScheme();
  const [ready, setReady] = useState(false);

  // Uvek držimo state kao "light" | "dark" (bez "system")
  const [theme, setThemeState] = useState<Theme>(
    (colorScheme as Theme) || "light" // početni hint iz sistema
  );

  // Učitavanje i migracija iz AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") {
          setThemeState(saved);
          setColorScheme(saved);
        } else if (saved === "system") {
          // migracija sa starog "system" → mapiraj na trenutno colorScheme
          const mapped: Theme = (colorScheme as Theme) || "light";
          setThemeState(mapped);
          setColorScheme(mapped);
          await AsyncStorage.setItem(STORAGE_KEY, mapped);
        } else {
          // nema snimljene vrednosti → koristi trenutni colorScheme i snimi
          const initial: Theme = (colorScheme as Theme) || "light";
          setThemeState(initial);
          setColorScheme(initial);
          await AsyncStorage.setItem(STORAGE_KEY, initial);
        }
      } catch {
        // fallback bez storage-a
        const fallback: Theme = (colorScheme as Theme) || "light";
        setThemeState(fallback);
        setColorScheme(fallback);
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // namerno samo na mount

  // API
  const setTheme = async (t: Theme) => {
    setThemeState(t);
    setColorScheme(t); // obavesti NativeWind
    try {
      await AsyncStorage.setItem(STORAGE_KEY, t);
    } catch {}
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggle,
      ready,
    }),
    [theme, ready]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
