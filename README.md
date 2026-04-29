# ocgbot-core

A 500-line minimum-viable multi-agent system in TypeScript.

Built by **OCGBOT Lab** — a research blog about agent systems built for actual use, not demos.

---

## What this is

A self-contained reference implementation of the agent pattern OCGBOT Lab runs in production. Everything fits in five files:

```
src/
├── types.ts          (~50 lines)  agent + context interfaces
├── registry.ts       (~80 lines)  4 example agent protocols
├── builder.ts        (~100 lines) DB → context assembly
├── ollama.ts         (~80 lines)  LLM caller with VRAM-safe num_ctx
└── index.ts          (~40 lines)  public surface

scripts/
├── demo.ts           (~50 lines)  CLI: ask a question, get an answer
└── seed-db.ts        (~80 lines)  SQLite schema + sample data
```

Total: under 500 lines, no framework, single dependency (`node:sqlite`).

---

## What this is NOT

- A production agent system (use OCGBOT Lab's commercial offerings for that).
- A framework (no plugins, no DSL, no config files).
- A LangChain replacement (not abstracted enough).
- A LLM training repo (this is the *runtime* layer).

---

## Reading guide

If you want to **understand the pattern**, read in this order:
1. `src/types.ts` — what an agent is, structurally.
2. `src/registry.ts` — concrete examples (4 agents).
3. `src/builder.ts` — how agents pull context from a DB.
4. `src/ollama.ts` — how an LLM call is made.
5. `scripts/demo.ts` — putting it together.

If you want to **run it**, jump to "Quick start" below.

If you want to **steal ideas**, the most useful pieces are:
- The `ContextSource` interface (`types.ts`) — declarative DB-to-prompt adapters.
- The `num_ctx` per-request override (`ollama.ts`) — VRAM-safe context windows.
- The `assemblePrompt` function (`builder.ts`) — section-based prompt structure.

---

## Quick start

```bash
# Requirements: Node 22+, Ollama running locally (or remote, see env)
npm install
npm run seed                    # build SQLite + sample data
npm run demo "what habits do I have?"
```

Expected output:

```
[ocgbot-core] agent=rutin
[ocgbot-core] sections=2, tokens=312
[ocgbot-core] llm=llama3.1:latest, latency=450ms

You have 3 active habits:
- Drink 2L water (daily)
- Read 30 min (daily)
- Workout (3x/week)
```

---

## Architecture (in 60 seconds)

A user asks a question. The system picks an agent (`rutin`, `fitness`, `nutrition`, `learning`). The agent has a **protocol** that says: "Pull these tables from the DB, format each row this way, ground the response in semantic search of these collections." The builder assembles the context. The Ollama caller runs the LLM. The user gets an answer.

The DB stays read-mostly. The protocol stays declarative. The LLM call stays stateless. No magic, no framework lock-in.

---

## Differences from OCGBOT production

This repo is a **distillation**, not a copy. Specifically removed for public:

- 22-agent registry → 4 agents (showcase only).
- 30+ DB tables → 5 tables (illustrative).
- ChromaDB RAG layer → omitted (semantic search out of scope here).
- Audit log + safety scan + brand voice → omitted (orthogonal concerns).
- Cron jobs, webhooks, admin endpoints → omitted (operational).

What's **intact**: protocol structure, context builder, Ollama caller with VRAM-safe defaults. Those three are the load-bearing pieces.

---

## License

MIT.

## Maintained by

OCGBOT Lab. We publish on Substack about agent systems built for production use.

No support guarantees. PRs welcome but lightly reviewed.
