import { z } from "zod";

import {
  BUSINESS,
  FOODPANDA_URL,
  INSTAGRAM_URL,
  WEBSITE_URL,
} from "@/data/business";
import { MENU } from "@/data/menu";
import { normalize } from "@/lib/pointpal";
import type { ConversationContext, MenuItem, ReplyIntent } from "@/lib/types";

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
  type: "object",
  properties,
  required,
  additionalProperties: false,
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
    parameters: strictObject(
      { query: { type: ["string", "null"] }, ...commonProperties },
      ["query", ...Object.keys(commonProperties)],
    ),
  },
  {
    type: "function" as const,
    name: "get_menu_item",
    description: "Look up one named menu item using only verified local menu data.",
    strict: true,
    parameters: strictObject({ item_name: { type: "string" } }, ["item_name"]),
  },
  {
    type: "function" as const,
    name: "recommend_menu",
    description: "Return grounded recommendations for preferences, budget, temperature and conversation follow-ups.",
    strict: true,
    parameters: strictObject(
      {
        ...commonProperties,
        preferences: { type: "array", items: { type: "string" }, maxItems: 8 },
        previous_item_names: { type: "array", items: { type: "string" }, maxItems: 8 },
      },
      [...Object.keys(commonProperties), "preferences", "previous_item_names"],
    ),
  },
  {
    type: "function" as const,
    name: "get_business_info",
    description: "Read verified address, hours, contact, official links or delivery information.",
    strict: true,
    parameters: strictObject(
      { topic: { type: "string", enum: ["hours", "location", "phone", "instagram", "website", "delivery", "events", "general"] } },
      ["topic"],
    ),
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

function emptyMeta(intent: ReplyIntent = "search"): ToolMeta {
  return { items: [], sourceLabel: "", sourceUrl: "", intent, context: { tags: [], budget: null, lastIntent: intent } };
}

function menuPayload(items: MenuItem[], caveat?: string) {
  return {
    matches: items.map(({ name, price, category, description, tags }) => ({ name, price, category, description, tags })),
    match_count: items.length,
    verification: "Foodpanda list prices checked 13 July 2026; prices and availability may change or differ in-store.",
    sweetness_note: caveat,
  };
}

function categoryMatch(item: MenuItem, category: (typeof categoryValues)[number] | null): boolean {
  return !category || CATEGORY_TAGS[category].every((tag) => item.tags.includes(tag));
}

function filterStructured(args: z.infer<typeof schemas.search_menu>): MenuItem[] {
  const queryTokens = normalize(args.query ?? "").split(" ").filter((word) => word.length > 2);
  const exclusions = args.exclude_terms.map(normalize);
  return MENU.filter((item) => {
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

function rank(items: MenuItem[], sweetness: (typeof sweetnessValues)[number], previous: string[] = []): MenuItem[] {
  const seen = new Set(previous.map(normalize));
  return [...items].sort((a, b) => {
    const novelty = Number(seen.has(normalize(a.name))) - Number(seen.has(normalize(b.name)));
    if (novelty) return novelty;
    if (sweetness === "low") {
      const score = sweetnessScore(a) - sweetnessScore(b);
      if (score) return score;
    }
    return Number(Boolean(b.popular)) - Number(Boolean(a.popular)) || a.price - b.price;
  });
}

function bestItem(name: string): MenuItem | null {
  const needle = normalize(name);
  return MENU.find((item) => normalize(item.name) === needle) ?? null;
}

function businessResult(topic: z.infer<typeof schemas.get_business_info>["topic"]): ToolExecution {
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
  const intent: ReplyIntent = topic === "phone"
    ? "contact"
    : topic === "general" || topic === "events" || topic === "website"
      ? "general_guidance"
      : topic;
  return {
    output: JSON.stringify({ ok: true, topic, facts: facts[topic] }),
    items: [], sourceLabel: topic === "delivery" ? "Foodpanda" : topic === "instagram" ? "Instagram" : "Official website",
    sourceUrl, intent,
    context: { tags: [], budget: null, lastIntent: intent },
  };
}

export function executePointPalTool(name: string, rawArguments: string): ToolExecution {
  if (!(name in schemas)) {
    return { ...emptyMeta("unknown"), output: JSON.stringify({ ok: false, error: "Tool is not allowed." }) };
  }
  let raw: unknown;
  try { raw = JSON.parse(rawArguments); } catch {
    return { ...emptyMeta("unknown"), output: JSON.stringify({ ok: false, error: "Tool arguments were not valid JSON." }) };
  }
  const parsed = schemas[name as ToolName].safeParse(raw);
  if (!parsed.success) {
    return { ...emptyMeta("unknown"), output: JSON.stringify({ ok: false, error: "Tool arguments did not match the allowed schema." }) };
  }

  if (name === "get_business_info") return businessResult((parsed.data as z.infer<typeof schemas.get_business_info>).topic);
  if (name === "get_help_capabilities") {
    return { ...emptyMeta("help"), output: JSON.stringify({ ok: true, capabilities: ["natural conversation", "verified menu search and prices", "budget and preference recommendations", "location, contact, hours and delivery", "English and Roman Urdu"], safety: "Ingredients and allergy safety must be confirmed with café staff." }) };
  }

  if (name === "get_menu_item") {
    const item = bestItem((parsed.data as z.infer<typeof schemas.get_menu_item>).item_name);
    const items = item ? [item] : [];
    return {
      output: JSON.stringify({ ok: true, ...menuPayload(items) }), items,
      sourceLabel: "Foodpanda menu", sourceUrl: FOODPANDA_URL, intent: item ? "item_lookup" : "no_match",
      context: { tags: item?.tags.filter((tag) => ["coffee", "cold", "hot", "dessert", "food"].includes(tag)) ?? [], budget: null, lastIntent: item ? "item_lookup" : "no_match" },
    };
  }

  const args = parsed.data as z.infer<typeof schemas.search_menu> & { previous_item_names?: string[] };
  const sweetnessCaveat = args.sweetness === "low" ? "Sweetness levels are not verified; these are ranked only by words in public names/descriptions. Ask café staff for the least-sweet option." : undefined;
  const items = rank(filterStructured(args), args.sweetness, args.previous_item_names).slice(0, args.limit);
  const tags = [...(args.category && args.category !== "any" ? CATEGORY_TAGS[args.category] : []), ...(args.temperature !== "any" ? [args.temperature] : [])];
  return {
    output: JSON.stringify({ ok: true, ...menuPayload(items, sweetnessCaveat) }), items,
    sourceLabel: "Foodpanda menu", sourceUrl: FOODPANDA_URL,
    intent: name === "recommend_menu" ? "recommendation" : items.length ? "search" : "no_match",
    context: { tags, budget: args.max_budget, lastIntent: name === "recommend_menu" ? "recommendation" : items.length ? "search" : "no_match" },
  };
}
