/**
 * The single AI service module. All AI calls go through here, server-side only.
 * Provider and credentials come from environment variables; switching providers
 * (Lovable AI gateway <-> own Gemini key) is an env-only change:
 *   AI_PROVIDER=lovable  + LOVABLE_API_KEY (managed) + AI_MODEL (default openai/gpt-6-astra)
 *   AI_PROVIDER=gemini   + GEMINI_API_KEY  + AI_MODEL (default gemini-2.5-flash)
 * Secrets are never logged, returned, or included in error messages.
 */
import { z } from "zod";

export interface AiConfig {
  provider: "lovable" | "gemini";
  model: string;
  key: string | null;
  keyVar: string;
}

export function getAiConfig(dbProvider?: string | null, dbModel?: string | null): AiConfig {
  const provider = (process.env["AI_PROVIDER"] ?? dbProvider ?? "lovable") as "lovable" | "gemini";
  const model = process.env["AI_MODEL"] ?? dbModel ?? (provider === "gemini" ? "gemini-2.5-flash" : "openai/gpt-6-astra");
  const keyVar = provider === "gemini" ? "GEMINI_API_KEY" : "LOVABLE_API_KEY";
  const key = process.env[keyVar] ?? null;
  return { provider, model, key, keyVar };
}

/** Status for the AI settings page. Names the missing variable; never exposes values. */
export function aiConfigStatus(cfg: AiConfig): { configured: boolean; provider: string; model: string; missing?: string } {
  if (!cfg.key) return { configured: false, provider: cfg.provider, model: cfg.model, missing: cfg.keyVar };
  return { configured: true, provider: cfg.provider, model: cfg.model };
}

export const aiItemSchema = z
  .object({
    competency_id: z.string().uuid(),
    recommendation_type: z.enum(["course", "learning_path", "training"]),
    resource_id: z.string().uuid(),
    rationale: z.string().min(3).max(4000),
    expected_outcome: z.string().max(4000).optional(),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
  })
  .strict();

export const aiResponseSchema = z.object({ recommendations: z.array(aiItemSchema).max(20) }).strict();
export type AiItem = z.infer<typeof aiItemSchema>;

interface AiContext {
  employee: { id: string; name: string; position: string; department: string };
  gaps: {
    competency_id: string;
    competency: string;
    required_level: number;
    current_level: number | null;
    gap: number;
    is_mandatory: boolean;
    is_safety_critical: boolean;
  }[];
  resources: { type: string; id: string; title: string; summary: string; competency_id: string }[];
}

function buildPrompt(ctx: AiContext): string {
  return [
    "You are an HR development advisor for a freight and logistics organization.",
    "Suggest learning resources for the employee's validated competency gaps.",
    "Rules: use ONLY resource IDs from the supplied resource list; one recommendation per gap at most;",
    "prefer mandatory and safety-critical gaps; recommendation_type must match the resource's type.",
    "Employee: " + JSON.stringify(ctx.employee),
    "Gaps: " + JSON.stringify(ctx.gaps),
    "Available resources: " + JSON.stringify(ctx.resources),
  ].join("\n");
}

const RECS_JSON_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          competency_id: { type: "string" },
          recommendation_type: { type: "string", enum: ["course", "learning_path", "training"] },
          resource_id: { type: "string" },
          rationale: { type: "string" },
          expected_outcome: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["competency_id", "recommendation_type", "resource_id", "rationale", "expected_outcome", "priority"],
        additionalProperties: false,
      },
    },
  },
  required: ["recommendations"],
  additionalProperties: false,
} as const;

/** Read a streaming SSE response server-side and return the accumulated output text. */
async function consumeSse(res: Response): Promise<string> {
  if (!res.body) throw new Error("empty response");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as { type?: string; delta?: string };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") text += evt.delta;
      } catch {
        // incomplete frame; keep buffering
      }
    }
  }
  return text;
}

async function callLovableGateway(cfg: AiConfig, prompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.key}`,
      "Lovable-API-Key": cfg.key as string,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: cfg.model,
      stream: true,
      store: false,
      input: [{ role: "user", content: prompt }],
      text: { format: { type: "json_schema", name: "development_recommendations", strict: true, schema: RECS_JSON_SCHEMA } },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const safe = body.slice(0, 200).replace(/[a-zA-Z0-9_-]{20,}/g, "[redacted]");
    throw new Error(`AI gateway returned ${res.status}: ${safe}`);
  }
  return consumeSse(res);
}

async function callGemini(cfg: AiConfig, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.key as string },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: RECS_JSON_SCHEMA },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

export interface AiRunResult {
  items: AiItem[];
  rejectedUnknown: number;
  model: string;
  latencyMs: number;
}

/**
 * Generate recommendations for the given context. Throws on provider errors;
 * invalid or unparseable output throws with status "invalid". Resource IDs not
 * present in the supplied context are discarded, never saved.
 */
export async function runRecommendationCall(cfg: AiConfig, ctx: AiContext): Promise<AiRunResult> {
  const started = Date.now();
  const prompt = buildPrompt(ctx);
  const raw = cfg.provider === "gemini" ? await callGemini(cfg, prompt) : await callLovableGateway(cfg, prompt);
  const latencyMs = Date.now() - started;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("INVALID_OUTPUT: the AI response was not valid JSON");
  }
  const checked = aiResponseSchema.safeParse(parsed);
  if (!checked.success) throw new Error("INVALID_OUTPUT: the AI response did not match the required structure");
  const known = new Set(ctx.resources.map((r) => r.id));
  const valid: AiItem[] = [];
  let rejectedUnknown = 0;
  for (const item of checked.data.recommendations) {
    if (known.has(item.resource_id)) valid.push(item);
    else rejectedUnknown += 1;
  }
  return { items: valid, rejectedUnknown, model: cfg.model, latencyMs };
}
