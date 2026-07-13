"use client";

import { ArrowRight, Coffee, Cookie, Search, Snowflake, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { PRICE_NOTE } from "@/data/business";
import { MENU, MENU_CATEGORIES } from "@/data/menu";
import { normalize } from "@/lib/pointpal";
import type { MenuItem } from "@/lib/types";

const icons = { hot: Coffee, cold: Snowflake, frappe: Sparkles, dessert: Cookie };

function matchesCategory(item: MenuItem, category: string): boolean {
  if (category === "all") return true;
  if (category === "hot") return item.tags.includes("coffee") && item.tags.includes("hot");
  if (category === "cold") return item.tags.includes("coffee") && item.tags.includes("cold") && !item.tags.includes("frappe");
  if (category === "frappe") return ["frappe", "matcha", "tea", "fizz", "smoothie"].some((tag) => item.tags.includes(tag));
  return ["food", "dessert"].some((tag) => item.tags.includes(tag));
}

function askPointPal(question: string) {
  window.dispatchEvent(new CustomEvent("pointpal:ask", { detail: question }));
  document.querySelector("#ask")?.scrollIntoView({ behavior: "smooth" });
}

export function MenuDiscovery() {
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const query = normalize(search);
    return MENU.filter((item) => {
      const haystack = normalize([item.name, item.category, item.description, ...item.tags].join(" "));
      return matchesCategory(item, active) && (!query || haystack.includes(query));
    });
  }, [active, search]);
  const visible = expanded || search ? filtered : filtered.slice(0, 8);

  return (
    <section id="menu" className="section scroll-mt-24 bg-ivory">
      <div className="site-container">
        <div className="grid items-end gap-5 lg:grid-cols-[1fr_.7fr]">
          <div>
            <p className="eyebrow text-sage">The public menu, made easier</p>
            <h2 className="section-title mt-3">Warm. Cozy. Crafted.</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-coffee/62 lg:justify-self-end">Browse 75 verified listings, then ask PointPal to narrow things down by mood, category or budget.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENU_CATEGORIES.map((category, index) => {
            const Icon = icons[category.id];
            const selected = active === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => { setActive(selected ? "all" : category.id); setExpanded(false); }}
                aria-pressed={selected}
                className={`category-card group relative min-h-[245px] overflow-hidden rounded-[26px] p-6 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta/30 ${selected ? "bg-terracotta text-white shadow-xl" : index % 2 ? "bg-soft-orange text-coffee" : "bg-sage text-white"}`}
              >
                <div className="grain absolute inset-0 opacity-20" aria-hidden="true" />
                <div className="relative flex h-full flex-col">
                  <Icon size={34} strokeWidth={1.5} aria-hidden="true" />
                  <p className="mt-auto text-[10px] font-bold uppercase tracking-[.18em] opacity-65">{category.eyebrow}</p>
                  <h3 className="mt-2 font-display text-3xl leading-none">{category.title}</h3>
                  <p className="mt-3 text-xs leading-5 opacity-75">{category.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold">{selected ? "Showing items" : "Explore category"} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-terracotta">Menu finder</p>
            <h3 className="mt-2 font-display text-3xl text-coffee sm:text-4xl">Find your next favourite</h3>
          </div>
          <label className="flex w-full max-w-md items-center gap-3 rounded-full border border-coffee/15 bg-light px-5 py-3 shadow-sm focus-within:border-sage focus-within:ring-4 focus-within:ring-sage/10">
            <Search size={18} className="text-sage" aria-hidden="true" />
            <span className="sr-only">Search menu</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coffee, dessert, matcha…" className="min-w-0 flex-1 bg-transparent text-base text-coffee outline-none placeholder:text-coffee/38" />
          </label>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          {visible.map((item) => (
            <article key={item.name} className="menu-card flex min-h-[270px] flex-col rounded-[24px] border border-coffee/10 bg-light p-5 shadow-[0_10px_30px_rgba(74,45,24,.06)]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-sage">{item.category}</p>
                {item.popular && <span className="rounded-full bg-orange/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-coffee">Popular</span>}
              </div>
              <h4 className="mt-4 font-display text-[1.55rem] leading-tight text-coffee">{item.name}</h4>
              <p className="mt-3 text-sm leading-6 text-coffee/58">{item.description}</p>
              <div className="mt-auto pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-xl text-terracotta">Rs. {item.price.toLocaleString("en-PK")}</span>
                  <button type="button" onClick={() => askPointPal(`What is the price of ${item.name}?`)} className="text-xs font-bold text-sage underline decoration-sage/25 underline-offset-4 hover:decoration-sage">Ask about this</button>
                </div>
                <p className="mt-3 border-t border-coffee/8 pt-3 text-[10px] leading-4 text-coffee/42">{PRICE_NOTE}</p>
              </div>
            </article>
          ))}
        </div>

        {!visible.length && <div className="mt-7 rounded-3xl border border-dashed border-coffee/20 bg-light p-10 text-center text-coffee/60">No verified menu items match that search. Try a broader word or ask PointPal.</div>}

        {!search && filtered.length > 8 && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setExpanded((value) => !value)} className="button button-dark">{expanded ? "Show less" : `View all ${filtered.length} items`}</button>
          </div>
        )}
      </div>
    </section>
  );
}
