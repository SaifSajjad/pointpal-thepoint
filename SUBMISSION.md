# PointPal fellowship submission pack

## Links

- **Live Streamlit demo:** Pending deployment
- **Public GitHub repository:** Pending publication

## “How I built it” — form-ready paragraph

I built **PointPal**, a lightweight FAQ and menu concierge for The Point, with Python and Streamlit. I curated verified public information from The Point’s official website, Foodpanda menu, and Instagram, then created a deterministic retrieval layer that detects intent, resolves exact menu items, extracts English and Roman Urdu budget phrases, and combines category and price filters without a paid AI API. The interface shows clickable sources, warns that prices may change, and safely declines questions the public data cannot verify. I also added automated retrieval and Streamlit chat-flow tests, responsive premium styling, and a deployment setup that runs free without API keys.

## Natural 60–90 second recording script

> Hi, I’m Saif, and this is PointPal — a smart FAQ and menu concierge I built for The Point. It runs in Streamlit with no paid API or API key. PointPal is grounded in The Point’s official website and public Foodpanda menu, so it can answer a basic question like “Where are you located?” with a visible source. It also understands real menu intent: “Best coffee under Rs. 800” applies both the coffee category and budget, while “Any desserts under Rs. 700?” searches actual listed items and prices. It understands basic Roman Urdu too, so “Koi sasti coffee suggest kro” brings the lowest-priced coffees first. For an exact item, I can ask “What is the price of Iced Spanish?” and get one precise result plus a reminder that prices may change. Unsupported questions are handled honestly instead of guessed. The result is fast, lightweight, transparent, and free to host, with a path to future Instagram or WhatsApp integration.

## Exact recording sequence

Use a fresh incognito/private window and enter these questions in this order:

1. `Where are you located?`
2. `Best coffee under Rs. 800`
3. `Any desserts under Rs. 700?`
4. `Koi sasti coffee suggest kro`
5. `What is the price of Iced Spanish?`

Keep the source chip and price-change note visible for at least one menu response.

## Full evaluator test set

- `Where are you located?`
- `What are your opening hours?`
- `Best coffee under Rs. 800`
- `Recommend something cold`
- `Any desserts under Rs. 700?`
- `Koi sasti coffee suggest kro`
- `Do you offer delivery?`
- `What is the price of Iced Spanish?`

Safety example: `Do you have Wi-Fi?` should receive a transparent unverified-information response rather than a guess.

## Google Form submission checklist

- [ ] Open the live demo in a fresh incognito/private window; confirm it loads without login
- [ ] Paste the final public Streamlit link
- [ ] Paste the final public GitHub repository link
- [ ] Paste the “How I built it” paragraph above
- [ ] Record a 60–90 second demo using the exact five-question sequence
- [ ] Confirm the recording shows the URL, source chip, Roman Urdu result, and price caveat
- [ ] Check microphone clarity and that no private tabs, notifications, tokens, or passwords are visible
- [ ] Upload the recording or paste its share link with viewer access enabled
- [ ] Confirm the project title is **PointPal — The Point’s smart FAQ and menu concierge**
- [ ] Reopen every submitted link once before pressing **Submit**

## Minimal recording steps

1. Open the final Streamlit link in an incognito/private window.
2. Start a screen recording with browser audio/microphone enabled.
3. Read the script naturally while entering the five exact questions above.
4. Stop at 60–90 seconds, trim only the silent start/end, and review once for private information.
5. Upload using the destination requested by the Google Form and enable viewer access if a share link is required.
