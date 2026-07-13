import { ArrowDownRight, MessageCircle } from "lucide-react";

import { CafeIllustration } from "@/components/CafeIllustration";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-sage text-ivory">
      <div className="grain absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="site-container relative grid min-h-[650px] items-center gap-8 pb-28 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:pb-36 lg:pt-20">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow text-ivory/75">The Point × QD Fellowship Prototype</p>
          <h1 className="mt-6 max-w-[760px] font-display text-[clamp(3.4rem,6vw,6.8rem)] leading-[.91] tracking-[-.055em] text-ivory">
            A quiet corner for <span className="text-soft-orange">bold ideas</span> — and better coffee choices.
          </h1>
          <p className="mt-7 max-w-[650px] text-base leading-8 text-ivory/82 sm:text-lg">
            Meet PointPal, your warm and grounded guide to The Point&apos;s menu, hours, location and recommendations.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#ask" className="button button-light">
              <MessageCircle size={19} aria-hidden="true" /> Ask PointPal
            </a>
            <a href="#menu" className="button button-outline-light">
              Explore Menu <ArrowDownRight size={19} aria-hidden="true" />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-semibold uppercase tracking-[.16em] text-ivory/65">
            <span>Verified public sources</span><span className="hidden h-1 w-1 rounded-full bg-ivory/50 sm:block" />
            <span>Works without an AI key</span>
          </div>
        </div>
        <div className="relative -mb-14 lg:-mb-24">
          <CafeIllustration />
        </div>
      </div>
    </section>
  );
}
