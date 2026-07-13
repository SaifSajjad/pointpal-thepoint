import { Heart, Lightbulb, MessageCircleMore } from "lucide-react";

const moments = [
  { icon: MessageCircleMore, label: "Conversations that linger" },
  { icon: Lightbulb, label: "Ideas with room to grow" },
  { icon: Heart, label: "A community-shaped pause" },
];

export function About() {
  return (
    <section id="about" className="section scroll-mt-24 overflow-hidden bg-terracotta text-white">
      <div className="site-container grid items-center gap-12 lg:grid-cols-[.55fr_.45fr] lg:gap-20">
        <div className="relative min-h-[480px] overflow-hidden rounded-[34px] border border-white/20 bg-sage p-7 shadow-[0_25px_60px_rgba(74,45,24,.18)] sm:p-10">
          <div className="grain absolute inset-0 opacity-25" aria-hidden="true" />
          <div className="relative flex h-full min-h-[410px] flex-col justify-between">
            <div className="flex justify-between">
              <span className="rounded-full border border-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-ivory/80">A place to pause</span>
              <svg viewBox="0 0 72 72" className="size-16 text-soft-orange" fill="none" aria-hidden="true"><path d="M36 7v12M36 53v12M7 36h12M53 36h12M15 15l9 9M48 48l9 9M57 15l-9 9M24 48l-9 9" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><circle cx="36" cy="36" r="9" stroke="#F7F2E9" strokeWidth="4" /></svg>
            </div>
            <div className="mx-auto my-8 w-full max-w-sm">
              <svg viewBox="0 0 380 230" fill="none" className="w-full" aria-label="Line drawing of two people sharing coffee" role="img">
                <path d="M47 191c12-49 41-74 88-76 43-2 70 25 75 76M180 191c12-54 44-81 95-80 40 1 64 28 67 80" stroke="#F7F2E9" strokeWidth="5" strokeLinecap="round" />
                <circle cx="130" cy="73" r="35" fill="#D99562" stroke="#F7F2E9" strokeWidth="5" /><circle cx="275" cy="69" r="35" fill="#C87548" stroke="#F7F2E9" strokeWidth="5" />
                <path d="M112 61c11-20 36-24 51-7M254 55c12-17 33-20 48-5" stroke="#4A2D18" strokeWidth="5" strokeLinecap="round" />
                <path d="M170 170h72M181 170l-8 42M231 170l8 42" stroke="#F7F2E9" strokeWidth="5" strokeLinecap="round" />
                <path d="M190 139h35v27h-20c-8 0-15-7-15-15v-12Z" fill="#F7F2E9" /><path d="M225 144h7c11 0 11 17 0 17h-7" stroke="#F7F2E9" strokeWidth="5" />
                <path d="M199 132c-8-10 8-13 1-23M213 132c-8-11 8-13 1-23" stroke="#F7F2E9" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-display text-2xl leading-tight text-ivory">Warmth is part of the menu.</p>
          </div>
        </div>

        <div>
          <p className="eyebrow text-ivory/65">About The Point</p>
          <h2 className="mt-4 font-display text-[clamp(3.2rem,5vw,5.4rem)] leading-[.94] tracking-[-.045em]">More than coffee.</h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/75">The Point’s public story is about calm, conversation, creativity and community — a corner where people and ideas can meet over something thoughtfully made.</p>
          <div className="mt-9 grid gap-3">
            {moments.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/7 p-4">
                <span className="grid size-10 place-items-center rounded-full bg-ivory text-terracotta"><Icon size={18} aria-hidden="true" /></span>
                <span className="font-semibold text-ivory">{label}</span>
              </div>
            ))}
          </div>
          <a href="#ask" className="button button-light mt-9">Find your Point <MessageCircleMore size={18} /></a>
        </div>
      </div>
    </section>
  );
}
