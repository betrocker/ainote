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
import { generateId } from "@/utils/uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type NewNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt" | "ai">;

export type NotesContextType = {
  notes: Note[];
  isLoading: boolean;
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

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        if (json) {
          const parsed = JSON.parse(json);
          const normalized = parsed.map((note: any) => ({
            ...note,
            isPrivate: note.isPrivate ?? false,
          }));
          setNotes(normalized);
        }
      } catch (err) {
        console.log("Error loading notes", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ⭐ KONZISTENTAN save helper
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

  // Helper za scheduliranje notifications
  const scheduleNotificationsForNote = async (note: Note) => {
    const dueFact = note.ai?.facts?.find((f) => f.predicate === "due_on");

    console.log(
      "🔔 [scheduleNotifications] Starting for:",
      note.id.slice(0, 8)
    );

    if (!dueFact?.object) {
      console.log("🔔 [scheduleNotifications] No due_on fact, exiting");
      return;
    }

    try {
      const dueNotifId = await scheduleDueDateNotification(
        note.id,
        note.title || "Note",
        dueFact.object
      );

      const reminderNotifId = await scheduleReminderNotification(
        note.id,
        note.title || "Note",
        dueFact.object
      );

      console.log("🔔 [scheduleNotifications] ✅ Success");

      return {
        dueDate: dueNotifId || undefined,
        reminder: reminderNotifId || undefined,
      };
    } catch (error) {
      console.error("🔔 [scheduleNotifications] ❌ Error:", error);
      return undefined;
    }
  };

  // Kreiraj belešku
  const addNote = useCallback(
    async (partial: Omit<Note, "id" | "createdAt">) => {
      const id = generateId();
      const now = Date.now();
      const base: Note = { id, createdAt: now, isPrivate: false, ...partial };

      // Auto-facts
      const textSrc = (base.text ?? base.content ?? "").trim();
      console.log("📝 [addNote] Text source:", textSrc.slice(0, 100));

      if (textSrc.length > 0) {
        const facts = genFactsFromText(textSrc, id);
        base.ai = { ...(base.ai ?? {}), facts };

        console.log("📝 [addNote] Generated facts:", facts.length);
      }

      const next = [base, ...notes];
      await save(next);

      // Check for due_on fact
      const hasDueDate = base.ai?.facts?.some((f) => f.predicate === "due_on");
      console.log("📝 [addNote] Has due_on fact:", hasDueDate);

      if (hasDueDate) {
        console.log("📝 [addNote] Calling scheduleNotificationsForNote...");
        const notifIds = await scheduleNotificationsForNote(base);

        if (notifIds) {
          // Update note sa notification IDs
          const updatedNotes = next.map((n) =>
            n.id === id ? { ...n, notificationIds: notifIds } : n
          );
          await save(updatedNotes);
        }
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
      return addNote({ type: "photo", title, fileUri: uri, isPrivate: false });
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

  // ⭐ ISPRAVLJENO: editNote koristi save()
  const editNote = useCallback(
    async (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => {
      console.log("📝 [editNote] Editing note:", id.slice(0, 8));

      const updatedNotes = notes.map((n) => {
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

          const hasDueDate = facts.some((f) => f.predicate === "due_on");
          console.log("📝 [editNote] Has due_on:", hasDueDate);

          if (hasDueDate) {
            // Schedule async ali ne blokiraj save
            scheduleNotificationsForNote(next)
              .then((notifIds) => {
                if (notifIds) {
                  // Update note sa notification IDs nakon schedule
                  setNotes((prev) =>
                    prev.map((n) =>
                      n.id === id ? { ...n, notificationIds: notifIds } : n
                    )
                  );
                  AsyncStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(
                      notes.map((n) =>
                        n.id === id ? { ...n, notificationIds: notifIds } : n
                      )
                    )
                  );
                }
              })
              .catch((err) =>
                console.error("📝 [editNote] Notification error:", err)
              );
          }
        }

        return next;
      });

      await save(updatedNotes);
    },
    [notes, save]
  );

  const transcribeNote = useCallback(
    async (noteId: string, audioUri: string) => {
      setTranscribingNotes((prev) => new Set(prev).add(noteId));

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

  // ⭐ ISPRAVLJENO: deleteNote koristi save()
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

  // ⭐ ISPRAVLJENO: addTagToNote koristi save()
  const addTagToNote = useCallback(
    async (noteId: string, tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();
      if (!trimmedTag) return;

      const updatedNotes = notes.map((n) => {
        if (n.id !== noteId) return n;

        const existingTags = n.tags || [];
        if (existingTags.includes(trimmedTag)) return n;

        return {
          ...n,
          tags: [...existingTags, trimmedTag],
          updatedAt: Date.now(),
        };
      });

      await save(updatedNotes);
    },
    [notes, save]
  );

  // ⭐ ISPRAVLJENO: removeTagFromNote koristi save()
  const removeTagFromNote = useCallback(
    async (noteId: string, tag: string) => {
      const updatedNotes = notes.map((n) => {
        if (n.id !== noteId) return n;

        const existingTags = n.tags || [];
        return {
          ...n,
          tags: existingTags.filter((t) => t !== tag),
          updatedAt: Date.now(),
        };
      });

      await save(updatedNotes);
    },
    [notes, save]
  );

  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    notes.forEach((note) => {
      note.tags?.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [notes]);

  // ⭐ ISPRAVLJENO: togglePinNote koristi save()
  const togglePinNote = useCallback(
    async (noteId: string) => {
      const updatedNotes = notes.map((n) => {
        if (n.id !== noteId) return n;

        return {
          ...n,
          pinned: !n.pinned,
          updatedAt: Date.now(),
        };
      });

      await save(updatedNotes);
    },
    [notes, save]
  );

  const generateTitle = useCallback(
    async (noteId: string) => {
      console.log("🤖 [generateTitle] Called for:", noteId.slice(0, 8));

      const note = notes.find((n) => n.id === noteId);
      if (!note || !note.text) {
        console.log("🤖 [generateTitle] No text found");
        return;
      }

      setGeneratingTitles((prev) => new Set(prev).add(noteId));

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

      setGeneratingSummaries((prev) => new Set(prev).add(noteId));

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
        isLoading,
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

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes mora biti unutar NotesProvider");
  return ctx;
};
