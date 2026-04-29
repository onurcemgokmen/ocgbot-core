/**
 * ocgbot-core public surface.
 *
 * Three load-bearing pieces:
 *   - REGISTRY            : the four example agents
 *   - buildAgentContext   : DB → prompt
 *   - callOllama          : prompt → LLM response
 *
 * Use them composed (see scripts/demo.ts) or independently.
 */

export type {
  ContextSource,
  AgentProtocol,
  BuiltContext,
  OllamaResponse,
  CallOptions,
} from "./types";

export {
  REGISTRY,
  RUTIN_AGENT,
  FITNESS_AGENT,
  NUTRITION_AGENT,
  LEARNING_AGENT,
} from "./registry";

export { buildAgentContext } from "./builder";
export { callOllama } from "./ollama";
