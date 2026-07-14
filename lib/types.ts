export type MenuItem = {
  name: string;
  price: number;
  category: string;
  description: string;
  tags: string[];
  popular?: boolean;
};

export type ReplyIntent =
  | "empty"
  | "conversation"
  | "help"
  | "general_guidance"
  | "location"
  | "hours"
  | "contact"
  | "instagram"
  | "delivery"
  | "allergy"
  | "item_lookup"
  | "recommendation"
  | "no_match"
  | "search"
  | "unknown";

export type ConversationContext = {
  tags: string[];
  budget: number | null;
  category: string | null;
  temperature: "hot" | "cold" | null;
  sweetness: "low" | "balanced" | "sweet" | null;
  exclusions: string[];
  preferences: string[];
  recommendedItemNames: string[];
  lastIntent: ReplyIntent | null;
};

export const EMPTY_CONVERSATION_CONTEXT: ConversationContext = {
  tags: [],
  budget: null,
  category: null,
  temperature: null,
  sweetness: null,
  exclusions: [],
  preferences: [],
  recommendedItemNames: [],
  lastIntent: null,
};

export type GroundedReply = {
  text: string;
  sourceLabel: string;
  sourceUrl: string;
  intent: ReplyIntent;
  items: MenuItem[];
  budget: number | null;
  context: ConversationContext;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = GroundedReply & {
  mode: "ai" | "fallback";
};
