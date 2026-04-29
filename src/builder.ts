import type { DatabaseSync } from "node:sqlite";
import type { AgentProtocol, BuiltContext } from "./types";
import { REGISTRY } from "./registry";

/**
 * Pull an agent's context from the DB and assemble it into a system prompt.
 * Pure function over DB state — no side effects, no LLM call here.
 */
export function buildAgentContext(
  agentId: string,
  userMessage: string,
  db: DatabaseSync
): BuiltContext {
  const protocol: AgentProtocol = REGISTRY[agentId] || REGISTRY["rutin"];
  const sections: { label: string; content: string }[] = [];

  for (const source of protocol.sources) {
    try {
      // Defensive: skip silently if table missing
      const tableExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(source.table) as { name: string } | undefined;
      if (!tableExists) continue;

      let sql = `SELECT ${source.selectCols} FROM ${source.table}`;
      if (source.where) sql += ` WHERE ${source.where}`;
      if (source.orderBy) sql += ` ORDER BY ${source.orderBy}`;
      sql += ` LIMIT ${source.limit}`;

      const rows = db.prepare(sql).all() as Record<string, unknown>[];
      if (rows.length === 0) continue;

      const formatted = rows.map(r => {
        try { return source.formatter(r); }
        catch { return `- ${JSON.stringify(r).slice(0, 80)}`; }
      }).join("\n");
      sections.push({ label: source.label, content: formatted });
    } catch {
      // Silent skip — read-mostly is the contract
    }
  }

  const systemPrompt = assemblePrompt(agentId, sections, userMessage);
  return {
    agentId,
    sections,
    systemPrompt,
    tokenEstimate: Math.ceil(systemPrompt.length / 4), // rough char-to-token
  };
}

/**
 * Section-based prompt structure. Each section is labeled + formatted.
 * The user question goes last so the LLM treats prior content as context.
 */
function assemblePrompt(
  agentId: string,
  sections: { label: string; content: string }[],
  userMessage: string
): string {
  const parts: string[] = [];
  parts.push(`You are the "${agentId}" agent in a personal assistant system.`);
  parts.push(`Below is the user's current data. Ground your answer in this data.\n`);
  if (sections.length > 0) {
    parts.push(`## Current Data`);
    for (const s of sections) {
      parts.push(`\n### ${s.label}\n${s.content}`);
    }
    parts.push("");
  }
  parts.push(`## User Question\n${userMessage}`);
  parts.push(`\nGive a concise, data-grounded answer. If the data doesn't support an answer, say so.`);
  return parts.join("\n");
}
