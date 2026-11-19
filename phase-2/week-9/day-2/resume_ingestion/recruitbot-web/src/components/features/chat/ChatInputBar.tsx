import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search.store";

/**
 * ChatInputBar — auto-resizing textarea (1 → max ~6 lines) + send button.
 * Enter submits, Shift+Enter inserts a newline. Disabled while searching.
 */
interface ChatInputBarProps {
  onSubmit: (query: string) => void;
}

const MAX_HEIGHT = 144; // ~6 lines

export function ChatInputBar({ onSubmit }: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const isSearching = useSearchStore((s) => s.isSearching);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !isSearching;

  function autosize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }

  function submit() {
    if (!canSend) return;
    onSubmit(value.trim());
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-white/[0.07] px-5 py-3 shrink-0">
      <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-bg-base px-3 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autosize();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Describe the candidate you're looking for…"
          aria-label="Search query"
          className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none max-h-[144px]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          className={
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-opacity " +
            (canSend
              ? "bg-gradient-to-r from-primary to-accent"
              : "bg-white/10 opacity-40 cursor-not-allowed")
          }
        >
          <Send size={15} />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-text-muted">
        Press Enter to search · Shift+Enter for new line
      </p>
    </div>
  );
}

export default ChatInputBar;
