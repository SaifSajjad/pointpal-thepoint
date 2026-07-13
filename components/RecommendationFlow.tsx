"use client";

import { ArrowRight, BadgeCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { PRICE_NOTE } from "@/data/business";
import { MENU } from "@/data/menu";
import type { MenuItem } from "@/lib/types";

const temperatureOptions = ["Any", "Hot", "Cold"];
const typeOptions = ["Coffee", "Matcha", "Tea", "Food", "Dessert"];
const sweetnessOptions = ["Low", "Balanced", "Sweet"];

function scoreItem(item: MenuItem, temperature: string, type: string, sweetness: string, budget: number): number {
  if (item.price > budget) return -1;
  let score = item.popular ? 4 : 0;
  if (temperature !== "Any" && item.tags.includes(temperature.toLowerCase())) score += 8;
  if (item.tags.includes(type.toLowerCase())) score += 10;
  if (sweetness === "Low" && !item.tags.includes("sweet") && !item.tags.includes("frappe")) score += 5;
  if (sweetness === "Sweet" && (item.tags.includes("sweet") || item.tags.includes("frappe"))) score += 5;
  if (sweetness === "Balanced") score += 2;
  score += Math.max(0, 3 - Math.floor((budget - item.price) / 300));
  return score;
}

function reasonFor(item: MenuItem, temperature: string, type: string, budget: number): string {
  const reasons = [];
  if (temperature !== "Any" && item.tags.includes(temperature.toLowerCase())) reasons.push(`${temperature.toLowerCase()} pick`);
  if (item.tags.includes(type.toLowerCase())) reasons.push(`matches your ${type.toLowerCase()} mood`);
  if (item.price <= budget) reasons.push(`inside your Rs. ${budget.toLocaleString("en-PK")} budget`);
  return reasons.slice(0, 2).join(" and ") || "a strong menu match";
}

function ChoiceRow({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-[.12em] text-coffee/48">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} aria-pressed={value === option} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${value === option ? "border-sage bg-sage text-white" : "border-coffee/12 bg-white text-coffee/68 hover:border-sage/50"}`}>
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function RecommendationFlow() {
  const [temperature, setTemperature] = useState("Cold");
  const [type, setType] = useState("Coffee");
  const [sweetness, setSweetness] = useState("Balanced");
  const [budget, setBudget] = useState(900);
  const [allergyNote, setAllergyNote] = useState("");

  const recommendations = useMemo(
    () => MENU.map((item) => ({ item, score: scoreItem(item, temperature, type, sweetness, budget) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score || a.item.price - b.item.price)
      .slice(0, 3)
      .map(({ item }) => item),
    [budget, sweetness, temperature, type],
  );

  function ask() {
    const query = `Recommend ${temperature === "Any" ? "" : temperature.toLowerCase()} ${type.toLowerCase()} under Rs. ${budget}`.replace(/\s+/g, " ");
    window.dispatchEvent(new CustomEvent("pointpal:ask", { detail: query }));
    document.querySelector("#ask")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="section bg-soft-cream">
      <div className="site-container grid gap-10 lg:grid-cols-[.42fr_.58fr] lg:gap-16">
        <div>
          <p className="eyebrow text-terracotta">Guided recommendations</p>
          <h2 className="section-title mt-3">Your mood, translated into a menu.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-coffee/60">A few quick choices create a grounded shortlist. No account, no checkout, and no invented customisations.</p>
          <div className="mt-8 rounded-[26px] bg-coffee p-6 text-ivory">
            <SlidersHorizontal size={26} className="text-soft-orange" aria-hidden="true" />
            <p className="mt-5 font-display text-2xl">Why this works</p>
            <p className="mt-3 text-sm leading-6 text-ivory/65">Every result comes from the same verified local menu used by PointPal’s chat. Your choices rank items; they never modify the source facts.</p>
          </div>
        </div>

        <div className="rounded-[30px] border border-coffee/10 bg-light p-5 shadow-[0_18px_55px_rgba(74,45,24,.08)] sm:p-8">
          <div className="grid gap-7">
            <ChoiceRow label="1 · Temperature" options={temperatureOptions} value={temperature} onChange={setTemperature} />
            <ChoiceRow label="2 · In the mood for" options={typeOptions} value={type} onChange={setType} />
            <ChoiceRow label="3 · Sweetness" options={sweetnessOptions} value={sweetness} onChange={setSweetness} />
            <div>
              <div className="flex items-center justify-between gap-4"><label htmlFor="budget" className="text-xs font-bold uppercase tracking-[.12em] text-coffee/48">4 · Maximum budget</label><output htmlFor="budget" className="font-display text-xl text-terracotta">Rs. {budget.toLocaleString("en-PK")}</output></div>
              <input id="budget" type="range" min="450" max="1500" step="50" value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-4 w-full accent-sage" />
            </div>
            <label>
              <span className="text-xs font-bold uppercase tracking-[.12em] text-coffee/48">5 · Dietary or allergy note</span>
              <input value={allergyNote} onChange={(event) => setAllergyNote(event.target.value)} maxLength={120} placeholder="Optional — we’ll remind you to confirm with staff" className="mt-3 w-full rounded-2xl border border-coffee/12 bg-white px-4 py-3 text-base text-coffee outline-none focus:border-sage focus:ring-4 focus:ring-sage/10" />
            </label>
            {allergyNote && <p className="rounded-2xl bg-orange/12 p-3 text-xs leading-5 text-coffee/68">PointPal cannot verify allergy safety or cross-contact from public menu data. Please share this note directly with café staff before ordering.</p>}
          </div>

          <div className="mt-8 border-t border-coffee/10 pt-7">
            <p className="text-xs font-bold uppercase tracking-[.13em] text-sage">Your three grounded picks</p>
            <div className="mt-4 grid gap-3">
              {recommendations.length ? recommendations.map((item, index) => (
                <article key={item.name} className="flex gap-4 rounded-2xl border border-coffee/9 bg-soft-cream p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage font-display text-white">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-display text-xl text-coffee">{item.name}</h3><span className="font-bold text-terracotta">Rs. {item.price.toLocaleString("en-PK")}</span></div>
                    <p className="mt-1 text-xs leading-5 text-coffee/56">A {reasonFor(item, temperature, type, budget)}.</p>
                    <p className="mt-1 text-[10px] text-coffee/40">{PRICE_NOTE}</p>
                  </div>
                </article>
              )) : <p className="rounded-2xl bg-soft-cream p-5 text-sm text-coffee/60">No verified match fits that budget. Try moving the slider up.</p>}
            </div>
            <button type="button" onClick={ask} className="button button-dark mt-5 w-full"><BadgeCheck size={18} /> Ask PointPal to explain <ArrowRight size={17} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
