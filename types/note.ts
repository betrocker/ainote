// types/note.ts

export type Note = {
  id: string;
  type: "text" | "audio" | "photo" | "video";
  title?: string;
  text?: string;
  audioUri?: string;
  photoUri?: string;
  videoUri?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  pinned?: boolean;
  ai?: {
    facts?: Fact[];
    summary?: string;
  };
  // ⭐ Dodaj notification IDs
  notificationIds?: {
    dueDate?: string; // Notification ID za due date
    reminder?: string; // Notification ID za reminder (1 dan pre)
  };
};
