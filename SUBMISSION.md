# PointPal fellowship submission pack

## Links

- GitHub: <https://github.com/SaifSajjad/pointpal-thepoint>
- Live demo: <https://pointpal-thepoint.vercel.app>

## How I built it

I built PointPal as a responsive Next.js and TypeScript concierge for The Point Café. I first converted the café’s public menu and business information into a structured, testable local knowledge base, then implemented deterministic retrieval for exact prices, budget and category filtering, Roman Urdu phrases, typo matching and safe FAQ answers. That verified layer remains the source of truth. A server-side Next.js API route can optionally use OpenAI’s Responses API to make supported answers feel more natural, but the model receives only the retrieved fact packet and cannot replace the verified prices or business details. If no key is configured—or the API fails—the same complete fallback experience works automatically. The interface follows The Point’s sage, ivory, coffee-brown and terracotta visual language and is fully responsive, accessible and deployed on Vercel.

## 60–90 second recording script

“Hi, this is PointPal, my Innovation and AI Track fellowship project for The Point. I rebuilt it as a responsive Next.js application that feels like a natural extension of the café’s warm visual identity.

The main feature is this grounded concierge. I can ask where The Point is located or check its opening hours. PointPal transparently flags that the official website currently contains two different hour listings instead of guessing.

For menu discovery, I can ask for the best coffee under 800 rupees, something cold and not too sweet, or switch to Roman Urdu and ask, ‘Koi sasti coffee suggest kro.’ Every result comes from a structured 75-item public menu, respects the requested budget and category, and carries a clear price-change note.

The rest of the experience includes searchable menu cards, a guided recommendation flow and direct directions, phone and Instagram actions.

Technically, deterministic retrieval owns all facts. OpenAI is optional and server-side: it only improves the conversational explanation using retrieved context. With no key or any API error, PointPal remains fully functional and never invents prices, hours or policies.”

## Exact demo questions

1. `Where are you located?`
2. `What are your opening hours?`
3. `Best coffee under Rs. 800`
4. `Recommend something cold and not too sweet`
5. `Any desserts under Rs. 700?`
6. `Koi sasti coffee suggest kro`
7. `Do you offer delivery?`
8. `What is the price of Iced Spanish?`

Optional follow-up after question 3: `Make it cold`

## Google Form submission checklist

- [ ] Confirm your name, email and track are correct
- [ ] Project name: **PointPal — The Point’s smart FAQ and menu concierge**
- [ ] Paste the final public Vercel URL
- [ ] Paste <https://github.com/SaifSajjad/pointpal-thepoint>
- [ ] Paste the “How I built it” paragraph above
- [ ] Record the demo using the script and exact questions above
- [ ] Open the final demo in a private/incognito window and confirm no login is required
- [ ] Confirm the repository is public
- [ ] Confirm no API key or `.env.local` appears in GitHub
- [ ] Confirm the live footer shows the fellowship prototype disclosure
- [ ] Submit before the stated deadline and save the confirmation receipt
