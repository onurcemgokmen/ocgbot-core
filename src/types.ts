/** Single source of facts: how do you turn a DB row into a prompt fragment? */
export interface ContextSource {
  id: string;
  table: string;
  label: string;
  selectCols: string;
  where?: string;
  orderBy?: string;
  limit: number;
  formatter: (row: Record<string, unknown>) => string;
}

/** An agent is a name + an ordered list of context sources. */
export interface AgentProtocol {
  agentId: string;
  description: string;
  sources: ContextSource[];
  maxContextTokens: number;
}

/** Output of context-build phase, fed to the LLM. */
export interface BuiltContext {
  agentId: string;
  sections: { label: string; content: string }[];
  systemPrompt: string;
  tokenEstimate: number;
}

/** LLM response, with bookkeeping for audit/observability. */
export interface OllamaResponse {
  content: string;
  model: string;
  duration_ms: number;
  tokens_in?: number;
  tokens_out?: number;
  error?: string;
}

/** Per-request LLM tuning. num_ctx >= 2048 honored, else modelfile default. */
export interface CallOptions {
  numCtx?: number;
  tokensOut?: number;
  temperature?: number;
}
