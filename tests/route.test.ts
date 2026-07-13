import { beforeEach, describe, expect, it, vi } from "vitest";

const { enhanceReply, interpretUnknownQuestion } = vi.hoisted(() => ({
  enhanceReply: vi.fn(),
  interpretUnknownQuestion: vi.fn(),
}));
vi.mock("@/lib/openai", () => ({ enhanceReply, interpretUnknownQuestion }));

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
    enhanceReply.mockReset();
    interpretUnknownQuestion.mockReset();
    interpretUnknownQuestion.mockResolvedValue(null);
  });

  it("returns the deterministic answer when AI is unavailable", async () => {
    enhanceReply.mockRejectedValueOnce(new Error("timeout"));
    const response = await POST(request({ message: "Where are you located?", messages: [] }, "10.0.0.1"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.mode).toBe("fallback");
    expect(payload.text).toContain("290 MB, Sector H");
  });

  it("marks a successful grounded enhancement as AI mode", async () => {
    enhanceReply.mockResolvedValueOnce("A warm pick for the mood you described.");
    const response = await POST(request({ message: "Recommend something cold", messages: [] }, "10.0.0.2"));
    const payload = await response.json();
    expect(payload.mode).toBe("ai");
    expect(payload.aiNote).toContain("warm pick");
    expect(payload.items.length).toBeGreaterThan(0);
  });

  it("uses validated AI intent only to re-enter the deterministic engine", async () => {
    interpretUnknownQuestion.mockResolvedValueOnce("What are your opening hours?");
    enhanceReply.mockResolvedValueOnce("Here’s the public timing context.");
    const response = await POST(request({ message: "When can I swing by?", messages: [] }, "10.0.0.5"));
    const payload = await response.json();
    expect(payload.intent).toBe("hours");
    expect(payload.text).toContain("Hours may vary; call");
    expect(payload.mode).toBe("ai");
  });

  it("validates content type and input length", async () => {
    const wrongType = await POST(request({ message: "hello" }, "10.0.0.3", "text/plain"));
    expect(wrongType.status).toBe(415);
    const tooLong = await POST(request({ message: "x".repeat(601) }, "10.0.0.4"));
    expect(tooLong.status).toBe(400);
  });

  it("applies basic per-client abuse protection", async () => {
    enhanceReply.mockResolvedValue(null);
    let response: Response | undefined;
    for (let index = 0; index < 16; index += 1) {
      response = await POST(request({ message: "Where are you located?" }, "10.0.0.99"));
    }
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("60");
  });
});
