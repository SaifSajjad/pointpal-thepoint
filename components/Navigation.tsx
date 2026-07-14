"use client";

import { ExternalLink, Phone, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BUSINESS, PRICE_NOTE } from "@/data/business";
import { MENU } from "@/data/menu";

function askPointPal(itemName: string) {
  window.dispatchEvent(new CustomEvent("pointpal:ask", { detail: `Tell me about ${itemName}` }));
  document.querySelector("#chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return MENU.filter((item) => !query || [item.name, item.category, ...item.tags].join(" ").toLowerCase().includes(query));
  }, [search]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchRef.current?.focus({ preventScroll: true });
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-sage/95 text-ivory shadow-sm backdrop-blur-md">
        <nav className="site-container flex h-16 items-center justify-between gap-3" aria-label="Primary navigation">
          <a href="#chat" className="flex items-center gap-2.5" aria-label="PointPal chat">
            <span className="grid size-9 place-items-center rounded-full border border-ivory/70 font-display text-base">P</span>
            <span>
              <span className="block font-display text-lg leading-none">PointPal</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.18em] text-ivory/65">by The Point</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <a href={`tel:${BUSINESS.phoneHref}`} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-ivory/80 hover:text-white sm:flex">
              <Phone size={14} /> {BUSINESS.phone}
            </a>
            <button type="button" onClick={() => setMenuOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-light px-4 text-xs font-bold text-coffee hover:bg-white" aria-haspopup="dialog">
              View menu
            </button>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-coffee/55 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="menu-title" className="flex max-h-[min(760px,92dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-[26px] border border-white/30 bg-soft-cream shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-coffee/10 bg-light px-4 py-3 sm:px-6">
              <div>
                <h2 id="menu-title" className="font-display text-xl text-coffee">The Point menu</h2>
                <p className="text-[10px] text-coffee/48">{MENU.length} verified public listings</p>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="icon-button" aria-label="Close menu"><X size={17} /></button>
            </div>
            <div className="border-b border-coffee/10 bg-light/70 px-4 py-3 sm:px-6">
              <label className="flex items-center gap-2 rounded-full border border-coffee/15 bg-white px-4 py-2 focus-within:border-sage focus-within:ring-4 focus-within:ring-sage/10">
                <Search size={15} className="text-sage" />
                <span className="sr-only">Search menu</span>
                <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coffee, dessert, matcha…" className="min-w-0 flex-1 bg-transparent text-sm text-coffee outline-none placeholder:text-coffee/38" />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((item) => (
                  <article key={item.name} className="rounded-2xl border border-coffee/10 bg-light p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[.12em] text-sage">{item.category}</p>
                        <h3 className="mt-1 font-display text-base text-coffee">{item.name}</h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-bold text-white">Rs. {item.price.toLocaleString("en-PK")}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-coffee/58">{item.description}</p>
                    <button type="button" onClick={() => { setMenuOpen(false); askPointPal(item.name); }} className="mt-3 text-xs font-bold text-deep-sage underline decoration-sage/30 underline-offset-4">Ask about this</button>
                  </article>
                ))}
              </div>
              {!filtered.length && <p className="p-8 text-center text-sm text-coffee/55">No verified menu items match that search.</p>}
            </div>
            <div className="flex flex-col gap-2 border-t border-coffee/10 bg-light px-4 py-3 text-[10px] text-coffee/48 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>{PRICE_NOTE}</span>
              <a href={BUSINESS.menu} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-deep-sage">Official menu <ExternalLink size={11} /></a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
