import { ExternalLink, Phone } from "lucide-react";

import { BUSINESS } from "@/data/business";

export function Navigation() {
  return (
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
          <a href={BUSINESS.menu} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-light px-4 text-xs font-bold text-coffee hover:bg-white">
            View menu <ExternalLink size={13} />
          </a>
        </div>
      </nav>
    </header>
  );
}
