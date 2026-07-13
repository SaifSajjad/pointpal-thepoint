import { beforeEach, describe, expect, it, vi } from "vitest";

const { interpretQuestion } = vi.hoisted(() => ({
  interpretQuestion: vi.fn(),
}));
vi.mock("@/lib/openai", () => ({ interpretQuestion }));

import { POST } from "@/app/api/chat/route";

function request(body: unknown, ip: string, contentType = "application/json") {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": contentType, "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    interpretQuestion.mockReset();
    interpretQuestion.mockResolvedValue(null);
  });

  it("returns one deterministic location answer without a duplicate AI note", async () => {
    const response = await POST(request({ message: "Where are you located?", messages: [] }, "10.0.0.1"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.mode).toBe("fallback");
    expect(payload.text).toBe("The Point is at 290 MB, Sector H, DHA Phase 6, Lahore, Pakistan.");
    expect(payload).not.toHaveProperty("aiNote");
    expect(interpretQuestion).not.toHaveBeenCalled();
  });

  it("uses validated AI intent only to re-enter the deterministic engine", async () => {
    interpretQuestion.mockResolvedValueOnce("Recommend coffee");
    const response = await POST(request({ message: "coffe q peni chyia?", messages: [] }, "10.0.0.2"));
    const payload = await response.json();
    expect(payload.intent).toBe("recommendation");
    expect(payload.mode).toBe("ai");
    expect(payload.items.length).toBeGreaterThan(0);
    expect(payload.items.every((item: { tags: string[] }) => item.tags.includes("coffee"))).toBe(true);
    expect(payload).not.toHaveProperty("aiNote");
  });

  it("can recover an unclear FAQ through validated AI intent", async () => {
    interpretQuestion.mockResolvedValueOnce("What are your opening hours?");
    const response = await POST(request({ message: "When can I swing by?", messages: [] }, "10.0.0.5"));
    const payload = await response.json();
    expect(payload.intent).toBe("hours");
    expect(payload.text).toContain("Hours may vary; call");
    expect(payload.mode).toBe("ai");
  });

  it("keeps the deterministic recommendation when AI times out", async () => {
    interpretQuestion.mockRejectedValueOnce(new Error("timeout"));
    const response = await POST(request({ message: "800 tak koi coffee batao", messages: [] }, "10.0.0.6"));
    const payload = await response.json();
    expect(payload.intent).toBe("recommendation");
    expect(payload.mode).toBe("fallback");
    expect(payload.items.every((item: { price: number }) => item.price <= 800)).toBe(true);
  });

  it("validates content type and input length", async () => {
    const wrongType = await POST(request({ message: "hello" }, "10.0.0.3", "text/plain"));
    expect(wrongType.status).toBe(415);
    const tooLong = await POST(request({ message: "x".repeat(601) }, "10.0.0.4"));
    expect(tooLong.status).toBe(400);
  });

  it("applies basic per-client abuse protection", async () => {
    let response: Response | undefined;
    for (let index = 0; index < 16; index += 1) {
      response = await POST(request({ message: "Where are you located?" }, "10.0.0.99"));
    }
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("60");
  });
});
