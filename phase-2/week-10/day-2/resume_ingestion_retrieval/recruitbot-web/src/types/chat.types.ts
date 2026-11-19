import type { ReactNode } from "react";

export type MessageType = "user" | "bot";

/**
 * A chat thread message. User messages carry plain `text`; bot messages carry
 * `content` (plain text OR a rendered results component).
 */
export interface Message {
  id: string;
  type: MessageType;
  text?: string;
  content?: ReactNode;
  timestamp: Date;
}
