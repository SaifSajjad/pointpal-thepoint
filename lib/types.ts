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
  lastIntent: ReplyIntent | null;
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
