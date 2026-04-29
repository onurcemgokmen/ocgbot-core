import type { CallOptions, OllamaResponse } from "./types";

/**
 * VRAM-safe LLM caller.
 * - num_ctx >= 2048 honored, else modelfile default (avoids dev-accident zeros).
 * - keep_alive=10m: model stays in VRAM between calls (cuts cold-start).
 * - timeout configurable; fail-open returns {error} instead of throwing.
 */
export async function callOllama(
  systemPrompt: string,
  userMessage: string,
  model = "llama3.1:latest",
  baseUrl = "http://localhost:11434",
  timeoutMs = 60_000,
  opts: CallOptions = {}
): Promise<OllamaResponse> {
  const t0 = Date.now();

  const options: Record<string, number> = {
    temperature: opts.temperature ?? 0.7,
    num_predict: opts.tokensOut ?? 800,
  };
  if (typeof opts.numCtx === "number" && opts.numCtx >= 2048) {
    options.num_ctx = opts.numCtx;
  }

  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: false,
    keep_alive: "10m",
    options,
  };

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      return { content: "", model, duration_ms: Date.now() - t0, error: `HTTP ${res.status}` };
    }

    const data = await res.json() as {
      message?: { content: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      content: (data.message?.content || "").trim(),
      model,
      duration_ms: Date.now() - t0,
      tokens_in: data.prompt_eval_count,
      tokens_out: data.eval_count,
    };
  } catch (e) {
    return {
      content: "",
      model,
      duration_ms: Date.now() - t0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
