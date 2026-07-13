# PointPal — The Point’s smart café concierge

PointPal is a production-quality fellowship prototype for **The Point × QD Fellowship — Innovation & AI Track**. It helps visitors browse The Point Café’s public menu, check listed prices, find options by budget or category, and answer practical visit questions in English or Roman Urdu.

The application is deliberately grounded: deterministic retrieval owns every business fact, menu item, price and filter decision. When a server-side OpenAI key is available, the model adds a short conversational explanation using only the retrieved fact packet. With no key—or if the API is unavailable—the complete product still works.

> Fellowship prototype · Information sourced from The Point's public channels.

## Live demo

Deployment in progress. The final Vercel URL will be added here after production verification.

## Features

- 75 structured, verified menu records with list prices and source caveats
- Exact item-price lookup and bounded typo matching
- Budget filtering with English and Roman Urdu phrases such as `under`, `within`, `tak`, `se kam` and `ke andar`
- Composite category filters that preserve every constraint
- Multiple-turn follow-ups, including “make it cold” while retaining the prior coffee/budget context
- Grounded hours, address, phone, Instagram and delivery answers
- Transparent handling of the official hours conflict
- Conservative unknown handling—unsupported policies and amenities are never guessed
- Searchable menu, guided three-item recommender and responsive premium café interface
- Session-only client memory, clear/retry/copy actions and keyboard-accessible controls
- Server-side OpenAI Responses API enhancement with validation, timeout and failure fallback
- Request validation, input limits, no-store responses and basic per-client rate limiting
- Fully functional without an API key

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Next.js Route Handler at `app/api/chat/route.ts`
- Official OpenAI JavaScript SDK and Responses API
- Zod request validation
- Vitest regression suite
- Vercel hosting

## Architecture

```text
Browser UI
  ├─ responsive React sections and session-only conversation state
  └─ POST /api/chat
       ├─ Zod validation + rate limit
       ├─ deterministic TypeScript retrieval (source of truth)
       │    ├─ verified business facts
       │    └─ verified 75-item menu
       └─ optional OpenAI Responses API enhancement
            ├─ receives only the grounded fact packet
            ├─ cannot replace deterministic facts/cards
            └─ timeout/error/unsafe-output → deterministic fallback
```

OpenAI is imported only by server code. `OPENAI_API_KEY` is read only through `process.env.OPENAI_API_KEY`; there is no `NEXT_PUBLIC_` key and no secret is sent to the browser.

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
git clone https://github.com/SaifSajjad/pointpal-thepoint.git
cd pointpal-thepoint
npm install
cp .env.example .env.local   # optional; the app works without it
npm run dev
```

Open <http://localhost:3000>.

Quality checks:

```bash
npm test
npm run lint
npm run build
```

## Optional OpenAI setup

Local `.env.local`:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
```

`OPENAI_MODEL` is optional and server-only. Never commit `.env.local` or a real key.

For Vercel:

1. Open **Vercel Project → Settings → Environment Variables**.
2. Add `OPENAI_API_KEY` for Production, Preview and Development as needed.
3. Optionally add `OPENAI_MODEL`.
4. Redeploy the latest production deployment.

The no-key deterministic mode is intentional and complete. API failures or timeouts automatically return the same grounded fallback answer.

## Verified data sources

Source order:

1. [Official website](https://www.thepoint.cafe/)
2. [Official menu page](https://www.thepoint.cafe/menu)
3. [Official Instagram](https://www.instagram.com/thepointlhr/)
4. [Foodpanda listing](https://www.foodpanda.pk/restaurant/vb7p/the-point-vb7p)

Menu list prices were checked on **13 July 2026**. Every price surface says: **“Listed price · may change or differ in-store.”**

The official homepage/footer lists `8:00 AM–1:00 AM`, while the Phase 6 location page lists `9:00 AM–12:00 AM`. PointPal displays the homepage/footer timing in the visit section, labels the conflict in chat, and says: **“Hours may vary; call to confirm.”**

## Tests and safety policy

The suite covers:

- all eight fellowship demo prompts
- 75-item completeness and uniqueness
- exact price lookup and typo matching
- English and Roman Urdu budgets
- composite constraints and zero-budget behavior
- hours conflict, address, phone and delivery grounding
- unsupported questions and prompt injection
- multi-turn context
- absent OpenAI key and OpenAI request failure
- ungrounded model-output rejection
- API validation and abuse protection

Browser QA covers desktop and 390×844 mobile layouts, structural overflow, console errors, price caveats and the complete demo conversation.

## Project structure

```text
app/
  api/chat/route.ts      # server-only chat route
  globals.css            # Tailwind theme and brand styling
  layout.tsx
  page.tsx
components/              # reusable page and product sections
data/
  business.ts            # verified business facts and source URLs
  menu.ts                # structured 75-item menu
lib/
  openai.ts              # server-only optional enhancement
  pointpal.ts            # deterministic retrieval and filtering
  types.ts
tests/                    # behavioral, safety and route tests
```

## Preview

The interface is designed around The Point’s muted sage, warm ivory, coffee brown and terracotta visual language, with hand-drawn café illustration, responsive editorial sections, and a prominent concierge panel. Open the live demo for the current desktop and mobile experience.

## Future improvements

- café-managed source refresh workflow with change review
- richer verified dietary metadata supplied directly by The Point
- opt-in analytics for unanswered intents without storing conversation content
- bilingual Urdu-script interface
- official photography and logo assets with explicit production approval
