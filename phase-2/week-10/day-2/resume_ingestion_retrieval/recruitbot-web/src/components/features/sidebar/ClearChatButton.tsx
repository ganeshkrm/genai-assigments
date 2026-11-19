import { X } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat.store";

/**
 * ClearChatButton — clears the chat thread. The welcome message / suggestion
 * chips reappear automatically once the thread is empty (Phase 12/15).
 */
export function ClearChatButton() {
  const clearMessages = useChatStore((s) => s.clearMessages);

  return (
    <button
      type="button"
      onClick={clearMessages}
      aria-label="Clear chat"
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-sm text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
    >
      <X size={15} /> Clear chat
    </button>
  );
}

export default ClearChatButton;
