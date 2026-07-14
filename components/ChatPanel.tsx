"use client";

import { LoaderCircle, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EMPTY_CONVERSATION_CONTEXT, type ChatMessage, type ChatResponse, type ConversationContext, type MenuItem } from "@/lib/types";

type UiMessage = { id: string; role: "user" | "assistant"; content: string; response?: ChatResponse };

const QUICK_PROMPTS = [
  "Recommend a coffee",
  "Something cold under Rs. 800",
  "Show me desserts",
  "Where are you located?",
];
const INITIAL_CONTEXT: ConversationContext = EMPTY_CONVERSATION_CONTEXT;
const INITIAL_MESSAGE: UiMessage = {
  id: "welcome",
  role: "assistant",
  content: "Assalam-o-alaikum! I’m PointPal. Tell me what you’re craving, your budget, or your coffee mood — English or Roman Urdu both work.",
};

function AssistantItems({ items, onAsk }: { items: MenuItem[]; onAsk: (question: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.slice(0, 4).map((item) => (
        <article key={item.name} className="rounded-xl border border-coffee/10 bg-white/75 p-3 text-left transition hover:border-sage/50 hover:bg-white">
          <span className="flex items-start justify-between gap-2">
            <span className="font-display text-sm leading-5 text-coffee">{item.name}</span>
            <span className="shrink-0 rounded-full bg-terracotta px-2 py-1 text-[10px] font-bold text-white">Rs. {item.price.toLocaleString("en-PK")}</span>
          </span>
          <span className="mt-1.5 block text-[11px] leading-4 text-coffee/58">{item.description}</span>
          <button type="button" onClick={() => onAsk(`Tell me about ${item.name}`)} className="mt-2 text-[10px] font-bold text-deep-sage underline decoration-sage/30 underline-offset-4">Ask about this</button>
        </article>
      ))}
    </div>
  );
}

export function ChatPanel() {
  const [messages, setMessages] = useState<UiMessage[]>([INITIAL_MESSAGE]);
  const [context, setContext] = useState<ConversationContext>(INITIAL_CONTEXT);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const history = useMemo<ChatMessage[]>(
    () => messages.slice(-12).map(({ role, content }) => ({ role, content })),
    [messages],
  );

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const thread = threadRef.current;
    if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior });
  }, []);

  const send = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || loading) return;
    setLoading(true);
    setError("");
    setInput("");
    setMessages((current) => [...current, { id: `user-${crypto.randomUUID()}`, role: "user", content: message }]);
    requestAnimationFrame(() => scrollToLatest());

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, messages: history, context }),
      });
      const payload = (await response.json()) as ChatResponse | { error?: string };
      if (!response.ok || !("text" in payload)) throw new Error("error" in payload && payload.error ? payload.error : "PointPal could not answer just now.");
      setContext(payload.context);
      setMessages((current) => [...current, { id: `assistant-${crypto.randomUUID()}`, role: "assistant", content: payload.text, response: payload }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PointPal could not answer just now.");
    } finally {
      setLoading(false);
      window.setTimeout(() => {
        scrollToLatest();
        inputRef.current?.focus({ preventScroll: true });
      }, 60);
    }
  }, [context, history, loading, scrollToLatest]);

  useEffect(() => {
    const handleAsk = (event: Event) => {
      const question = (event as CustomEvent<string>).detail;
      if (question) void send(question);
    };
    window.addEventListener("pointpal:ask", handleAsk);
    return () => window.removeEventListener("pointpal:ask", handleAsk);
  }, [send]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollToLatest(messages.length <= 2 ? "auto" : "smooth"));
    return () => cancelAnimationFrame(frame);
  }, [messages.length, scrollToLatest]);

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void send(input); }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(input); }
  }
  function reset() {
    setMessages([INITIAL_MESSAGE]); setContext(INITIAL_CONTEXT); setInput(""); setError("");
    requestAnimationFrame(() => { scrollToLatest("auto"); inputRef.current?.focus({ preventScroll: true }); });
  }
  function retry() {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (lastUser) void send(lastUser.content);
  }

  return (
    <section id="chat" className="site-container scroll-mt-20">
      <div className="mx-auto mb-4 max-w-3xl px-1 text-center sm:mb-5">
        <p className="eyebrow text-deep-sage">Your smart café concierge</p>
        <h1 className="mt-1.5 font-display text-3xl tracking-tight text-coffee sm:text-4xl">Meet PointPal</h1>
        <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-coffee/60 sm:text-sm">Explore The Point’s verified menu, get grounded recommendations, or ask about your visit.</p>
      </div>

      <div className="mx-auto flex h-[calc(100dvh-190px)] min-h-[540px] max-h-[720px] max-w-3xl flex-col overflow-hidden rounded-[26px] border border-coffee/10 bg-soft-cream shadow-[0_24px_70px_rgba(74,45,24,.14)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-coffee/10 bg-light px-4 py-3 sm:px-5">
          <div>
            <p className="font-display text-base text-coffee">Chat with PointPal</p>
            <p className="text-[10px] font-semibold text-coffee/42">Session-only memory · verified café data</p>
          </div>
          <button type="button" onClick={reset} className="icon-button" aria-label="Clear conversation" title="Clear conversation"><Trash2 size={16} /></button>
        </div>

        <div className="shrink-0 border-b border-coffee/8 bg-light/65 px-3 py-2.5 sm:px-5">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Suggested questions">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => void send(prompt)} disabled={loading} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sage/20 bg-white px-3 py-2 text-[11px] font-bold text-deep-sage transition hover:border-sage/60 disabled:opacity-45">
                <Sparkles size={12} /> {prompt}
              </button>
            ))}
          </div>
        </div>

        <div ref={threadRef} data-testid="chat-thread" className="chat-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} data-message-role={message.role} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[84%] ${message.role === "user" ? "rounded-br-md bg-sage text-white" : "rounded-bl-md border border-coffee/10 bg-light text-coffee shadow-sm"}`}>
                <p className="whitespace-pre-line text-sm leading-6">{message.content}</p>
                {message.response && <AssistantItems items={message.response.items} onAsk={(question) => void send(question)} />}
                {message.response?.sourceUrl && (
                  <div className="mt-2.5 border-t border-coffee/8 pt-2 text-[10px] font-semibold text-coffee/45">
                    <a href={message.response.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-coffee/20 underline-offset-2 hover:text-sage">Source: {message.response.sourceLabel}</a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-coffee/10 bg-light px-4 py-3 text-sm text-coffee/55"><LoaderCircle size={15} className="animate-spin" /> PointPal is thinking…</div></div>}
          {error && <div role="alert" className="rounded-2xl border border-terracotta/20 bg-terracotta/8 p-3 text-sm text-coffee"><p>{error}</p><button type="button" onClick={retry} className="mt-2 inline-flex items-center gap-2 font-bold text-terracotta"><RotateCcw size={14} /> Try again</button></div>}
        </div>

        <form onSubmit={submit} className="shrink-0 border-t border-coffee/10 bg-light p-3 sm:p-4">
          <label htmlFor="pointpal-input" className="sr-only">Ask PointPal</label>
          <div className="flex items-end gap-2 rounded-[20px] border border-coffee/15 bg-white p-1.5 pl-4 shadow-sm focus-within:border-sage focus-within:ring-4 focus-within:ring-sage/10">
            <textarea ref={inputRef} id="pointpal-input" rows={1} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} maxLength={600} placeholder="Ask about coffee, a budget, or your visit…" className="max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-6 text-coffee outline-none placeholder:text-coffee/38" />
            <button type="submit" disabled={loading || !input.trim()} className="grid size-10 shrink-0 place-items-center rounded-full bg-terracotta text-white transition hover:bg-coffee disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={17} /></button>
          </div>
          <p className="mt-1.5 text-center text-[9px] text-coffee/38">Enter to send · Shift+Enter for a new line · confirm allergy-critical details with café staff</p>
        </form>
      </div>
    </section>
  );
}
