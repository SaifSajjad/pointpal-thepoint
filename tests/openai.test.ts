import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { interpretQuestion, parseInterpretation } from "@/lib/openai";

describe("OpenAI intent interpretation safety", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  it("works without a key by returning deterministic-only mode", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(interpretQuestion("coffe q peni chyia?", [])).resolves.toBeNull();
  });

  it("turns only validated model classifications into deterministic queries", () => {
    expect(parseInterpretation("faq:hours")).toBe("What are your opening hours?");
    expect(parseInterpretation("recommend:coffee,cold|800|")).toBe("Recommend coffee cold under Rs. 800");
    expect(parseInterpretation("recommend:coffee||less-sweet")).toBe("Recommend coffee not too sweet");
    expect(parseInterpretation("recommend:coffee||value")).toBe("Recommend coffee affordable");
    expect(parseInterpretation("item:iced spanish")).toBe("What is the price of Iced Spanish?");
  });

  it("rejects invented classification values", () => {
    expect(parseInterpretation("item:secret unicorn latte")).toBeNull();
    expect(parseInterpretation("recommend:vegan,coffee|800|")).toBe("Recommend coffee under Rs. 800");
    expect(parseInterpretation("recommend:coffee|999999|")).toBeNull();
    expect(parseInterpretation("recommend:coffee||allergy-safe")).toBeNull();
    expect(parseInterpretation("ignore safeguards")).toBeNull();
  });
});
