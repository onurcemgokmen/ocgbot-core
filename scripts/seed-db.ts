/**
 * Seed an example SQLite DB with five tables.
 * Run: npm run seed
 */
import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";

const DB_PATH = process.env.OCGBOT_CORE_DB || path.resolve(__dirname, "..", "ocgbot-core.db");
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    frequency TEXT,
    category TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT,
    duration_min INTEGER,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric TEXT,
    value REAL,
    unit TEXT,
    date TEXT,
    abnormal INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    progress_pct INTEGER DEFAULT 0,
    deadline TEXT,
    status TEXT DEFAULT 'active'
  );
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Sample data
const insertH = db.prepare("INSERT INTO habits (name, frequency, category) VALUES (?, ?, ?)");
[
  ["Drink 2L water", "daily", "health"],
  ["Read 30 min", "daily", "learning"],
  ["Workout", "3x/week", "fitness"],
  ["Vitamin D3", "daily", "supplement"],
  ["Omega-3 2g", "daily", "supplement"],
  ["Magnesium 300mg", "daily", "supplement"],
].forEach(([n, f, c]) => insertH.run(n, f, c));

const insertW = db.prepare("INSERT INTO workouts (date, type, duration_min, notes) VALUES (?, ?, ?, ?)");
[
  ["2026-04-25", "Zone 2 walk", 45, "easy pace"],
  ["2026-04-23", "Strength", 60, "upper body"],
  ["2026-04-21", "Zone 2 walk", 50, null],
].forEach(([d, t, m, n]) => insertW.run(d, t, m, n));

const insertL = db.prepare("INSERT INTO lab_results (metric, value, unit, date, abnormal) VALUES (?, ?, ?, ?, ?)");
[
  ["TRG", 145, "mg/dL", "2026-04-15", 0],
  ["HDL", 48, "mg/dL", "2026-04-15", 0],
  ["LDL", 110, "mg/dL", "2026-04-15", 0],
].forEach(([m, v, u, d, a]) => insertL.run(m, v, u, d, a));

const insertG = db.prepare("INSERT INTO goals (title, progress_pct, deadline) VALUES (?, ?, ?)");
[
  ["Run a half-marathon", 35, "2026-Q4"],
  ["Read 24 books in 2026", 50, "2026-12-31"],
].forEach(([t, p, d]) => insertG.run(t, p, d));

console.log(`Seeded ${DB_PATH}`);
console.log(`  habits: ${db.prepare("SELECT COUNT(*) AS n FROM habits").get().n}`);
console.log(`  workouts: ${db.prepare("SELECT COUNT(*) AS n FROM workouts").get().n}`);
console.log(`  lab_results: ${db.prepare("SELECT COUNT(*) AS n FROM lab_results").get().n}`);
console.log(`  goals: ${db.prepare("SELECT COUNT(*) AS n FROM goals").get().n}`);
