// context/NotesContext.tsx
import {
  extractTextFromImage,
  Fact,
  genFactsFromText,
  transcribeAudio,
} from "@/utils/ai";
// import { extractAudioFromVideo } from "@/utils/videoAudio";
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
  addNoteFromText: (text: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromPhoto: (uri: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromVideo: (uri: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromAudio: (uri: string, opts?: { title?: string }) => Promise<string>;
  editNote: (
    id: string,
    updates: Partial<
      Pick<Note, "title" | "text" | "content" | "fileUri" | "type" | "ai">
    >
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  transcribingNotes: Set<string>;
  transcribeNote: (noteId: string, audioUri: string) => Promise<void>;
  //   transcribeVideo: (noteId: string, videoUri: string) => Promise<void>;
  extractPhotoText: (noteId: string, photoUri: string) => Promise<void>;
};

/** ===================== Kontekst ===================== */
const NotesContext = createContext<NotesContextType | undefined>(undefined);

/** ===================== Provider ===================== */
export const NotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [transcribingNotes, setTranscribingNotes] = useState<Set<string>>(
    new Set()
  );
  const STORAGE_KEY = "NOTES_V1";

  // ⭐ DEBUG: prati svaku promenu notes
  useEffect(() => {
    console.log("🔄 [NotesContext] State updated:", {
      count: notes.length,
      audioNotes: notes.filter((n) => n.type === "audio").length,
    });

    notes.forEach((n) => {
      if (n.type === "audio") {
        console.log(`  Audio note ${n.id.slice(0, 8)}:`, {
          text: n.text?.slice(0, 30) || "undefined",
          textLength: n.text?.length || 0,
        });
      }
    });
  }, [notes]);

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
    console.log("💾 [save] Called with", next.length, "notes");

    // ⭐ Ako se poziva sa praznim nizom, logiraj stack
    if (next.length === 0) {
      console.log("⚠️ [save] WARNING: Saving empty array!");
      console.trace("⚠️ [save] Call stack:");
    }

    setNotes(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      console.log("💾 [save] Success");
    } catch (err) {
      console.log("💾 [save] Error:", err);
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
  // context/NotesContext.tsx
  // context/NotesContext.tsx - KOMPLETAN NOVI editNote
  const editNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      console.log("📝 [editNote] Editing note:", id.slice(0, 8));
      console.log("📝 [editNote] Current notes count:", notes.length); // ⭐ NOVO

      // ⭐ KLJUČNA PROMENA: Koristi setNotes sa funkcijom (uvek dobija najsvežiji state)
      setNotes((prevNotes) => {
        console.log(
          "📝 [editNote] Inside setter, prev count:",
          prevNotes.length
        ); // ⭐ NOVO

        const updatedNotes = prevNotes.map((n) => {
          if (n.id !== id) return n;

          const next: Note = { ...n, ...updates, updatedAt: Date.now() };
          const changedText = Object.prototype.hasOwnProperty.call(
            updates,
            "text"
          );
          const textSrc = (next.text ?? next.content ?? "").trim();

          console.log("📝 [editNote] Updating note:", {
            id: n.id.slice(0, 8),
            oldText: n.text?.slice(0, 20),
            newText: next.text?.slice(0, 20),
          }); // ⭐ NOVO

          // Regenerate facts if text changed
          if (changedText && textSrc.length > 0) {
            const facts = genFactsFromText(textSrc, id);
            next.ai = { ...(next.ai ?? {}), facts };
            console.log("📝 [editNote] Generated", facts.length, "facts");
          }

          return next;
        });

        console.log("📝 [editNote] Returning", updatedNotes.length, "notes"); // ⭐ NOVO

        // ⭐ Async storage write (ne blokira state update)
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes))
          .then(() => console.log("📝 [editNote] Persisted to storage"))
          .catch((err) => console.log("📝 [editNote] Storage error:", err));

        return updatedNotes; // ⭐ Vraća novi state
      });
    },
    [] // ⭐ PRAZNE dependencies - koristimo funkciju u setNotes
  );

  const transcribeNote = useCallback(
    async (noteId: string, audioUri: string) => {
      // ⭐ Dodaj audioUri parametar
      console.log("🔊 [transcribeNote] Called for:", noteId.slice(0, 8));
      console.log("🔊 [transcribeNote] Audio URI:", audioUri);

      if (!audioUri) {
        console.log("🔊 [transcribeNote] No URI - skipping");
        return;
      }

      // Označi da transkripcija počinje
      setTranscribingNotes((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        console.log("🔊 [transcribeNote] Added to transcribing set");
        return next;
      });

      try {
        console.log("🔊 [transcribeNote] Calling transcribeAudio...");
        const text = await transcribeAudio(audioUri, {
          language: "sr",
          prompt: "Kratka glasovna beleška, upiši čist tekst.",
        });

        console.log("🔊 [transcribeNote] Result length:", text?.length || 0);
        console.log("🔊 [transcribeNote] Result preview:", text?.slice(0, 50));

        if (text?.trim()) {
          console.log("🔊 [transcribeNote] Updating note with text...");
          await editNote(noteId, { text });
          console.log("🔊 [transcribeNote] Update complete");
        } else {
          console.log("🔊 [transcribeNote] Empty text - skipping update");
        }
      } catch (error) {
        console.log("🔊 [transcribeNote] Error:", error);
      } finally {
        setTranscribingNotes((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          console.log("🔊 [transcribeNote] Removed from transcribing set");
          return next;
        });
      }
    },
    [editNote]
  );

  //   const transcribeVideo = useCallback(
  //     async (noteId: string, videoUri: string) => {
  //       console.log("🎬 [transcribeVideo] Called for:", noteId.slice(0, 8));

  //       if (!videoUri) {
  //         console.log("🎬 [transcribeVideo] No URI - skipping");
  //         return;
  //       }

  //       setTranscribingNotes((prev) => {
  //         const next = new Set(prev);
  //         next.add(noteId);
  //         return next;
  //       });

  //       try {
  //         // ⭐ Ekstraktuj audio iz videa
  //         console.log("🎬 [transcribeVideo] Extracting audio...");
  //         const audioUri = await extractAudioFromVideo(videoUri);
  //         console.log("🎬 [transcribeVideo] Audio extracted:", audioUri);

  //         // Sada transkribuj audio
  //         console.log("🎬 [transcribeVideo] Transcribing...");
  //         const text = await transcribeAudio(audioUri, {
  //           language: "sr",
  //           prompt: "Video zapis, upiši čist tekst sa audio zapisa.",
  //         });

  //         console.log("🎬 [transcribeVideo] Result:", text?.slice(0, 50));

  //         if (text?.trim()) {
  //           await editNote(noteId, { text });
  //           console.log("🎬 [transcribeVideo] Update complete");
  //         }
  //       } catch (error) {
  //         console.log("🎬 [transcribeVideo] Error:", error);
  //       } finally {
  //         setTranscribingNotes((prev) => {
  //           const next = new Set(prev);
  //           next.delete(noteId);
  //           return next;
  //         });
  //       }
  //     },
  //     [editNote]
  //   );

  const extractPhotoText = useCallback(
    async (noteId: string, photoUri: string) => {
      console.log("📸 [extractPhotoText] Called for:", noteId.slice(0, 8));

      if (!photoUri) return;

      setTranscribingNotes((prev) => new Set(prev).add(noteId));

      try {
        const text = await extractTextFromImage(photoUri);

        if (text?.trim()) {
          await editNote(noteId, { text });
          console.log("📸 [extractPhotoText] OCR complete");
        } else {
          console.log("📸 [extractPhotoText] No text found in image");
        }
      } catch (error) {
        console.log("📸 [extractPhotoText] Error:", error);
      } finally {
        setTranscribingNotes((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
      }
    },
    [editNote]
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
    console.log("🗑️ [clearAll] CALLED - This will delete all notes!"); // ⭐
    console.trace("🗑️ [clearAll] Call stack:"); // ⭐ Vidi KO poziva
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
        transcribingNotes,
        transcribeNote,
        // transcribeVideo,
        extractPhotoText,
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
