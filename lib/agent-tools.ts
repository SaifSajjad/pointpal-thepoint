import { z } from "zod";

import { BUSINESS, FOODPANDA_URL, INSTAGRAM_URL, WEBSITE_URL } from "@/data/business";
import { MENU } from "@/data/menu";
import { normalize } from "@/lib/pointpal";
import {
  EMPTY_CONVERSATION_CONTEXT,
  type ConversationContext,
  type MenuItem,
  type ReplyIntent,
} from "@/lib/types";

const categoryValues = [
  "any", "coffee", "dessert", "food", "tea", "matcha", "frappe", "sandwich",
  "wrap", "cake", "cold_drink",
] as const;
const temperatureValues = ["any", "hot", "cold"] as const;
const sweetnessValues = ["unknown", "low", "balanced", "sweet"] as const;

const commonShape = {
  category: z.enum(categoryValues).nullable(),
  temperature: z.enum(temperatureValues),
  max_budget: z.number().int().min(0).max(100_000).nullable(),
  min_budget: z.number().int().min(0).max(100_000).nullable(),
  sweetness: z.enum(sweetnessValues),
  exclude_terms: z.array(z.string().trim().min(1).max(40)).max(8),
  limit: z.number().int().min(1).max(5),
};

const schemas = {
  search_menu: z.object({ query: z.string().trim().max(80).nullable(), ...commonShape }).strict(),
  get_menu_item: z.object({ item_name: z.string().trim().min(1).max(80) }).strict(),
  recommend_menu: z.object({
    ...commonShape,
    preferences: z.array(z.string().trim().min(1).max(50)).max(8),
    previous_item_names: z.array(z.string().trim().min(1).max(80)).max(8),
    candidate_scope: z.enum(["menu", "previous_recommendations"]),
    sort: z.enum(["recommended", "price_asc"]),
  }).strict(),
  get_business_info: z.object({
    topic: z.enum(["hours", "location", "phone", "instagram", "website", "delivery", "events", "general"]),
  }).strict(),
  get_help_capabilities: z.object({}).strict(),
};

type ToolName = keyof typeof schemas;
type ToolMeta = {
  items: MenuItem[];
  sourceLabel: string;
  sourceUrl: string;
  intent: ReplyIntent;
  context: ConversationContext;
};
export type ToolExecution = ToolMeta & { output: string };

const strictObject = (properties: Record<string, unknown>, required: string[]) => ({
  type: "object", properties, required, additionalProperties: false,
});
const commonProperties = {
  category: { type: ["string", "null"], enum: [...categoryValues, null] },
  temperature: { type: "string", enum: temperatureValues },
  max_budget: { type: ["integer", "null"], minimum: 0, maximum: 100000 },
  min_budget: { type: ["integer", "null"], minimum: 0, maximum: 100000 },
  sweetness: { type: "string", enum: sweetnessValues },
  exclude_terms: { type: "array", items: { type: "string" }, maxItems: 8 },
  limit: { type: "integer", minimum: 1, maximum: 5 },
};

export const POINTPAL_TOOLS = [
  {
    type: "function" as const,
    name: "search_menu",
    description: "Search verified menu records by words and structured filters. Use for menu discovery and prices.",
    strict: true,
    parameters: strictObject({ query: { type: ["string", "null"] }, ...commonProperties }, ["query", ...Object.keys(commonProperties)]),
  },
  {
    type: "function" as const,
    name: "get_menu_item",
    description: "Look up one named menu item using only verified local menu data. For ordinal follow-ups, pass the exact ordered name from session state.",
    strict: true,
    parameters: strictObject({ item_name: { type: "string" } }, ["item_name"]),
  },
  {
    type: "function" as const,
    name: "recommend_menu",
    description: "Return grounded recommendations or compare the ordered previous recommendations by price.",
    strict: true,
    parameters: strictObject({
      ...commonProperties,
      preferences: { type: "array", items: { type: "string" }, maxItems: 8 },
      previous_item_names: { type: "array", items: { type: "string" }, maxItems: 8 },
      candidate_scope: { type: "string", enum: ["menu", "previous_recommendations"] },
      sort: { type: "string", enum: ["recommended", "price_asc"] },
    }, [...Object.keys(commonProperties), "preferences", "previous_item_names", "candidate_scope", "sort"]),
  },
  {
    type: "function" as const,
    name: "get_business_info",
    description: "Read verified address, hours, contact, official links or delivery information.",
    strict: true,
    parameters: strictObject({
      topic: { type: "string", enum: ["hours", "location", "phone", "instagram", "website", "delivery", "events", "general"] },
    }, ["topic"]),
  },
  {
    type: "function" as const,
    name: "get_help_capabilities",
    description: "Explain what PointPal can help with without inventing café information.",
    strict: true,
    parameters: strictObject({}, []),
  },
];

const CATEGORY_TAGS: Record<(typeof categoryValues)[number], string[]> = {
  any: [], coffee: ["coffee"], dessert: ["dessert"], food: ["food"], tea: ["tea"],
  matcha: ["matcha"], frappe: ["frappe"], sandwich: ["sandwich"], wrap: ["wrap"],
  cake: ["cake"], cold_drink: ["cold", "non-coffee"],
};

function completeContext(previous: ConversationContext): ConversationContext {
  return {
    ...EMPTY_CONVERSATION_CONTEXT,
    ...previous,
    tags: [...(previous.tags ?? [])], exclusions: [...(previous.exclusions ?? [])],
    preferences: [...(previous.preferences ?? [])],
    category: previous.category ?? null,
    temperature: previous.temperature ?? null,
    sweetness: previous.sweetness ?? null,
    recommendedItemNames: [...(previous.recommendedItemNames ?? [])],
    lastIntent: previous.lastIntent ?? null,
  };
}

function withIntent(previous: ConversationContext, intent: ReplyIntent): ConversationContext {
  return { ...completeContext(previous), lastIntent: intent };
}

function emptyMeta(intent: ReplyIntent = "search", previous: ConversationContext = EMPTY_CONVERSATION_CONTEXT): ToolMeta {
  return { items: [], sourceLabel: "", sourceUrl: "", intent, context: withIntent(previous, intent) };
}

function menuPayload(items: MenuItem[], caveat?: string) {
  return {
    matches: items.map(({ name, price, category, description, tags }) => ({ name, price, category, description, tags })),
    ordered_item_names: items.map((item) => item.name),
    match_count: items.length,
    verification: "Foodpanda list prices checked 13 July 2026; prices and availability may change or differ in-store.",
    sweetness_note: caveat,
  };
}

function categoryMatch(item: MenuItem, category: (typeof categoryValues)[number] | null): boolean {
  return !category || CATEGORY_TAGS[category].every((tag) => item.tags.includes(tag));
}

type FilterArgs = z.infer<typeof schemas.search_menu>;
function filterStructured(args: FilterArgs, source: MenuItem[] = MENU): MenuItem[] {
  const queryTokens = normalize(args.query ?? "").split(" ").filter((word) => word.length > 2);
  const exclusions = args.exclude_terms.map(normalize);
  return source.filter((item) => {
    const haystack = normalize([item.name, item.category, item.description, ...item.tags].join(" "));
    return categoryMatch(item, args.category) &&
      (args.temperature === "any" || item.tags.includes(args.temperature)) &&
      (args.max_budget === null || item.price <= args.max_budget) &&
      (args.min_budget === null || item.price >= args.min_budget) &&
      exclusions.every((term) => !haystack.includes(term)) &&
      (!queryTokens.length || queryTokens.some((term) => haystack.includes(term)));
  });
}

function sweetnessScore(item: MenuItem): number {
  const text = normalize([item.name, item.description, ...item.tags].join(" "));
  return ["sweet", "chocolate", "condensed", "caramel", "hazelnut", "vanilla", "cookie", "biscoff", "nutella"]
    .filter((term) => text.includes(term)).length;
}

function rank(items: MenuItem[], sweetness: (typeof sweetnessValues)[number], sort: "recommended" | "price_asc" = "recommended"): MenuItem[] {
  return [...items].sort((a, b) => {
    if (sort === "price_asc" && a.price !== b.price) return a.price - b.price;
    if (sweetness === "low") {
      const sweetnessDifference = sweetnessScore(a) - sweetnessScore(b);
      if (sweetnessDifference) return sweetnessDifference;
    }
    return Number(Boolean(b.popular)) - Number(Boolean(a.popular)) || a.price - b.price || a.name.localeCompare(b.name);
  });
}

function bestItem(name: string): MenuItem | null {
  const needle = normalize(name);
  return MENU.find((item) => normalize(item.name) === needle) ?? null;
}

function itemFromReference(name: string, previous: ConversationContext): MenuItem | null {
  const word = normalize(name).match(/\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|pehla|pehli|doosra|doosri|dusra|dusri)\b/)?.[1];
  const indexes: Record<string, number> = {
    first: 0, "1st": 0, pehla: 0, pehli: 0,
    second: 1, "2nd": 1, doosra: 1, doosri: 1, dusra: 1, dusri: 1,
    third: 2, "3rd": 2, fourth: 3, "4th": 3, fifth: 4, "5th": 4,
  };
  const referencedName = word ? previous.recommendedItemNames[indexes[word]] : undefined;
  return bestItem(referencedName ?? name);
}

function businessResult(topic: z.infer<typeof schemas.get_business_info>["topic"], previous: ConversationContext): ToolExecution {
  const facts: Record<typeof topic, unknown> = {
    location: { address: BUSINESS.location },
    phone: { phone: BUSINESS.phone },
    instagram: { handle: "@thepointlhr", url: INSTAGRAM_URL },
    website: { url: WEBSITE_URL },
    delivery: { provider: "Foodpanda", url: FOODPANDA_URL, note: "Availability and fees depend on the delivery address and live listing." },
    hours: {
      homepage_hours: BUSINESS.hoursFooter,
      location_page_hours: BUSINESS.hoursLocation,
      required_wording: `Published hours differ across The Point’s pages, so please call ${BUSINESS.phone} to confirm.`,
    },
    events: { verified: false, guidance: `No current event information is stored. Check ${INSTAGRAM_URL} or call ${BUSINESS.phone}.` },
    general: { name: BUSINESS.name, location: BUSINESS.location, phone: BUSINESS.phone, website: WEBSITE_URL },
  };
  const sourceUrl = topic === "instagram" ? INSTAGRAM_URL : topic === "delivery" ? FOODPANDA_URL : WEBSITE_URL;
  const intent: ReplyIntent = topic === "phone" ? "contact" : topic === "general" || topic === "events" || topic === "website" ? "general_guidance" : topic;
  return {
    output: JSON.stringify({ ok: true, topic, facts: facts[topic] }), items: [],
    sourceLabel: topic === "delivery" ? "Foodpanda" : topic === "instagram" ? "Instagram" : "Official website",
    sourceUrl, intent, context: withIntent(previous, intent),
  };
}

export function executePointPalTool(
  name: string,
  rawArguments: string,
  previous: ConversationContext = EMPTY_CONVERSATION_CONTEXT,
): ToolExecution {
  previous = completeContext(previous);
  if (!(name in schemas)) return { ...emptyMeta("unknown", previous), output: JSON.stringify({ ok: false, error: "Tool is not allowed." }) };
  let raw: unknown;
  try { raw = JSON.parse(rawArguments); } catch {
    return { ...emptyMeta("unknown", previous), output: JSON.stringify({ ok: false, error: "Tool arguments were not valid JSON." }) };
  }
  const parsed = schemas[name as ToolName].safeParse(raw);
  if (!parsed.success) return { ...emptyMeta("unknown", previous), output: JSON.stringify({ ok: false, error: "Tool arguments did not match the allowed schema." }) };

  if (name === "get_business_info") return businessResult((parsed.data as z.infer<typeof schemas.get_business_info>).topic, previous);
  if (name === "get_help_capabilities") {
    return {
      ...emptyMeta("help", previous),
      output: JSON.stringify({
        ok: true,
        capabilities: ["natural conversation", "verified menu search and prices", "budget and preference recommendations", "location, contact, hours and delivery", "English and Roman Urdu"],
        safety: "Ingredients and allergy safety must be confirmed with café staff.",
      }),
    };
  }

  if (name === "get_menu_item") {
    const item = itemFromReference((parsed.data as z.infer<typeof schemas.get_menu_item>).item_name, previous);
    const items = item ? [item] : [];
    const intent: ReplyIntent = item ? "item_lookup" : "no_match";
    return {
      output: JSON.stringify({ ok: true, ...menuPayload(items) }), items,
      sourceLabel: "Foodpanda menu", sourceUrl: FOODPANDA_URL, intent,
      context: {
        ...withIntent(previous, intent),
        tags: item?.tags.filter((tag) => ["coffee", "cold", "hot", "dessert", "food"].includes(tag)) ?? previous.tags,
      },
    };
  }

  const rawArgs = parsed.data as z.infer<typeof schemas.search_menu> & Partial<z.infer<typeof schemas.recommend_menu>>;
  const explicitCategory = rawArgs.category && rawArgs.category !== "any" ? rawArgs.category : null;
  const categoryChanged = Boolean(explicitCategory && explicitCategory !== previous.category);
  const effective: FilterArgs = {
    ...rawArgs,
    query: "query" in rawArgs ? rawArgs.query ?? null : null,
    category: rawArgs.category === null ? previous.category as (typeof categoryValues)[number] | null : rawArgs.category,
    temperature: rawArgs.temperature === "any" && !categoryChanged ? previous.temperature ?? "any" : rawArgs.temperature,
    max_budget: rawArgs.max_budget ?? (categoryChanged ? null : previous.budget),
    sweetness: rawArgs.sweetness === "unknown" && !categoryChanged ? previous.sweetness ?? "unknown" : rawArgs.sweetness,
    exclude_terms: categoryChanged ? rawArgs.exclude_terms : [...new Set([...previous.exclusions, ...rawArgs.exclude_terms])],
  };
  const recommendationArgs = name === "recommend_menu" ? parsed.data as z.infer<typeof schemas.recommend_menu> : null;
  const requestedPreferences = recommendationArgs?.preferences ?? (rawArgs.query ? [rawArgs.query] : previous.preferences);
  const positivePreferences = requestedPreferences.filter((preference) =>
    !/cheap|cheapest|popular|best|recommend|less sweet|low sweet|kam sweet/i.test(preference),
  );
  if (!effective.query && positivePreferences.length) effective.query = positivePreferences.join(" ");
  const previousNames = recommendationArgs?.previous_item_names.length ? recommendationArgs.previous_item_names : previous.recommendedItemNames;
  const previousItems = previousNames.map(bestItem).filter((item): item is MenuItem => Boolean(item));
  const source = recommendationArgs?.candidate_scope === "previous_recommendations" ? previousItems : MENU;
  const sweetnessCaveat = effective.sweetness === "low"
    ? "Sweetness levels are not verified. Ranking only uses words in public names and descriptions; do not claim that an item is definitively less sweet. Ask café staff for exact sweetness or customisation."
    : undefined;
  const items = rank(filterStructured(effective, source), effective.sweetness, recommendationArgs?.sort).slice(0, effective.limit);
  const tags = [
    ...(effective.category && effective.category !== "any" ? CATEGORY_TAGS[effective.category] : []),
    ...(effective.temperature !== "any" ? [effective.temperature] : []),
  ];
  const intent: ReplyIntent = name === "recommend_menu" ? "recommendation" : items.length ? "search" : "no_match";
  return {
    output: JSON.stringify({ ok: true, ...menuPayload(items, sweetnessCaveat) }), items,
    sourceLabel: "Foodpanda menu", sourceUrl: FOODPANDA_URL, intent,
    context: {
      tags,
      budget: effective.max_budget,
      category: effective.category && effective.category !== "any" ? effective.category : null,
      temperature: effective.temperature === "any" ? null : effective.temperature,
      sweetness: effective.sweetness === "unknown" ? null : effective.sweetness,
      exclusions: effective.exclude_terms,
      preferences: categoryChanged
        ? positivePreferences
        : [...new Set([...previous.preferences, ...positivePreferences])],
      recommendedItemNames: items.length ? items.map((item) => item.name) : previous.recommendedItemNames,
      lastIntent: intent,
    },
  };
}
