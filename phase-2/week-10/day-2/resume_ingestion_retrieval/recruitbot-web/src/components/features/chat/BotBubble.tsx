import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { formatTime } from "@/lib/utils/formatters";

/**
 * BotBubble — left-aligned bot message. Accepts children (plain text OR a
 * results component). Slides in from the left.
 */
interface BotBubbleProps {
  children: ReactNode;
  timestamp?: Date;
}

export function BotBubble({ children, timestamp }: BotBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2.5 max-w-[85%]"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
        <Bot size={14} />
      </span>
      <div className="rounded-xl rounded-tl-sm bg-bg-card px-4 py-2.5 text-sm text-text-primary">
        {children}
        {timestamp && (
          <div className="mt-1 text-[10px] text-text-muted">
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default BotBubble;
