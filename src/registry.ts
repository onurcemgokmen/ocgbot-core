import type { AgentProtocol } from "./types";

/**
 * Four example agents demonstrating the protocol pattern.
 * Each pulls from a different table; each formats rows differently.
 */
export const RUTIN_AGENT: AgentProtocol = {
  agentId: "rutin",
  description: "Daily routines and active habits.",
  sources: [{
    id: "active_habits", table: "habits", label: "Active Habits",
    selectCols: "name, frequency, category", where: "active=1",
    orderBy: "created_at DESC", limit: 10,
    formatter: r => `- ${r.name} (${r.frequency}) [${r.category || "general"}]`,
  }],
  maxContextTokens: 1500,
};

export const FITNESS_AGENT: AgentProtocol = {
  agentId: "fitness",
  description: "Workouts, training history, fitness goals.",
  sources: [{
    id: "recent_workouts", table: "workouts", label: "Recent Workouts",
    selectCols: "date, type, duration_min, notes",
    orderBy: "date DESC", limit: 5,
    formatter: r => `- ${r.date}: ${r.type} (${r.duration_min} min)${r.notes ? " — " + r.notes : ""}`,
  }],
  maxContextTokens: 1500,
};

export const NUTRITION_AGENT: AgentProtocol = {
  agentId: "nutrition",
  description: "Food, supplements, lab values.",
  sources: [
    {
      id: "supplements", table: "habits", label: "Supplements",
      selectCols: "name, frequency",
      where: "active=1 AND (name LIKE '%vitamin%' OR name LIKE '%omega%' OR name LIKE '%magnesium%')",
      limit: 5,
      formatter: r => `- ${r.name} (${r.frequency})`,
    },
    {
      id: "lab_values", table: "lab_results", label: "Recent Lab Values",
      selectCols: "metric, value, unit, date, abnormal",
      orderBy: "date DESC", limit: 6,
      formatter: r => `- ${r.metric}: ${r.value}${r.unit || ""}${r.abnormal ? " ⚠️" : ""} (${r.date})`,
    },
  ],
  maxContextTokens: 2000,
};

export const LEARNING_AGENT: AgentProtocol = {
  agentId: "learning",
  description: "Goals, study notes, books in progress.",
  sources: [{
    id: "goals", table: "goals", label: "Active Goals",
    selectCols: "title, progress_pct, deadline",
    where: "status != 'completed'", limit: 5,
    formatter: r => `- ${r.title}: ${r.progress_pct || 0}% (deadline: ${r.deadline || "open"})`,
  }],
  maxContextTokens: 1500,
};

export const REGISTRY: Record<string, AgentProtocol> = {
  rutin: RUTIN_AGENT,
  fitness: FITNESS_AGENT,
  nutrition: NUTRITION_AGENT,
  learning: LEARNING_AGENT,
};
