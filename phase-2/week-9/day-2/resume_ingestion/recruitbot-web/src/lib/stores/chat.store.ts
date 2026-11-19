import { create } from "zustand";
import type { ReactNode } from "react";
import type { Message } from "@/types/chat.types";

/**
 * Chat store (Phase 10 skeleton) — chat thread state only. Filled in Phase 12.
 */
interface ChatState {
  messages: Message[];
  addUserMessage: (text: string) => void;
  addBotMessage: (content: ReactNode) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addUserMessage: (text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), type: "user", text, timestamp: new Date() },
      ],
    })),
  addBotMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          type: "bot",
          content,
          timestamp: new Date(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
}));
