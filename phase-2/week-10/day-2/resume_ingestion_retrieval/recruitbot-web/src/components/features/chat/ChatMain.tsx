import { useChatStore } from "@/lib/stores/chat.store";
import { useSearch } from "@/hooks/use-search";
import { ChatTopbar } from "./ChatTopbar";
import { ChatMessages } from "./ChatMessages";
import { SuggestionChips } from "./SuggestionChips";
import { ChatInputBar } from "./ChatInputBar";

/**
 * ChatMain — composes the chat column: topbar + thread + suggestion chips
 * (when empty) + input bar. Submits go through the real search (Phase 13).
 */
export function ChatMain() {
  const messages = useChatStore((s) => s.messages);
  const { submitQuery } = useSearch();

  return (
    <main className="flex-1 flex flex-col min-w-0 h-screen">
      <ChatTopbar />
      <ChatMessages />
      {messages.length === 0 && <SuggestionChips onSelect={submitQuery} />}
      <ChatInputBar onSubmit={submitQuery} />
    </main>
  );
}

export default ChatMain;
