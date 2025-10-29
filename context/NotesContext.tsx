// context/NotesContext.tsx
import { Note } from "@/types/note";
import {
  extractTextFromImage,
  generateSmartTitle,
  generateSummary,
  genFactsFromText,
  transcribeAudio,
} from "@/utils/ai";
import {
  cancelAllNotificationsForNote,
  scheduleDueDateNotification,
  scheduleReminderNotification,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

export type NewNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt" | "ai">;

export type NotesContextType = {
  notes: Note[];
  addNote: (note: NewNoteInput) => Promise<string>;
  addNoteFromText: (text: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromPhoto: (uri: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromVideo: (uri: string, opts?: { title?: string }) => Promise<string>;
  addNoteFromAudio: (uri: string, opts?: { title?: string }) => Promise<string>;
  editNote: (
    id: string,
    updates: Partial<Omit<Note, "id" | "createdAt">>
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  transcribingNotes: Set<string>;
  transcribeNote: (noteId: string, audioUri: string) => Promise<void>;
  extractPhotoText: (noteId: string, photoUri: string) => Promise<void>;
  addTagToNote: (noteId: string, tag: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tag: string) => Promise<void>;
  getAllTags: () => string[];
  togglePinNote: (noteId: string) => Promise<void>;
  generateTitle: (noteId: string) => Promise<void>;
  generatingTitles: Set<string>;
  generateNoteSummary: (noteId: string) => Promise<void>;
  generatingSummaries: Set<string>;
};

/** ===================== Kontekst ===================== */
const NotesContext = createContext<NotesContextType | undefined>(undefined);

/** ===================== Provider ===================== */
export const NotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [transcribingNotes, setTranscribingNotes] = useState<Set<string>>(
    new Set()
  );
  const [generatingTitles, setGeneratingTitles] = useState<Set<string>>(
    new Set()
  );
  const [generatingSummaries, setGeneratingSummaries] = useState<Set<string>>(
    new Set()
  );

  const STORAGE_KEY = "NOTES_V1";

  // Učitaj pri mountu
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

  // Helper za upis
  const save = useCallback(async (next: Note[]) => {
    console.log("💾 [save] Called with", next.length, "notes");

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

  const makeId = () =>
    `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

  // ⭐ Helper za scheduliranje notifications
  const scheduleNotificationsForNote = async (note: Note) => {
    const dueFact = note.ai?.facts?.find((f) => f.predicate === "due_on");

    console.log(
      "🔔 [scheduleNotifications] Starting for:",
      note.id.slice(0, 8)
    );
    console.log("🔔 [scheduleNotifications] Note title:", note.title);
    console.log(
      "🔔 [scheduleNotifications] Total facts:",
      note.ai?.facts?.length
    );
    console.log("🔔 [scheduleNotifications] Due fact found:", !!dueFact);

    if (dueFact) {
      console.log("🔔 [scheduleNotifications] Due date:", dueFact.object);
    }

    if (!dueFact?.object) {
      console.log("🔔 [scheduleNotifications] No due_on fact, exiting");
      return;
    }

    try {
      console.log(
        "🔔 [scheduleNotifications] Scheduling due date notification..."
      );

      const dueNotifId = await scheduleDueDateNotification(
        note.id,
        note.title || "Note",
        dueFact.object
      );

      console.log(
        "🔔 [scheduleNotifications] Due notification ID:",
        dueNotifId?.slice(0, 8)
      );

      console.log("🔔 [scheduleNotifications] Scheduling reminder...");

      const reminderNotifId = await scheduleReminderNotification(
        note.id,
        note.title || "Note",
        dueFact.object
      );

      console.log(
        "🔔 [scheduleNotifications] Reminder ID:",
        reminderNotifId?.slice(0, 8)
      );

      // Update note sa notification IDs
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id
            ? {
                ...n,
                notificationIds: {
                  dueDate: dueNotifId || undefined,
                  reminder: reminderNotifId || undefined,
                },
              }
            : n
        )
      );

      console.log("🔔 [scheduleNotifications] ✅ Success");
    } catch (error) {
      console.error("🔔 [scheduleNotifications] ❌ Error:", error);
    }
  };

  // Kreiraj belešku
  const addNote = useCallback(
    async (partial: Omit<Note, "id" | "createdAt">) => {
      const id =
        (typeof uuidv4 === "function" && uuidv4()) ||
        (global as any).crypto?.randomUUID?.() ||
        makeId();

      const now = Date.now();
      const base: Note = { id, createdAt: now, ...partial };

      // Auto-facts
      const textSrc = (base.text ?? base.content ?? "").trim();
      console.log("📝 [addNote] Text source:", textSrc.slice(0, 100));

      if (textSrc.length > 0) {
        const facts = genFactsFromText(textSrc, id);
        base.ai = { ...(base.ai ?? {}), facts };

        console.log("📝 [addNote] Generated facts:", facts.length);
        facts.forEach((f, i) => {
          console.log(
            `📝   ${i + 1}. ${f.predicate}: ${f.object} (weight: ${f.weight})`
          );
        });
      }

      const next = [base, ...notes];
      await save(next);

      // ⭐ Check for due_on fact
      const hasDueDate = base.ai?.facts?.some((f) => f.predicate === "due_on");
      console.log("📝 [addNote] Has due_on fact:", hasDueDate);

      if (hasDueDate) {
        console.log("📝 [addNote] Calling scheduleNotificationsForNote...");
        await scheduleNotificationsForNote(base);
        console.log("📝 [addNote] Notification scheduling complete");
      } else {
        console.log("📝 [addNote] No due_on fact, skipping notifications");
      }

      return id;
    },
    [notes, save]
  );

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

  // ⭐ Izmena beleške - sa notification update
  const editNote = useCallback(async (id: string, updates: Partial<Note>) => {
    console.log("📝 [editNote] Editing note:", id.slice(0, 8));

    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((n) => {
        if (n.id !== id) return n;

        const next: Note = { ...n, ...updates, updatedAt: Date.now() };
        const changedText = Object.prototype.hasOwnProperty.call(
          updates,
          "text"
        );
        const textSrc = (next.text ?? next.content ?? "").trim();

        console.log("📝 [editNote] Text changed:", changedText);

        if (changedText && textSrc.length > 0) {
          const facts = genFactsFromText(textSrc, id);
          next.ai = { ...(next.ai ?? {}), facts };

          console.log("📝 [editNote] Regenerated facts:", facts.length);

          // ⭐ Check if has due_on fact
          const hasDueDate = facts.some((f) => f.predicate === "due_on");
          console.log("📝 [editNote] Has due_on:", hasDueDate);

          if (hasDueDate) {
            // Async - ne blokira state update
            scheduleNotificationsForNote(next).catch((err) =>
              console.error("📝 [editNote] Notification error:", err)
            );
          }
        }

        return next;
      });

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes))
        .then(() => console.log("📝 [editNote] Persisted to storage"))
        .catch((err) => console.log("📝 [editNote] Storage error:", err));

      return updatedNotes;
    });
  }, []);

  const transcribeNote = useCallback(
    async (noteId: string, audioUri: string) => {
      setTranscribingNotes((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });

      try {
        const text = await transcribeAudio(audioUri, {
          language: "sr",
          prompt: "Kratka glasovna beleška, upiši čist tekst.",
        });

        if (text?.trim()) {
          await editNote(noteId, { text });

          const note = notes.find((n) => n.id === noteId);
          if (
            note &&
            (note.title === "Voice note" || note.title === "Untitled")
          ) {
            setTimeout(() => {
              generateTitle(noteId);
            }, 500);
          }
        }
      } catch (error) {
        console.log("🔊 [transcribeNote] Error:", error);
      } finally {
        setTranscribingNotes((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
      }
    },
    [editNote, notes]
  );

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

  // ⭐ Brisanje - sa cancel notifications
  const deleteNote = useCallback(
    async (id: string) => {
      console.log("🗑️ [deleteNote] Deleting:", id.slice(0, 8));

      const noteToDelete = notes.find((n) => n.id === id);
      console.log("🗑️ [deleteNote] Note:", {
        id: noteToDelete?.id.slice(0, 8),
        title: noteToDelete?.title,
        notificationIds: noteToDelete?.notificationIds,
      });

      console.log("🗑️ [deleteNote] Calling cancelAllNotificationsForNote...");
      await cancelAllNotificationsForNote(id);
      console.log("🗑️ [deleteNote] Notifications cancelled");

      const filtered = notes.filter((n) => n.id !== id);
      await save(filtered);

      console.log("🗑️ [deleteNote] Note deleted from storage");
    },
    [notes, save]
  );

  const clearAll = useCallback(async () => {
    console.log("🗑️ [clearAll] CALLED - This will delete all notes!");
    console.trace("🗑️ [clearAll] Call stack:");
    await save([]);
  }, [save]);

  const addTagToNote = useCallback(async (noteId: string, tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;

    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((n) => {
        if (n.id !== noteId) return n;

        const existingTags = n.tags || [];
        if (existingTags.includes(trimmedTag)) return n;

        return {
          ...n,
          tags: [...existingTags, trimmedTag],
          updatedAt: Date.now(),
        };
      });

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes)).catch(
        (err) => console.log("Storage error:", err)
      );

      return updatedNotes;
    });
  }, []);

  const removeTagFromNote = useCallback(async (noteId: string, tag: string) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((n) => {
        if (n.id !== noteId) return n;

        const existingTags = n.tags || [];
        return {
          ...n,
          tags: existingTags.filter((t) => t !== tag),
          updatedAt: Date.now(),
        };
      });

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes)).catch(
        (err) => console.log("Storage error:", err)
      );

      return updatedNotes;
    });
  }, []);

  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    notes.forEach((note) => {
      note.tags?.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [notes]);

  const togglePinNote = useCallback(async (noteId: string) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((n) => {
        if (n.id !== noteId) return n;

        return {
          ...n,
          pinned: !n.pinned,
          updatedAt: Date.now(),
        };
      });

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes)).catch(
        (err) => console.log("Storage error:", err)
      );

      return updatedNotes;
    });
  }, []);

  const generateTitle = useCallback(
    async (noteId: string) => {
      console.log("🤖 [generateTitle] Called for:", noteId.slice(0, 8));

      const note = notes.find((n) => n.id === noteId);
      if (!note || !note.text) {
        console.log("🤖 [generateTitle] No text found");
        return;
      }

      setGeneratingTitles((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });

      try {
        console.log("🤖 [generateTitle] Generating title...");
        const generatedTitle = await generateSmartTitle(note.text);
        console.log("🤖 [generateTitle] Result:", generatedTitle);

        if (generatedTitle && generatedTitle !== "Untitled Note") {
          await editNote(noteId, { title: generatedTitle });
          console.log("🤖 [generateTitle] Title updated");
        }
      } catch (error) {
        console.log("🤖 [generateTitle] Error:", error);
      } finally {
        setGeneratingTitles((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
      }
    },
    [notes, editNote]
  );

  const generateNoteSummary = useCallback(
    async (noteId: string) => {
      console.log("📝 [generateNoteSummary] Called for:", noteId.slice(0, 8));

      const note = notes.find((n) => n.id === noteId);
      if (!note || !note.text) {
        console.log("📝 [generateNoteSummary] No text found");
        return;
      }

      if (note.ai?.summary) {
        console.log("📝 [generateNoteSummary] Summary already exists");
        return;
      }

      setGeneratingSummaries((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });

      try {
        console.log("📝 [generateNoteSummary] Generating summary...");
        const summary = await generateSummary(note.text);
        console.log(
          "📝 [generateNoteSummary] Result length:",
          summary?.length || 0
        );

        if (summary) {
          await editNote(noteId, {
            ai: {
              ...(note.ai || {}),
              summary,
            },
          });
          console.log("📝 [generateNoteSummary] Summary saved");
        }
      } catch (error) {
        console.log("📝 [generateNoteSummary] Error:", error);
      } finally {
        setGeneratingSummaries((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
      }
    },
    [notes, editNote]
  );

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
        extractPhotoText,
        addTagToNote,
        removeTagFromNote,
        getAllTags,
        togglePinNote,
        generateTitle,
        generatingTitles,
        generateNoteSummary,
        generatingSummaries,
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
