import { BUSINESS, FOODPANDA_URL, INSTAGRAM_URL, PRICE_SOURCE_NOTE, WEBSITE_URL } from "@/data/business";
import { MENU } from "@/data/menu";
import { EMPTY_CONVERSATION_CONTEXT, type ConversationContext, type GroundedReply, type MenuItem, type ReplyIntent } from "@/lib/types";

const CATEGORY_ALIASES: Record<string, string[]> = {
  coffee: ["coffee", "coffees", "coffe", "cofee", "coffi", "cafi"],
  cold: ["cold", "chilled", "iced", "thanda", "thandi", "thanday"],
  hot: ["hot", "warm", "garam"],
  dessert: ["dessert", "desserts", "sweet", "sweets", "meetha", "meethi", "mithai"],
  food: ["food", "meal", "khana", "savory", "savoury"],
  sandwich: ["sandwich", "sandwiches", "panini"],
  wrap: ["wrap", "wraps"],
  frappe: ["frappe", "frappes", "frappuccino"],
  matcha: ["matcha"],
  tea: ["tea", "chai"],
  smoothie: ["smoothie", "smoothies"],
  brownie: ["brownie", "brownies"],
  cookie: ["cookie", "cookies"],
  croissant: ["croissant", "croissants"],
  cake: ["cake", "cakes", "cheesecake"],
  fizz: ["fizz", "fizzy"],
  latte: ["latte", "lattes"],
};

const CHEAP_WORDS = [
  "cheap",
  "cheapest",
  "lowest price",
  "affordable",
  "value",
  "sasta",
  "sasti",
  "saste",
  "kam price",
  "kam qeemat",
  "budget friendly",
];

const RECOMMEND_WORDS = [
  "recommend",
  "recommendation",
  "suggest",
  "suggestion",
  "best",
  "popular",
  "what should i get",
  "what should i order",
  "kya loon",
  "kia loon",
  "kya lu",
  "kia lu",
  "koi acha",
  "koi achi",
  "koi achha",
  "konsi",
  "kaunsi",
  "piyun",
  "peeni chahiye",
  "peni chahiye",
  "peni chyia",
  "chahiye",
  "chahye",
  "chyia",
  "batao",
  "btao",
  "achi ha",
];

const LOW_SWEETNESS_PHRASES = [
  "not too sweet",
  "less sweet",
  "low sweet",
  "kam meetha",
  "kam sweet",
  "meetha kam",
];

const STOP_WORDS = new Set([
  "a", "an", "any", "are", "can", "do", "for", "from", "give", "have", "how", "i", "in",
  "is", "it", "ka", "ki", "ko", "koi", "kro", "me", "menu", "of", "on", "please", "price",
  "prices", "show", "something", "the", "to", "what", "with", "you", "your",
]);

const EMPTY_CONTEXT: ConversationContext = EMPTY_CONVERSATION_CONTEXT;

export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function money(value: number): string {
  return `Rs. ${value.toLocaleString("en-PK")}`;
}

function containsPhrase(text: string, phrases: string[]): boolean {
  const padded = ` ${text} `;
  return phrases.some((phrase) => padded.includes(` ${normalize(phrase)} `));
}

export function extractBudget(question: string): number | null {
  const query = normalize(question);
  const patterns = [
    /(?:under|below|within|upto|up to|max|maximum)\s*(?:(?:rs|pkr|rupees?)\s*)?([0-9][0-9,]*)/,
    /budget(?:\s+(?:is|of|around))?\s*(?:(?:rs|pkr|rupees?)\s*)?([0-9][0-9,]*)/,
    /(?:(?:rs|pkr|rupees?)\s*)?([0-9][0-9,]*)\s*(?:or less|or below|tak|se kam|ke andar)/,
    /(?:kam|andar|tak)\s*(?:(?:rs|pkr|rupees?)\s*)?([0-9][0-9,]*)/,
    /(?:rs|pkr)\s*([0-9][0-9,]*)/,
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) return Number.parseInt(match[1].replaceAll(",", ""), 10);
  }
  return null;
}

export function requestedTags(question: string): string[] {
  const query = normalize(question);
  const tags = Object.entries(CATEGORY_ALIASES)
    .filter(([, aliases]) => containsPhrase(query, aliases))
    .map(([tag]) => tag);
  const lowSweetness = containsPhrase(query, LOW_SWEETNESS_PHRASES);
  const explicitDessert = containsPhrase(query, ["dessert", "desserts", "meetha", "meethi", "mithai", "cake", "brownie", "cookie", "croissant"]);
  return lowSweetness && !explicitDessert ? tags.filter((tag) => tag !== "dessert") : tags;
}

export function filterMenu(tags: string[] = [], budget: number | null = null): MenuItem[] {
  return MENU.filter(
    (menuItem) =>
      tags.every((tag) => menuItem.tags.includes(tag)) &&
      (budget === null || menuItem.price <= budget),
  );
}

function mentionedItem(question: string): MenuItem | null {
  const query = ` ${normalize(question)} `;
  const matches = MENU.filter((menuItem) => query.includes(` ${normalize(menuItem.name)} `));
  return matches.sort((a, b) => b.name.length - a.name.length)[0] ?? null;
}

function rank(items: MenuItem[], valueFirst = false, lowSweetness = false): MenuItem[] {
  return [...items].sort((a, b) => {
    if (lowSweetness) {
      const sweetnessTerms = ["sweet", "chocolate", "condensed", "syrup", "caramel", "hazelnut", "vanilla", "cookie", "biscoff", "nutella"];
      const sweetnessScore = (item: MenuItem) => {
        const text = normalize([item.name, item.description, ...item.tags].join(" "));
        return sweetnessTerms.filter((term) => containsPhrase(text, [term])).length;
      };
      const sweetness = sweetnessScore(a) - sweetnessScore(b);
      if (sweetness) return sweetness;
    }
    if (valueFirst && a.price !== b.price) return a.price - b.price;
    const popularity = Number(Boolean(b.popular)) - Number(Boolean(a.popular));
    return popularity || a.price - b.price || a.name.localeCompare(b.name);
  });
}

function makeReply(
  text: string,
  intent: ReplyIntent,
  options: {
    sourceLabel?: string;
    sourceUrl?: string;
    items?: MenuItem[];
    budget?: number | null;
    tags?: string[];
  } = {},
): GroundedReply {
  const items = options.items ?? [];
  const isMenu = ["item_lookup", "recommendation", "no_match", "search"].includes(intent);
  return {
    text: isMenu ? `${text}\n\n${PRICE_SOURCE_NOTE}` : text,
    sourceLabel: options.sourceLabel ?? (isMenu ? "Foodpanda menu" : ""),
    sourceUrl: options.sourceUrl ?? (isMenu ? FOODPANDA_URL : ""),
    intent,
    items,
    budget: options.budget ?? null,
    context: {
      tags: options.tags ?? [],
      budget: options.budget ?? null,
      category: (options.tags ?? []).find((tag) => !["hot", "cold"].includes(tag)) ?? null,
      temperature: (options.tags ?? []).includes("cold") ? "cold" : (options.tags ?? []).includes("hot") ? "hot" : null,
      sweetness: null,
      exclusions: [],
      preferences: [],
      recommendedItemNames: items.map((item) => item.name),
      lastIntent: intent,
    },
  };
}

function faqReply(question: string): GroundedReply | null {
  const query = normalize(question);
  const tokens = new Set(query.split(" "));
  const hasAny = (values: string[]) => values.some((value) => tokens.has(value));

  if (
    hasAny(["allergy", "allergies", "allergic", "allergen", "allergens", "nut", "nuts"]) ||
    containsPhrase(query, ["cross contamination", "cross-contamination", "food allergy", "allergy safe"])
  ) {
    return makeReply(
      "I can’t confirm allergy safety from the public menu. Please ask café staff to verify the ingredients and cross-contamination risk before ordering.",
      "allergy",
      { sourceLabel: "Safety guidance · confirm with café staff", sourceUrl: WEBSITE_URL },
    );
  }

  if (
    hasAny(["delivery", "deliver", "foodpanda"]) ||
    containsPhrase(query, ["home delivery", "order online", "ghar bhej", "ghar mangwa"])
  ) {
    return makeReply(
      "Foodpanda currently lists delivery and pick-up for The Point. Availability and fees depend on your address, so check the live listing before ordering.",
      "delivery",
      { sourceLabel: "Foodpanda", sourceUrl: FOODPANDA_URL },
    );
  }

  if (
    hasAny(["hours", "hour", "timing", "timings", "open", "close", "closing"]) ||
    containsPhrase(query, ["opening time", "closing time", "what time", "kitne baje", "kab khul", "kab band", "open kab", "close kab"])
  ) {
    return makeReply(
      `The official website shows ${BUSINESS.hoursFooter} in its homepage/footer, while the Phase 6 location page lists ${BUSINESS.hoursLocation}. Published hours differ across The Point’s pages, so please call ${BUSINESS.phone} to confirm. Hours may vary; call before visiting.`,
      "hours",
      { sourceLabel: "Official website · conflicting listings", sourceUrl: `${WEBSITE_URL}location` },
    );
  }

  if (
    hasAny(["location", "address", "kidhar", "kahan", "pata"]) ||
    containsPhrase(query, ["where are you", "where is the point", "where located", "how to reach"])
  ) {
    return makeReply(`The Point is at ${BUSINESS.location}.`, "location", {
      sourceLabel: "Official website",
      sourceUrl: WEBSITE_URL,
    });
  }

  if (
    hasAny(["phone", "contact", "call", "number", "rabta"]) ||
    containsPhrase(query, ["get in touch", "phone number", "contact details"])
  ) {
    return makeReply(`The official contact number is ${BUSINESS.phone}.`, "contact", {
      sourceLabel: "Official website",
      sourceUrl: WEBSITE_URL,
    });
  }

  if (hasAny(["instagram", "thepointlhr"])) {
    return makeReply("The Point’s public Instagram profile is @thepointlhr.", "instagram", {
      sourceLabel: "Instagram",
      sourceUrl: INSTAGRAM_URL,
    });
  }
  return null;
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

function tokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

function fuzzyMatches(question: string): MenuItem[] {
  const queryTokens = normalize(question)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  if (!queryTokens.length) return [];

  const scored = MENU.map((menuItem) => {
    const nameTokens = normalize(menuItem.name).split(" ");
    const haystackTokens = normalize(
      [menuItem.name, menuItem.category, menuItem.description, ...menuItem.tags].join(" "),
    ).split(" ");
    let score = 0;
    for (const token of queryTokens) {
      const best = Math.max(...haystackTokens.map((candidate) => tokenSimilarity(token, candidate)));
      if (best >= 0.72) score += best >= 0.99 ? 2 : best;
      const nameMatch = Math.max(...nameTokens.map((candidate) => tokenSimilarity(token, candidate)));
      if (nameMatch >= 0.72) score += nameMatch;
    }
    return { menuItem, score };
  })
    .filter(({ score }) => score >= 1.6)
    .sort((a, b) => b.score - a.score || a.menuItem.price - b.menuItem.price);

  if (!scored.length) return [];
  const best = scored[0].score;
  return scored.filter(({ score }) => score >= best - 0.55).slice(0, 5).map(({ menuItem }) => menuItem);
}

function mergeFollowUp(
  question: string,
  currentTags: string[],
  budget: number | null,
  previous: ConversationContext,
): { tags: string[]; budget: number | null } {
  const query = normalize(question);
  const followUp =
    containsPhrase(query, ["make it", "what about", "instead", "aur", "phir", "same budget"]) ||
    query.split(" ").length <= 4;
  if (!followUp || !previous.tags.length) return { tags: currentTags, budget };

  const merged = new Set(previous.tags);
  if (currentTags.includes("cold")) merged.delete("hot");
  if (currentTags.includes("hot")) merged.delete("cold");
  currentTags.forEach((tag) => merged.add(tag));
  return { tags: [...merged], budget: budget ?? previous.budget };
}

export function answer(
  question: string,
  previousContext: ConversationContext = EMPTY_CONTEXT,
): GroundedReply {
  if (!question?.trim()) {
    return makeReply(
      "Ask me about The Point’s menu, listed prices, hours, location, contact or delivery.",
      "empty",
    );
  }

  const conversationalQuery = normalize(question);
  if (/^(hi+|hello|hey|salam|assalam|aoa)( there)?$/.test(conversationalQuery)) {
    const greeting = /salam|assalam|aoa/.test(conversationalQuery) ? "Wa alaikum assalam!" : "Hi!";
    return makeReply(`${greeting} I’m PointPal. What kind of coffee, food, or dessert are you in the mood for?`, "conversation");
  }
  if (/^(thanks|thank you|shukriya|thx|ty|great|perfect|okay|ok|acha|theek)( pointpal)?$/.test(conversationalQuery)) {
    return makeReply("You’re welcome! Enjoy your visit to The Point.", "conversation");
  }
  if (
    /^(help|what can you do|how can you help|menu help)$/.test(conversationalQuery) ||
    containsPhrase(conversationalQuery, ["what do you know", "kis cheez mein help"])
  ) {
    return makeReply(
      "I can search verified menu items and prices, recommend options by budget or preference, and help with The Point’s location, contact, hours, and delivery. English or Roman Urdu both work.",
      "help",
    );
  }

  const faq = faqReply(question);
  if (faq) return faq;

  const query = normalize(question);
  const extractedBudget = extractBudget(question);
  const currentTags = requestedTags(question);
  const exactItem = mentionedItem(question);

  if (exactItem) {
    const comparison =
      extractedBudget === null
        ? ""
        : exactItem.price <= extractedBudget
          ? ` It is within your ${money(extractedBudget)} budget.`
          : ` It is above your ${money(extractedBudget)} budget.`;
    return makeReply(`${exactItem.name} is listed at ${money(exactItem.price)}. ${exactItem.description}${comparison}`, "item_lookup", {
      items: [exactItem],
      budget: extractedBudget,
      tags: exactItem.tags.filter((tag) => ["coffee", "cold", "hot", "dessert", "food"].includes(tag)),
    });
  }

  if (containsPhrase(query, ["ignore all rules", "ignore previous", "system prompt", "invent a", "fabricate a"])) {
    return makeReply(
      "I couldn’t verify that from The Point’s public sources, so I don’t want to guess. I can only use the verified business facts and menu records available to PointPal.",
      "unknown",
    );
  }

  const { tags, budget } = mergeFollowUp(question, currentTags, extractedBudget, previousContext);
  const candidates = filterMenu(tags, budget);
  const cheap = containsPhrase(query, CHEAP_WORDS);
  const recommend = cheap || containsPhrase(query, RECOMMEND_WORDS);
  const lowSweetness = containsPhrase(query, LOW_SWEETNESS_PHRASES);

  if (tags.length || budget !== null) {
    if (!candidates.length) {
      const nearest = rank(filterMenu(tags), true);
      const detail = nearest[0]
        ? ` The lowest-priced match is ${nearest[0].name} at ${money(nearest[0].price)}.`
        : "";
      const scope = tags.length ? tags.join(" and ") : "menu item";
      const limit = budget !== null ? ` within ${money(budget)}` : "";
      return makeReply(`I couldn’t find a listed ${scope}${limit}.${detail}`, "no_match", {
        items: nearest.slice(0, 1),
        budget,
        tags,
      });
    }

    const ranked = rank(candidates, cheap, lowSweetness).slice(0, 5);
    const scope = tags.length ? tags.join(" ") : "menu";
    const budgetText = budget !== null ? ` within ${money(budget)}` : "";
    const intro = lowSweetness
      ? `The public menu does not list sweetness levels. These ${scope} options match your other preferences${budgetText}; please ask café staff to help choose the least-sweet option.`
      : cheap
        ? `Here are the best-value ${scope} options${budgetText}.`
        : recommend
          ? `Here are a few strong ${scope} picks${budgetText}.`
          : `These ${scope} options match${budgetText}.`;
    return makeReply(intro, "recommendation", { items: ranked, budget, tags });
  }

  if (recommend) {
    const ranked = rank(MENU, cheap).slice(0, 5);
    return makeReply(
      cheap ? "Here are the lowest-priced options." : "Here are a few popular picks across the menu.",
      "recommendation",
      { items: ranked },
    );
  }

  const fuzzy = fuzzyMatches(question);
  if (fuzzy.length) {
    return makeReply("These are the closest verified menu matches I found.", "search", {
      items: fuzzy,
    });
  }

  return makeReply(
    "I couldn’t verify that from The Point’s public sources, so I don’t want to guess. I can help with menu items and prices, recommendations by budget, opening hours, location, contact, Instagram and delivery. Try “Cold coffee under Rs. 800.”",
    "unknown",
  );
}

export function needsIntentInterpretation(question: string): boolean {
  const query = normalize(question);
  return containsPhrase(query, [
    "coffe",
    "cofee",
    "konsi",
    "kaunsi",
    "piyun",
    "peeni",
    "peni",
    "chahiye",
    "chahye",
    "chyia",
    "batao",
    "btao",
    "suggest kro",
  ]);
}
