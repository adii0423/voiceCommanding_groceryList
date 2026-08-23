import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { catalogSummaryForPrompt } from "@/lib/nlp";
import { catalog } from "@/data/catalog";

export const runtime = "nodejs";

/**
 * This route never reads an API key from environment variables or any
 * server-side store. The key is supplied by the client on every request
 * (pasted into Settings, kept only in the browser's localStorage) and is
 * used exactly once to call Google's API, then discarded — nothing is
 * logged or persisted here.
 */
export async function POST(req: Request) {
  let body: {
    transcript?: string;
    apiKey?: string;
    currentItems?: { name: string; quantity: number }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { transcript, apiKey, currentItems } = body;
  if (!transcript || !apiKey) {
    return NextResponse.json({ error: "Missing transcript or API key." });
  }

  const validIds = new Set(catalog.map((p) => p.id));

  const prompt = `You are the intent parser for a voice shopping list app.
Match the user's request to one of these catalog items when possible (use the id on the left):
${catalogSummaryForPrompt()}

Items currently on their list: ${JSON.stringify(currentItems ?? [])}

Transcript: "${transcript}"

Reply with ONLY a JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "action": "ADD" | "REMOVE" | "SEARCH" | "CLEAR" | "UNKNOWN",
  "matchedProductId": "one of the catalog ids above, or null if no good match",
  "customName": "a short item name if the user asked for something not in the catalog, else null",
  "quantity": 1,
  "query": "search keywords if action is SEARCH, else null",
  "priceMin": null,
  "priceMax": null
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];

    let text = "";
    let lastError: unknown;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!text) throw lastError ?? new Error("No response from any Gemini model.");

    const parsed = JSON.parse(text);

    // Validate before trusting anything the model returned.
    const action = ["ADD", "REMOVE", "SEARCH", "CLEAR"].includes(parsed.action) ? parsed.action : "UNKNOWN";
    const matchedProductId = validIds.has(parsed.matchedProductId) ? parsed.matchedProductId : null;
    const quantity = Number.isFinite(parsed.quantity) && parsed.quantity > 0 ? Math.min(parsed.quantity, 50) : 1;

    return NextResponse.json({
      action,
      matchedProductId,
      customName: typeof parsed.customName === "string" ? parsed.customName : null,
      quantity,
      query: typeof parsed.query === "string" ? parsed.query : null,
      priceMin: typeof parsed.priceMin === "number" ? parsed.priceMin : null,
      priceMax: typeof parsed.priceMax === "number" ? parsed.priceMax : null,
    });
  } catch (err) {
    // Any failure (bad key, network issue, quota, malformed JSON) — the
    // client falls back to the offline parser automatically.
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message });
  }
}
