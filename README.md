# PointPal — The Point’s smart café concierge

PointPal is a fellowship prototype for **The Point × QD Fellowship — Innovation & AI Track**. It helps visitors explore The Point Café’s public menu, compare listed prices, get budget-aware recommendations, and find practical visit information in natural English or Roman Urdu.

When a server-side OpenAI key is available, the Responses API is the conversational brain for every valid message and calls narrow read-only tools whenever verified café data is needed. Menu filtering, prices, and business facts remain deterministic inside those tools. With no key—or if OpenAI is unavailable—the same local data powers a graceful fallback.

> Fellowship prototype · Information sourced from The Point's public channels.

## Live demo

**Public app:** <https://pointpal-thepoint.vercel.app>

## Features

- OpenAI-first conversation for greetings, clarifying questions, English, Roman Urdu, and common misspellings
- 75 structured menu records with verified list prices and source caveats
- Exact item lookup and grounded recommendations by category, temperature, budget, and preferences
- Multi-turn follow-ups using the most recent 12 session messages
- Verified hours, address, phone, Instagram, website, and delivery information
- Transparent handling of conflicting published hours
- Conservative allergy guidance and graceful handling of unknown facts
- Focused responsive chat with four suggestion chips, multiline input, clear, retry, autoscroll, and keyboard controls
- Strict input validation, timeouts, no-store responses, and basic per-client abuse protection
- Fully functional core flows without an API key

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4
- Next.js Route Handler at `app/api/chat/route.ts`
- Official OpenAI JavaScript SDK and Responses API
- Zod validation
- Vitest
- Vercel

## Architecture

```text
Browser UI
  ├─ focused React chat and session-only conversation state
  └─ POST /api/chat
       ├─ Zod request validation + rate protection
       ├─ OpenAI Responses API for every valid message when configured
       │    ├─ natural-language and follow-up understanding
       │    ├─ allow-listed function calls (maximum three rounds)
       │    └─ one unified customer-facing answer
       ├─ validated read-only local tools
       │    ├─ search_menu / get_menu_item / recommend_menu
       │    ├─ get_business_info / get_help_capabilities
       │    └─ verified menu and business facts
       └─ missing key, timeout, rate limit, or error → deterministic fallback
```

OpenAI is imported only in server code. `OPENAI_API_KEY` is read only through `process.env.OPENAI_API_KEY`; there is no `NEXT_PUBLIC_` key and no secret is sent to the browser. Tool names and arguments are allow-listed and schema-validated before local execution. Tool output returns to the model through the Responses API function-call output format.

Conversation history is held only in the active browser component. Each request sends at most the latest 12 messages; Clear chat resets the UI history and deterministic preference context. The server does not persist conversations or mix sessions.

## Local setup

Requirements: Node.js 22 LTS and npm.

```bash
git clone https://github.com/SaifSajjad/pointpal-thepoint.git
cd pointpal-thepoint
npm install
cp .env.example .env.local   # optional; core flows work without it
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
2. Add `OPENAI_API_KEY` for Production, Preview, and Development as needed.
3. Optionally add `OPENAI_MODEL`.
4. Redeploy the latest production deployment.

API failures, timeouts, and upstream rate limits automatically use a deterministic fallback without exposing internal errors.

## Verified data sources

1. [Official website](https://www.thepoint.cafe/)
2. [Official menu page](https://www.thepoint.cafe/menu)
3. [Official Instagram](https://www.instagram.com/thepointlhr/)
4. [Foodpanda listing](https://www.foodpanda.pk/restaurant/vb7p/the-point-vb7p)

Menu list prices were checked on **13 July 2026**. Menu answers disclose: **“Listed price · may change or differ in-store.”**

The homepage/footer lists `8:00 AM–1:00 AM`, while the Phase 6 location page lists `9:00 AM–12:00 AM`. PointPal does not silently select one schedule and advises calling to confirm.

## Tests and safety

The mocked agent and deterministic regression suites cover greetings, casual and general coffee questions, Roman Urdu, budget/category filters, multi-turn context, menu and business tools, exact prices, conflicting hours, allergy caution, prompt injection, missing keys, timeouts, rate limits, malformed and unknown tools, empty output, loop limits, request validation, and abuse protection. Tests never spend API credits.

## Project structure

```text
app/
  api/chat/route.ts      # server-only chat route
  globals.css            # Tailwind theme and brand styling
  layout.tsx
  page.tsx
components/
  ChatPanel.tsx          # focused session-only chat
  Navigation.tsx
  Footer.tsx
data/
  business.ts            # verified business facts and source URLs
  menu.ts                # structured 75-item menu
lib/
  openai.ts              # OpenAI-first tool loop and safety checks
  agent-tools.ts         # validated, allow-listed local tools
  pointpal.ts            # deterministic fallback and filtering
  types.ts
tests/
```

## Future improvements

- Café-managed source refresh workflow with change review
- Richer verified dietary and sweetness metadata supplied by The Point
- Opt-in analytics for unanswered intents without storing conversation content
- Urdu-script interface
- Official photography and logo assets with production approval
