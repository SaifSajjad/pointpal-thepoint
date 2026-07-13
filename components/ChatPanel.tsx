"use client";

import { Check, Clipboard, LoaderCircle, RefreshCcw, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MENU_CHECKED, PRICE_NOTE } from "@/data/business";
import type { ChatMessage, ChatResponse, ConversationContext, MenuItem } from "@/lib/types";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
};

const QUICK_PROMPTS = [
  "Best coffee under Rs. 800",
  "Something cold and not too sweet",
  "Dessert under Rs. 700",
  "Koi sasti coffee suggest kro",
  "Where are you located?",
];

const INITIAL_CONTEXT: ConversationContext = { tags: [], budget: null, lastIntent: null };
const INITIAL_MESSAGE: UiMessage = {
  id: "welcome",
  role: "assistant",
  content: "Assalam-o-alaikum — I’m PointPal. Tell me your craving, budget or vibe, and I’ll stay grounded in The Point’s public menu and business information.",
};

function itemQuestion(item: MenuItem): string {
  return `Tell me about ${item.name}`;
}

function AssistantItems({ items, onAsk }: { items: MenuItem[]; onAsk: (question: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {items.slice(0, 4).map((item) => (
        <article key={item.name} className="rounded-2xl border border-coffee/10 bg-white/75 p-3.5 shadow-[0_8px_20px_rgba(74,45,24,.05)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-sage">{item.category}</p>
              <h4 className="mt-1 font-display text-lg leading-tight text-coffee">{item.name}</h4>
            </div>
            <span className="shrink-0 rounded-full bg-terracotta px-2.5 py-1 text-xs font-bold text-white">Rs. {item.price.toLocaleString("en-PK")}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-coffee/65">{item.description}</p>
          <button type="button" onClick={() => onAsk(itemQuestion(item))} className="mt-3 text-xs font-bold text-deep-sage underline decoration-sage/30 underline-offset-4 hover:decoration-sage">
            Ask about this
          </button>
          <p className="mt-2 text-[10px] leading-4 text-coffee/48">{PRICE_NOTE}</p>
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
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const history = useMemo<ChatMessage[]>(
    () => messages.slice(-12).map(({ role, content }) => ({ role, content })),
    [messages],
  );

  const send = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || loading) return;
    setLoading(true);
    setError("");
    setInput("");
    const userMessage: UiMessage = { id: `user-${Date.now()}`, role: "user", content: message };
    setMessages((current) => [...current, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, messages: history, context }),
      });
      const payload = (await response.json()) as ChatResponse | { error?: string };
      if (!response.ok || !("text" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "PointPal could not answer just now.");
      }
      setContext(payload.context);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: [payload.aiNote, payload.text].filter(Boolean).join("\n\n"),
          response: payload,
        },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PointPal could not answer just now.");
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [context, history, loading]);

  useEffect(() => {
    const handleAsk = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail) void send(custom.detail);
    };
    window.addEventListener("pointpal:ask", handleAsk);
    return () => window.removeEventListener("pointpal:ask", handleAsk);
  }, [send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  function reset() {
    setMessages([INITIAL_MESSAGE]);
    setContext(INITIAL_CONTEXT);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  function retry() {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (lastUser) void send(lastUser.content);
  }

  async function copyLatest() {
    const latest = [...messages].reverse().find((message) => message.role === "assistant");
    if (!latest) return;
    await navigator.clipboard.writeText(latest.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  return (
    <section id="ask" className="relative z-20 -mt-20 scroll-mt-28 pb-20 lg:-mt-28">
      <div className="site-container">
        <div className="overflow-hidden rounded-[32px] border border-coffee/10 bg-light shadow-[0_28px_80px_rgba(74,45,24,.16)]">
          <div className="grid lg:grid-cols-[.38fr_.62fr]">
            <div className="relative overflow-hidden bg-deep-sage p-6 text-ivory sm:p-9 lg:p-11">
              <div className="grain absolute inset-0 opacity-20" aria-hidden="true" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-white/5 px-3 py-2 text-xs font-bold text-ivory/85">
                  <span className="relative flex size-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-orange" /></span>
                  PointPal is ready
                </div>
                <p className="eyebrow mt-10 text-ivory/55">Smart concierge</p>
                <h2 className="mt-3 max-w-sm font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl">What are you in the mood for?</h2>
                <p className="mt-5 max-w-sm leading-7 text-ivory/70">Tell me your craving, budget or vibe. English or Roman Urdu both work.</p>
                <div className="mt-8 flex flex-col items-start gap-2.5" aria-label="Suggested questions">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void send(prompt)} disabled={loading} className="group flex max-w-full items-center gap-2 rounded-full border border-ivory/18 bg-white/5 px-4 py-2.5 text-left text-xs font-semibold text-ivory/90 transition hover:border-ivory/50 hover:bg-white/10 disabled:opacity-50">
                      <Sparkles size={13} className="shrink-0 text-soft-orange" aria-hidden="true" />
                      <span className="truncate sm:whitespace-normal">{prompt}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-9 text-[11px] leading-5 text-ivory/48">Grounded in public business sources and {MENU_CHECKED} menu data. Unknown details are never guessed.</p>
              </div>
            </div>

            <div className="flex min-h-[630px] flex-col bg-soft-cream">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-coffee/10 px-5 py-4 sm:px-7">
                <div>
                  <p className="font-display text-xl text-coffee">Conversation</p>
                  <p className="text-[11px] font-semibold text-coffee/45">Verified answers · session-only memory</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={copyLatest} className="icon-button" aria-label="Copy latest answer" title="Copy latest answer">
                    {copied ? <Check size={17} /> : <Clipboard size={17} />}
                  </button>
                  <button type="button" onClick={retry} disabled={loading} className="icon-button" aria-label="Retry last question" title="Retry last question"><RefreshCcw size={17} /></button>
                  <button type="button" onClick={reset} className="icon-button" aria-label="Clear conversation" title="Clear conversation"><Trash2 size={17} /></button>
                </div>
              </div>

              <div ref={scrollRef} data-testid="chat-thread" className="chat-scroll flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7" aria-live="polite">
                {messages.map((message) => (
                  <div key={message.id} data-message-role={message.role} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[92%] rounded-[22px] px-4 py-3.5 sm:max-w-[82%] ${message.role === "user" ? "rounded-br-md bg-sage text-white" : "rounded-bl-md border border-coffee/10 bg-light text-coffee shadow-sm"}`}>
                      <p className="whitespace-pre-line text-sm leading-6">{message.content}</p>
                      {message.response && <AssistantItems items={message.response.items} onAsk={(question) => void send(question)} />}
                      {message.response?.sourceUrl && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-coffee/8 pt-2.5 text-[10px] font-semibold text-coffee/45">
                          <a href={message.response.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-coffee/20 underline-offset-2 hover:text-sage">Source: {message.response.sourceLabel}</a>
                          <span>{message.response.mode === "ai" ? "AI-assisted · grounded" : "Verified fallback"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-coffee/10 bg-light px-4 py-3 text-sm text-coffee/55"><LoaderCircle size={16} className="animate-spin" /> Checking verified sources…</div>
                  </div>
                )}
                {error && (
                  <div role="alert" className="rounded-2xl border border-terracotta/20 bg-terracotta/8 p-4 text-sm text-coffee">
                    <p>{error}</p>
                    <button type="button" onClick={retry} className="mt-2 inline-flex items-center gap-2 font-bold text-terracotta"><RotateCcw size={15} /> Try again</button>
                  </div>
                )}
              </div>

              <form onSubmit={submit} className="sticky bottom-0 border-t border-coffee/10 bg-light/95 p-4 backdrop-blur-sm sm:p-5">
                <label htmlFor="pointpal-input" className="sr-only">Ask PointPal</label>
                <div className="flex items-center gap-2 rounded-full border border-coffee/15 bg-white p-1.5 pl-4 shadow-[0_8px_24px_rgba(74,45,24,.07)] focus-within:border-sage focus-within:ring-4 focus-within:ring-sage/10">
                  <input ref={inputRef} id="pointpal-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={600} placeholder="Ask about coffee, prices, hours…" className="min-w-0 flex-1 bg-transparent py-2 text-base text-coffee outline-none placeholder:text-coffee/38" />
                  <button type="submit" disabled={loading || !input.trim()} className="grid size-11 shrink-0 place-items-center rounded-full bg-terracotta text-white transition hover:bg-coffee disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={18} /></button>
                </div>
                <p className="mt-2 text-center text-[10px] text-coffee/38">PointPal checks local verified data first. Please confirm allergy-critical questions with café staff.</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
