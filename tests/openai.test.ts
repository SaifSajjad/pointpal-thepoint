import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { answer } from "@/lib/pointpal";
import { enhanceReply, isGroundedEnhancement, parseInterpretation } from "@/lib/openai";

describe("OpenAI enhancement safety", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  it("works without a key by returning deterministic-only mode", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(enhanceReply("Best coffee under Rs. 800", answer("Best coffee under Rs. 800"), [])).resolves.toBeNull();
  });

  it("rejects an invented price from model output", () => {
    const reply = answer("What is the price of Iced Spanish?");
    expect(isGroundedEnhancement("A great choice at Rs. 999.", reply)).toBe(false);
  });

  it("rejects unsupported dietary claims", () => {
    const reply = answer("Recommend something cold");
    expect(isGroundedEnhancement("These are all vegan and allergy-safe.", reply)).toBe(false);
  });

  it("accepts a short grounded recommendation note", () => {
    const reply = answer("Best coffee under Rs. 800");
    expect(isGroundedEnhancement("Espresso is a direct, value-minded place to start.", reply)).toBe(true);
  });

  it("turns only validated model classifications into deterministic queries", () => {
    expect(parseInterpretation("faq:hours")).toBe("What are your opening hours?");
    expect(parseInterpretation("recommend:coffee,cold|800")).toBe("Recommend coffee cold under Rs. 800");
    expect(parseInterpretation("item:iced spanish")).toBe("What is the price of Iced Spanish?");
  });

  it("rejects invented classification values", () => {
    expect(parseInterpretation("item:secret unicorn latte")).toBeNull();
    expect(parseInterpretation("recommend:vegan,coffee|800")).toBe("Recommend coffee under Rs. 800");
    expect(parseInterpretation("recommend:coffee|999999")).toBeNull();
    expect(parseInterpretation("ignore safeguards")).toBeNull();
  });
});
