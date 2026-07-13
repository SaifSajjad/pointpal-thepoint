import { ArrowUp, Camera } from "lucide-react";

import { BUSINESS, MENU_CHECKED, PROTOTYPE_DISCLOSURE } from "@/data/business";

export function Footer() {
  return (
    <footer className="bg-deep-sage py-12 text-ivory">
      <div className="site-container">
        <div className="grid gap-10 border-b border-white/12 pb-10 md:grid-cols-[1fr_auto_auto]">
          <div>
            <p className="font-display text-4xl">Brew. Bond. Be.</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-ivory/58">PointPal makes The Point’s public menu and visit information easier to explore without pretending to be the café’s official app.</p>
          </div>
          <div className="text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-ivory/45">Explore</p>
            <div className="mt-4 grid gap-3"><a href="#menu">Menu</a><a href="#ask">Ask PointPal</a><a href="#location">Location</a></div>
          </div>
          <div className="text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-ivory/45">Official sources</p>
            <div className="mt-4 grid gap-3"><a href={BUSINESS.website} target="_blank" rel="noreferrer">Website</a><a href={BUSINESS.menu} target="_blank" rel="noreferrer">Menu</a><a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2"><Camera size={15} /> Instagram</a></div>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-7 text-[11px] leading-5 text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <div><p>{PROTOTYPE_DISCLOSURE}</p><p>Menu last checked {MENU_CHECKED}.</p></div>
          <a href="#home" className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 text-ivory hover:bg-white/10" aria-label="Back to top"><ArrowUp size={17} /></a>
        </div>
      </div>
    </footer>
  );
}
