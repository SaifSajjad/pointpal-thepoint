import { describe, expect, it } from "vitest";

import { executePointPalTool, POINTPAL_TOOLS } from "@/lib/agent-tools";

const base = { category: null, temperature: "any", max_budget: null, min_budget: null, sweetness: "unknown", exclude_terms: [], limit: 5 };

describe("validated PointPal tools", () => {
  it("exposes only the five allow-listed tools", () => {
    expect(POINTPAL_TOOLS.map((tool) => tool.name)).toEqual(["search_menu", "get_menu_item", "recommend_menu", "get_business_info", "get_help_capabilities"]);
  });

  it.each([
    ["coffee", "coffee"], ["dessert", "dessert"], ["tea", "tea"], ["matcha", "matcha"], ["frappe", "frappe"],
  ])("filters %s records by verified tag", (category, tag) => {
    const result = executePointPalTool("search_menu", JSON.stringify({ ...base, query: null, category }));
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.tags.includes(tag))).toBe(true);
  });

  it("filters cold coffee to the budget", () => {
    const result = executePointPalTool("recommend_menu", JSON.stringify({ ...base, category: "coffee", temperature: "cold", max_budget: 800, preferences: [], previous_item_names: [] }));
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.tags.includes("cold") && item.price <= 800)).toBe(true);
  });

  it("finds Iced Spanish and its verified price", () => {
    const result = executePointPalTool("get_menu_item", JSON.stringify({ item_name: "Iced Spanish" }));
    expect(result.items[0]).toMatchObject({ name: "Iced Spanish", price: 790 });
  });

  it("does not create an unverified item", () => {
    expect(executePointPalTool("get_menu_item", JSON.stringify({ item_name: "Unicorn Latte" })).items).toHaveLength(0);
  });

  it.each(["location", "phone", "instagram", "website", "delivery"])("returns a source for business topic %s", (topic) => {
    const result = executePointPalTool("get_business_info", JSON.stringify({ topic }));
    expect(result.sourceUrl).toMatch(/^https:/);
    expect(JSON.parse(result.output).ok).toBe(true);
  });

  it("returns the exact published-hours conflict warning", () => {
    const result = executePointPalTool("get_business_info", JSON.stringify({ topic: "hours" }));
    expect(result.output).toContain("Published hours differ across The Point’s pages, so please call +92 327 4777957 to confirm.");
  });

  it("rejects unknown tools, malformed JSON and extra properties", () => {
    expect(JSON.parse(executePointPalTool("delete_menu", "{}").output).ok).toBe(false);
    expect(JSON.parse(executePointPalTool("get_menu_item", "{").output).ok).toBe(false);
    expect(JSON.parse(executePointPalTool("get_menu_item", JSON.stringify({ item_name: "Latte", admin: true })).output).ok).toBe(false);
  });

  it("returns safe help capabilities", () => {
    const result = executePointPalTool("get_help_capabilities", "{}");
    expect(result.intent).toBe("help");
    expect(result.output).toContain("allergy safety");
  });
});
