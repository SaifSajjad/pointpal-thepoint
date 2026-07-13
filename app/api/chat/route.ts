import { NextResponse } from "next/server";
import { z } from "zod";

import { interpretQuestion } from "@/lib/openai";
import { answer, needsIntentInterpretation } from "@/lib/pointpal";
import type { ChatResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 15;

const requestSchema = z.object({
  message: z.string().trim().min(1).max(600),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1_200),
      }),
    )
    .max(12)
    .default([]),
  context: z
    .object({
      tags: z.array(z.string().trim().min(1).max(30)).max(6),
      budget: z.number().int().min(0).max(100_000).nullable(),
      lastIntent: z
        .enum([
          "empty",
          "location",
          "hours",
          "contact",
          "instagram",
          "delivery",
          "allergy",
          "item_lookup",
          "recommendation",
          "no_match",
          "search",
          "unknown",
        ])
        .nullable(),
    })
    .default({ tags: [], budget: null, lastIntent: null }),
});

type RateState = { count: number; resetAt: number };
const rateLimit = new Map<string, RateState>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("x-real-ip") || "local").slice(0, 80);
}

function isRateLimited(key: string, now = Date.now()): boolean {
  const current = rateLimit.get(key);
  if (!current || now >= current.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_MAX;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Send a JSON request." }, { status: 415 });
  }

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "PointPal is taking a short breather. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please send a message between 1 and 600 characters." },
      { status: 400 },
    );
  }

  const { message, messages, context } = parsed.data;
  let grounded = answer(message, context);
  let usedAiIntent = false;
  try {
    if (grounded.intent === "unknown" || needsIntentInterpretation(message)) {
      const interpreted = await interpretQuestion(message, messages);
      if (interpreted) {
        const interpretedReply = answer(`${interpreted} ${message}`, context);
        if (interpretedReply.intent !== "unknown") {
          grounded = interpretedReply;
          usedAiIntent = true;
        }
      }
    }
  } catch (error) {
    console.warn("PointPal OpenAI intent interpretation failed; deterministic fallback served.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
  }

  const response: ChatResponse = {
    ...grounded,
    mode: usedAiIntent ? "ai" : "fallback",
  };
  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const __test__ = { isRateLimited, requestSchema };
