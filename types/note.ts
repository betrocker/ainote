import { Fact } from "@/utils/ai";

export type Note = {
  id: string;
  type: "text" | "audio" | "photo" | "video";
  title: string;
  content?: string;
  text?: string;
  fileUri?: string;
  audioUri?: string;
  photoUri?: string;
  videoUri?: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
  pinned?: boolean;
  ai?: {
    title?: string;
    summary?: string;
    tags?: string[];
    facts?: Fact[]; // ✅ Koristi importovani Fact tip
  };
  notificationIds?: {
    dueDate?: string;
    reminder?: string;
  };
  isPrivate?: boolean;
};
