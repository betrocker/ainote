import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure"; // mali id generator
import React, { createContext, useContext, useEffect, useState } from "react";

export type Note = {
  id: string;
  type: "text" | "audio" | "photo" | "video";
  title: string;
  content?: string;
  fileUri?: string;
  createdAt: number;
};

type NotesContextType = {
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt">) => Promise<void>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  // ključ u AsyncStorage
  const STORAGE_KEY = "NOTES_V1";

  // učitaj pri mountu
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          setNotes(JSON.parse(json));
        }
      } catch (err) {
        console.log("Error loading notes", err);
      }
    })();
  }, []);

  // helper za snimanje
  const save = async (newNotes: Note[]) => {
    setNotes(newNotes);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
    } catch (err) {
      console.log("Error saving notes", err);
    }
  };

  const addNote = async (note: Omit<Note, "id" | "createdAt">) => {
    const newNote: Note = {
      ...note,
      id: nanoid(),
      createdAt: Date.now(),
    };
    await save([newNote, ...notes]);
  };

  const editNote = async (id: string, updates: Partial<Note>) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, ...updates } : n));
    await save(updated);
  };

  const deleteNote = async (id: string) => {
    const filtered = notes.filter((n) => n.id !== id);
    await save(filtered);
  };

  const clearAll = async () => {
    await save([]);
  };

  return (
    <NotesContext.Provider
      value={{ notes, addNote, editNote, deleteNote, clearAll }}
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
