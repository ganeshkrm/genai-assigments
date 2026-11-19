import { motion } from "framer-motion";
import { formatTime } from "@/lib/utils/formatters";

/** UserBubble — right-aligned user query with gradient background. */
interface UserBubbleProps {
  text: string;
  timestamp: Date;
}

export function UserBubble({ text, timestamp }: UserBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="ml-auto max-w-[85%]"
    >
      <div className="rounded-xl rounded-tr-sm bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm text-white">
        {text}
        <div className="mt-1 text-right text-[10px] text-white/70">
          {formatTime(timestamp)}
        </div>
      </div>
    </motion.div>
  );
}

export default UserBubble;
