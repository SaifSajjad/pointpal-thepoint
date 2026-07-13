import { BUSINESS, PROTOTYPE_DISCLOSURE } from "@/data/business";

export function Footer() {
  return (
    <footer className="border-t border-coffee/10 bg-deep-sage py-4 text-ivory">
      <div className="site-container flex flex-col gap-2 text-[10px] leading-4 text-ivory/58 sm:flex-row sm:items-center sm:justify-between">
        <p>{PROTOTYPE_DISCLOSURE}</p>
        <p>
          {BUSINESS.location} · <a href={`tel:${BUSINESS.phoneHref}`} className="hover:text-white">{BUSINESS.phone}</a> · <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
        </p>
      </div>
    </footer>
  );
}
