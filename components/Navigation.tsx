"use client";

import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";

import { BUSINESS } from "@/data/business";

const links = [
  ["Home", "#home"],
  ["Menu", "#menu"],
  ["About", "#about"],
  ["Location", "#location"],
  ["Ask", "#ask"],
];

export function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-sage text-ivory shadow-[0_8px_30px_rgba(74,45,24,.08)]">
      <nav className="site-container flex h-[76px] items-center justify-between gap-4" aria-label="Primary navigation">
        <a href="#home" className="group flex min-w-fit items-center gap-3" aria-label="PointPal home">
          <span className="grid size-10 place-items-center rounded-full border border-ivory/70 font-display text-lg transition-transform group-hover:-rotate-6">P</span>
          <span>
            <span className="block font-display text-xl leading-none tracking-tight">PointPal</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.2em] text-ivory/70">Fellowship prototype</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="text-sm font-semibold tracking-wide text-ivory/85 transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a href={`tel:${BUSINESS.phoneHref}`} className="flex items-center gap-2 text-xs font-semibold text-ivory/80 hover:text-white">
            <Phone size={15} aria-hidden="true" />
            {BUSINESS.phone}
          </a>
          <a href="#ask" className="button button-light min-h-11 px-5">
            <MessageCircle size={17} aria-hidden="true" /> Ask PointPal
          </a>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-ivory/30 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-deep-sage px-5 pb-6 pt-3 md:hidden">
          <div className="mx-auto flex max-w-lg flex-col">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-semibold text-ivory">
                {label}
              </a>
            ))}
            <a href={`tel:${BUSINESS.phoneHref}`} className="mt-5 flex items-center justify-center gap-2 rounded-full bg-ivory px-5 py-3 font-bold text-coffee">
              <Phone size={17} aria-hidden="true" /> Call The Point
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
