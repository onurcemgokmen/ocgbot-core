/**
 * CLI demo: ask a question, route to an agent, get an LLM-grounded answer.
 *
 * Usage:
 *   npm run demo "what habits do I have?"           -> defaults to rutin agent
 *   npm run demo --agent=fitness "recent workouts?"
 *   npm run demo --agent=nutrition "any abnormal labs?"
 */
import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";
import { buildAgentContext } from "../src/builder";
import { callOllama } from "../src/ollama";

const DB_PATH = process.env.OCGBOT_CORE_DB || path.resolve(__dirname, "..", "ocgbot-core.db");
const argv = process.argv.slice(2);
const agentArg = argv.find(a => a.startsWith("--agent="));
const agentId = agentArg ? agentArg.split("=")[1] : "rutin";
const question = argv.filter(a => !a.startsWith("--")).join(" ").trim() || "What habits do I have?";

(async () => {
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  const ctx = buildAgentContext(agentId, question, db);

  console.log(`[ocgbot-core] agent=${agentId}`);
  console.log(`[ocgbot-core] sections=${ctx.sections.length}, tokens≈${ctx.tokenEstimate}`);

  const response = await callOllama(
    ctx.systemPrompt,
    question,
    process.env.OLLAMA_MODEL || "llama3.1:latest",
    process.env.OLLAMA_URL || "http://localhost:11434",
    60_000,
    { numCtx: 4096, tokensOut: 600 }
  );

  console.log(`[ocgbot-core] llm=${response.model}, latency=${response.duration_ms}ms${response.error ? ", error=" + response.error : ""}`);
  console.log("\n" + (response.content || "(no content — is Ollama running?)"));
  process.exit(0);
})();
