import { useEffect, useRef } from "react";
import { useChatStore } from "@/lib/stores/chat.store";
import { useSearchStore } from "@/lib/stores/search.store";
import { WelcomeMessage } from "./WelcomeMessage";
import { UserBubble } from "./UserBubble";
import { BotBubble } from "./BotBubble";
import { LoadingDots } from "@/components/common/LoadingDots";

/**
 * ChatMessages — scrollable thread. Shows the welcome message when empty, then
 * user/bot bubbles, and a typing indicator while a search is running.
 * Auto-scrolls to the newest message.
 */
export function ChatMessages() {
  const messages = useChatStore((s) => s.messages);
  const isSearching = useSearchStore((s) => s.isSearching);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSearching]);

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4"
      aria-live="polite"
    >
      {messages.length === 0 && <WelcomeMessage />}

      {messages.map((m) =>
        m.type === "user" ? (
          <UserBubble key={m.id} text={m.text ?? ""} timestamp={m.timestamp} />
        ) : (
          <BotBubble key={m.id}>{m.content}</BotBubble>
        )
      )}

      {isSearching && (
        <BotBubble>
          <LoadingDots />
        </BotBubble>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessages;
