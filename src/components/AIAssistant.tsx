import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithAssistant } from "@/lib/ai.functions";
import { Bot, X, Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithAssistant);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const { reply } = await chat({ data: { message: msg, history: messages.slice(-10) } });
      setMessages((m) => [...m, { role: "assistant", content: reply || "(no response)" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ " + (e instanceof Error ? e.message : "Failed") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-foreground text-background shadow-lg grid place-items-center hover:scale-105 transition"
          aria-label="Open FusionPro AI"
        >
          <Bot className="h-5 w-5" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(580px,calc(100vh-2rem))] rounded-xl border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-foreground text-background">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="font-medium text-sm">FusionPro AI</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-muted-foreground text-xs leading-relaxed">
                Hi — I&apos;m FusionPro AI. I answer using your system data only. Try:
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>What&apos;s the status of my projects?</li>
                  <li>Summarise the last quotation.</li>
                  <li>Which projects are delayed?</li>
                </ul>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap rounded-lg px-3 py-2 ${
                  m.role === "user" ? "bg-foreground text-background ml-8" : "bg-accent mr-8"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-muted-foreground text-xs flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="border-t p-2 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask…"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-md bg-foreground text-background px-3 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
