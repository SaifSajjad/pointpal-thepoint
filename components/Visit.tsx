import { ArrowUpRight, Camera, Clock3, Globe2, MapPin, Phone } from "lucide-react";

import { BUSINESS, DIRECTIONS_URL } from "@/data/business";

export function Visit() {
  return (
    <section id="location" className="section scroll-mt-24 bg-ivory">
      <div className="site-container">
        <div className="rounded-[34px] bg-coffee p-6 text-ivory shadow-[0_28px_70px_rgba(74,45,24,.16)] sm:p-10 lg:p-14">
          <div className="grid gap-12 lg:grid-cols-[.42fr_.58fr] lg:gap-20">
            <div>
              <p className="eyebrow text-soft-orange">Visit The Point</p>
              <h2 className="mt-4 font-display text-[clamp(3.2rem,5vw,5.3rem)] leading-[.95] tracking-[-.04em]">Your next cup has a place.</h2>
              <p className="mt-6 max-w-lg leading-7 text-ivory/62">Plan your visit using the public information below. The official site currently carries two different hour listings, so a quick call is wise.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" className="button button-light">Get Directions <ArrowUpRight size={18} /></a>
                <a href={`tel:${BUSINESS.phoneHref}`} className="button button-outline-light"><Phone size={18} /> Call</a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="visit-card sm:col-span-2"><MapPin aria-hidden="true" /><div><p className="visit-label">Address</p><p>{BUSINESS.location}</p></div></div>
              <div className="visit-card"><Clock3 aria-hidden="true" /><div><p className="visit-label">Homepage hours</p><p>{BUSINESS.hoursFooter}</p><p className="mt-2 text-xs text-soft-orange">Hours may vary; call to confirm.</p></div></div>
              <a href={`tel:${BUSINESS.phoneHref}`} className="visit-card transition hover:bg-white/10"><Phone aria-hidden="true" /><div><p className="visit-label">Phone</p><p>{BUSINESS.phone}</p></div></a>
              <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="visit-card transition hover:bg-white/10"><Camera aria-hidden="true" /><div><p className="visit-label">Instagram</p><p>@thepointlhr</p></div></a>
              <a href={BUSINESS.website} target="_blank" rel="noreferrer" className="visit-card transition hover:bg-white/10"><Globe2 aria-hidden="true" /><div><p className="visit-label">Official website</p><p>thepoint.cafe</p></div></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
