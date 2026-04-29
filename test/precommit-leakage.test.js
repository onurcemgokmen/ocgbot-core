#!/usr/bin/env node
/**
 * Pre-commit brand leakage scan — runs before `git commit` (or in CI).
 *
 * Scans every text file in the repo for personal / Tier-0 identifiers and
 * blocks the commit if any are found. Protects this public showcase repo from
 * accidentally leaking personal-tier content from the parent production system.
 *
 * IMPORTANT: the denylist is NOT stored in this public repo. Publishing the
 * list of forbidden strings would itself leak them. The list is loaded from a
 * local, git-ignored source:
 *   - env var  LEAKAGE_DENYLIST  → path to a JSON array of strings, or
 *   - file     ./.leakage-denylist.json  (git-ignored)
 * If no local denylist is present the scan is a no-op, so public clones and CI
 * stay green without ever shipping the keywords.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DENYLIST_PATH = path.resolve(process.env.LEAKAGE_DENYLIST || path.join(ROOT, ".leakage-denylist.json"));

function loadDenylist() {
  try {
    const list = JSON.parse(fs.readFileSync(DENYLIST_PATH, "utf8"));
    return Array.isArray(list) ? list.filter((s) => typeof s === "string" && s.length > 0) : [];
  } catch {
    return []; // no local denylist → no-op (keywords are never published)
  }
}

function* walk(dir, ignoreDirs = ["node_modules", "dist", ".git"]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p, ignoreDirs);
    else yield p;
  }
}

const KEYWORDS = loadDenylist();

if (KEYWORDS.length === 0) {
  console.log("✓ Brand leakage scan: no local denylist (.leakage-denylist.json / $LEAKAGE_DENYLIST) — skipped.");
  process.exit(0);
}

const offenders = [];
for (const f of walk(ROOT)) {
  if (!/\.(ts|js|md|json|txt|sql)$/.test(f)) continue;
  // never scan the denylist file itself (legitimately holds keywords) or this scanner
  if (path.resolve(f) === DENYLIST_PATH || f.endsWith("precommit-leakage.test.js")) continue;
  let content;
  try { content = fs.readFileSync(f, "utf8"); } catch { continue; }
  for (const kw of KEYWORDS) {
    if (content.includes(kw)) offenders.push({ file: path.relative(ROOT, f), keyword: kw });
  }
}

if (offenders.length > 0) {
  console.error(`\n✗ BRAND LEAKAGE DETECTED — ${offenders.length} hit(s):\n`);
  for (const o of offenders) console.error(`  ${o.file}: "${o.keyword}"`);
  console.error(`\nThis repo (ocgbot-core public) must not contain Tier 0 personal identifiers.`);
  console.error(`Remove the offending strings before committing.\n`);
  process.exit(1);
}

console.log(`✓ Brand leakage scan: ${KEYWORDS.length} keywords checked, 0 hits across all files.`);
process.exit(0);
