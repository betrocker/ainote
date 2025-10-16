// context/SemanticNotesContext.tsx
import { useNotes } from "@/context/NotesContext";
import { ask as askAI } from "@/utils/ai";
import React, { createContext, useCallback, useContext, useMemo } from "react";

type AskResult = {
  answer: string;
  matches: Array<{ noteId: string; score: number; why: string[] }>;
};

type Ctx = {
  ask: (q: string) => Promise<AskResult>;
};

const SemanticNotesContext = createContext<Ctx | undefined>(undefined);

export const SemanticNotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { notes } = useNotes();

  // Uvek koristi svež snapshot beleški (učitava se čim notes promene)
  const liveNotes = useMemo(() => notes, [notes]);

  const ask = useCallback(
    async (q: string) => {
      // ovde nema nikakvog keširanja/starog indeksa – koristi se liveNotes
      const res = askAI(q, liveNotes);
      return res;
    },
    [liveNotes]
  );

  const value = useMemo(() => ({ ask }), [ask]);

  return (
    <SemanticNotesContext.Provider value={value}>
      {children}
    </SemanticNotesContext.Provider>
  );
};

export const useSemanticNotes = () => {
  const ctx = useContext(SemanticNotesContext);
  if (!ctx)
    throw new Error("useSemanticNotes mora biti unutar SemanticNotesProvider");
  return ctx;
};
