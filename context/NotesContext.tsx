// context/NotesContext.tsx
import { Fact, genFactsFromText } from "@/utils/ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

/** ===================== Tipovi ===================== */
export type Note = {
  id: string;
  type: "text" | "audio" | "photo" | "video";
  title: string;
  content?: string; // legacy/body (fallback za text)
  fileUri?: string; // za photo/video/audio fajlove
  createdAt: number;
  updatedAt?: number;
  text?: string; // canonical text sadržaj za "text" beleške
  ai?: {
    title?: string;
    summary?: string;
    tags?: string[];
    facts?: Fact[];
  };
};

export type NewNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt" | "ai">;

export type NotesContextType = {
  /** Sve beleške (najnovije prve) */
  notes: Note[];

  /** Kreiraj belešku iz parcijalnih podataka (text/photo/video/audio) */
  addNote: (note: NewNoteInput) => Promise<string>;

  /** Brzi helperi za različite izvore */
  addNoteFromText: (text: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromPhoto: (uri: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromVideo: (uri: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromAudio: (uri: string, opts?: { title?: string }) => Promise<string>;

  /** Izmeni postojeću belešku (automatski regeneriše AI facts kad menjaš text) */
  editNote: (
    id: string,
    updates: Partial<
      Pick<Note, "title" | "text" | "content" | "fileUri" | "type" | "ai">
    >
  ) => Promise<void>;

  /** Obriši jednu / sve beleške */
  deleteNote: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

/** ===================== Kontekst ===================== */
const NotesContext = createContext<NotesContextType | undefined>(undefined);

/** ===================== Provider ===================== */
export const NotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const STORAGE_KEY = "NOTES_V1";

  // učitaj pri mountu
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setNotes(JSON.parse(json));
      } catch (err) {
        console.log("Error loading notes", err);
      }
    })();
  }, []);

  // helper za upis (jedino mesto koje piše u storage)
  const save = useCallback(async (next: Note[]) => {
    setNotes(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.log("Error saving notes", err);
    }
  }, []);

  // fallback ID ako nešto pođe naopako (web/test)
  const makeId = () =>
    `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

  // kreiraj belešku (vraća ID)
  const addNote = useCallback(
    async (partial: Omit<Note, "id" | "createdAt">) => {
      const id =
        (typeof uuidv4 === "function" && uuidv4()) ||
        // @ts-ignore
        (global as any).crypto?.randomUUID?.() ||
        makeId();

      const now = Date.now();
      const base: Note = { id, createdAt: now, ...partial };

      // ✅ auto-facts za svaku belešku koja ima tekst (text ili content), ne samo za type==="text"
      const textSrc = (base.text ?? base.content ?? "").trim();
      if (textSrc.length > 0) {
        const facts = genFactsFromText(textSrc, id);
        base.ai = { ...(base.ai ?? {}), facts };
      }

      const next = [base, ...notes];
      await save(next);
      return id;
    },
    [notes, save]
  );

  // helper: iz plain teksta napravi text belešku (vraća ID)
  const addNoteFromText = useCallback(
    async (text: string, opts?: { title?: string }) => {
      const safe = (text ?? "").trim();
      const title =
        (opts?.title ?? safe.split("\n")[0]?.slice(0, 80) ?? "").trim() ||
        "New note";
      return addNote({
        type: "text",
        title,
        text: safe,
      });
    },
    [addNote]
  );

  const addNoteFromPhoto = useCallback(
    async (uri: string, opts?: { title?: string }) => {
      const title = opts?.title ?? "Photo";
      return addNote({ type: "photo", title, fileUri: uri });
    },
    [addNote]
  );

  const addNoteFromVideo = useCallback(
    async (uri: string, opts?: { title?: string }) => {
      const title = opts?.title ?? "Video";
      return addNote({ type: "video", title, fileUri: uri });
    },
    [addNote]
  );

  const addNoteFromAudio = useCallback(
    async (uri: string, opts?: { title?: string }) => {
      const title = opts?.title ?? "Voice note";
      return addNote({ type: "audio", title, fileUri: uri });
    },
    [addNote]
  );

  // izmena beleške (regeneriše facts kad se menja tekst)
  const editNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      const arr = notes.map((n) => {
        if (n.id !== id) return n;
        const next: Note = { ...n, ...updates, updatedAt: Date.now() };

        const changedText = Object.prototype.hasOwnProperty.call(
          updates,
          "text"
        );
        const textSrc = (next.text ?? next.content ?? "").trim();

        // ✅ NOVO: regeneriši facts ZA SVAKU belešku kad se promeni tekst
        if (changedText) {
          if (textSrc.length > 0) {
            const facts = genFactsFromText(textSrc, id);
            next.ai = { ...(next.ai ?? {}), facts };
          } else {
            // ako je tekst obrisan – očisti facts
            if (next.ai?.facts) {
              next.ai = { ...(next.ai ?? {}), facts: [] as Fact[] };
            }
          }
        } else if (!(next.ai?.facts && next.ai.facts.length > 0) && textSrc) {
          // ako facts ne postoje a postoji tekst – inicijalno generiši
          const facts = genFactsFromText(textSrc, id);
          next.ai = { ...(next.ai ?? {}), facts };
        }

        return next;
      });

      await save(arr);
    },
    [notes, save]
  );

  // brisanje
  const deleteNote = useCallback(
    async (id: string) => {
      const filtered = notes.filter((n) => n.id !== id);
      await save(filtered);
    },
    [notes, save]
  );

  // sve obriši
  const clearAll = useCallback(async () => {
    await save([]);
  }, [save]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        addNote,
        addNoteFromText,
        addNoteFromPhoto,
        addNoteFromVideo,
        addNoteFromAudio,
        editNote,
        deleteNote,
        clearAll,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

/** ===================== Hook ===================== */
export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes mora biti unutar NotesProvider");
  return ctx;
};
