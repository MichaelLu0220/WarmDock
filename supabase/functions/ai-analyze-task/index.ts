// WarmDock AI task analysis (Supabase Edge Function, Deno).
//
// Server-side only: holds the provider API key, enforces a 5s timeout, and never
// blocks task creation. On any failure it returns a non-2xx so the client uses
// its medium / score 3 fallback. Requires a valid user JWT (verify_jwt default).
//
// Set the key once:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIMEOUT_MS = 5000;
const MODEL = "claude-haiku-4-5-20251001";

interface Analysis {
  suggested_correction: string | null;
  suggested_band: "easy" | "medium" | "hard";
  suggested_score: 1 | 2 | 3 | 4 | 5;
  reason: string;
}

const SYSTEM_PROMPT = [
  "You help a minimalist todo app analyze a single short task title.",
  "Check English spelling/typos and estimate effort.",
  "Reply with ONLY a compact JSON object, no prose, with keys:",
  '  "suggested_correction": the corrected title, or null if no change needed',
  '  "suggested_band": one of "easy" | "medium" | "hard"',
  '  "suggested_score": integer 1-5 (easy=1-2, medium=3, hard=4-5)',
  '  "reason": one short sentence (max 12 words) explaining the difficulty',
].join("\n");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

function clampScore(n: unknown): 1 | 2 | 3 | 4 | 5 {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, v)) as 1 | 2 | 3 | 4 | 5;
}

function normalizeBand(b: unknown): "easy" | "medium" | "hard" {
  return b === "easy" || b === "hard" ? b : "medium";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonResponse({ error: "ai_not_configured" }, 503);

  let title = "";
  try {
    const body = await req.json();
    title = String(body?.title ?? "").trim();
  } catch {
    return jsonResponse({ error: "bad_request" }, 400);
  }
  if (!title) return jsonResponse({ error: "bad_request" }, 400);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Task title: ${title}` }],
      }),
    });

    if (!res.ok) return jsonResponse({ error: "ai_upstream_error" }, 502);

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return jsonResponse({ error: "ai_unparseable" }, 502);

    const parsed = JSON.parse(match[0]);
    const correction =
      typeof parsed.suggested_correction === "string" &&
      parsed.suggested_correction.trim() &&
      parsed.suggested_correction.trim() !== title
        ? parsed.suggested_correction.trim()
        : null;

    const analysis: Analysis = {
      suggested_correction: correction,
      suggested_band: normalizeBand(parsed.suggested_band),
      suggested_score: clampScore(parsed.suggested_score),
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
    return jsonResponse(analysis);
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return jsonResponse({ error: aborted ? "ai_timeout" : "ai_error" }, 504);
  } finally {
    clearTimeout(timer);
  }
});
