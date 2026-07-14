import { beforeEach, describe, expect, it, vi } from "vitest";

const { runPointPalAgent } = vi.hoisted(() => ({ runPointPalAgent: vi.fn() }));
vi.mock("@/lib/openai", () => ({ runPointPalAgent }));

import { POST } from "@/app/api/chat/route";

function request(body: unknown, ip: string, contentType = "application/json") {
  return new Request("http://localhost/api/chat", {
    method: "POST", headers: { "Content-Type": contentType, "x-forwarded-for": ip }, body: JSON.stringify(body),
  });
}

const aiReply = {
  text: "Hi! What kind of coffee are you in the mood for?", sourceLabel: "", sourceUrl: "",
  intent: "conversation", items: [], budget: null,
  context: {
    tags: [], budget: null, category: null, temperature: null, sweetness: null,
    exclusions: [], preferences: [], recommendedItemNames: [], lastIntent: "conversation",
  }, mode: "ai",
};

describe("POST /api/chat", () => {
  beforeEach(() => { runPointPalAgent.mockReset(); runPointPalAgent.mockResolvedValue(aiReply); });

  it("uses the agent first even for a known FAQ", async () => {
    const location = { ...aiReply, text: "The Point is at 290 MB, Sector H, DHA Phase 6, Lahore, Pakistan.", sourceLabel: "Official website", sourceUrl: "https://www.thepoint.cafe/", intent: "location" };
    runPointPalAgent.mockResolvedValueOnce(location);
    const response = await POST(request({ message: "Where are you located?", messages: [] }, "10.0.0.1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "ai", intent: "location", text: location.text });
    expect(runPointPalAgent).toHaveBeenCalledOnce();
  });

  it("returns one unified agent response", async () => {
    const response = await POST(request({ message: "hi", messages: [] }, "10.0.0.2"));
    const payload = await response.json();
    expect(payload.text).toBe(aiReply.text);
    expect(payload).not.toHaveProperty("aiNote");
  });

  it.each(["timeout", "rate_limit"])("falls back deterministically when the agent fails with %s", async (failure) => {
    runPointPalAgent.mockRejectedValueOnce(new Error(failure));
    const response = await POST(request({ message: "800 tak koi coffee batao", messages: [] }, "10.0.0.6"));
    const payload = await response.json();
    expect(payload).toMatchObject({ intent: "recommendation", mode: "fallback" });
    expect(payload.items.every((item: { price: number }) => item.price <= 800)).toBe(true);
  });

  it("falls back naturally when no OpenAI key exists", async () => {
    runPointPalAgent.mockResolvedValueOnce(null);
    const response = await POST(request({ message: "hi", messages: [] }, "10.0.0.7"));
    expect(await response.json()).toMatchObject({ intent: "conversation", mode: "fallback" });
  });

  it("validates content type and input length", async () => {
    expect((await POST(request({ message: "hello" }, "10.0.0.3", "text/plain"))).status).toBe(415);
    expect((await POST(request({ message: "x".repeat(601) }, "10.0.0.4"))).status).toBe(400);
  });

  it("applies basic per-client abuse protection", async () => {
    let response: Response | undefined;
    for (let index = 0; index < 16; index += 1) response = await POST(request({ message: "hi" }, "10.0.0.99"));
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("60");
  });
});
