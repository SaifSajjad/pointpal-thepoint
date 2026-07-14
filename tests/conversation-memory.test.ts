import { describe, expect, it } from "vitest";

import { executePointPalTool } from "@/lib/agent-tools";
import { EMPTY_CONVERSATION_CONTEXT, type ConversationContext } from "@/lib/types";

const base = {
  category: null, temperature: "any", max_budget: null, min_budget: null,
  sweetness: "unknown", exclude_terms: [], limit: 5, preferences: [],
  previous_item_names: [], candidate_scope: "menu", sort: "recommended",
};

function recommend(overrides: Record<string, unknown>, context: ConversationContext) {
  return executePointPalTool("recommend_menu", JSON.stringify({ ...base, ...overrides }), context);
}

describe("ordered session conversation memory", () => {
  it("preserves coffee constraints and resolves the real second latest option", () => {
    const coffee = recommend({ category: "coffee" }, EMPTY_CONVERSATION_CONTEXT);
    const cold = recommend({ temperature: "cold", previous_item_names: coffee.context.recommendedItemNames }, coffee.context);
    const budget = recommend({ max_budget: 800, previous_item_names: cold.context.recommendedItemNames }, cold.context);
    const lessSweet = recommend({ sweetness: "low", previous_item_names: budget.context.recommendedItemNames }, budget.context);

    expect(lessSweet.context).toMatchObject({ category: "coffee", temperature: "cold", budget: 800, sweetness: "low" });
    expect(lessSweet.items.slice(0, 2).map((item) => [item.name, item.price])).toEqual([
      ["Iced Americano", 590],
      ["Iced Tiramisu", 790],
    ]);

    const cheapest = recommend({
      candidate_scope: "previous_recommendations",
      sort: "price_asc",
      previous_item_names: lessSweet.context.recommendedItemNames,
    }, lessSweet.context);
    expect(cheapest.items[0]).toMatchObject({ name: "Iced Americano", price: 590 });

    const second = executePointPalTool("get_menu_item", JSON.stringify({ item_name: "second option" }), cheapest.context);
    expect(second.items[0]).toMatchObject({ name: "Iced Tiramisu", price: 790 });
  });

  it("preserves a chocolate-dessert shortlist when no cheaper match exists", () => {
    const dessert = recommend({ category: "dessert" }, EMPTY_CONVERSATION_CONTEXT);
    const chocolate = recommend({ preferences: ["chocolate"] }, dessert.context);
    expect(chocolate.items.slice(0, 2).map((item) => [item.name, item.price])).toEqual([
      ["Dark Chocolate Fudge Brownie", 580],
      ["Nutella Stuffed Cookie", 610],
    ]);

    const cheaper = recommend({
      max_budget: 579,
      preferences: ["chocolate"],
      previous_item_names: chocolate.context.recommendedItemNames,
    }, chocolate.context);
    expect(cheaper.items).toHaveLength(0);
    expect(cheaper.context.recommendedItemNames).toEqual(chocolate.context.recommendedItemNames);

    const second = executePointPalTool("get_menu_item", JSON.stringify({ item_name: "second option" }), cheaper.context);
    expect(second.items[0]).toMatchObject({ name: "Nutella Stuffed Cookie", price: 610 });
  });

  it("keeps exclusions across follow-up recommendations", () => {
    const initial = recommend({ category: "coffee", exclude_terms: ["chocolate"] }, EMPTY_CONVERSATION_CONTEXT);
    const cold = recommend({ temperature: "cold" }, initial.context);
    expect(cold.context.exclusions).toContain("chocolate");
    expect(cold.items.every((item) => !`${item.name} ${item.description}`.toLowerCase().includes("chocolate"))).toBe(true);
  });
});
