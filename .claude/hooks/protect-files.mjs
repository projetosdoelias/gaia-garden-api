#!/usr/bin/env node
/**
 * PreToolUse hook: block reads of secret files and edits of files Claude
 * must never change by hand. Exit 2 blocks the tool call and tells Claude why.
 *
 * Note: this covers the Read/Edit/Write/MultiEdit tools only, not Bash.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/** True when the file is committed in git (i.e. a migration that may already be applied). */
function isTrackedByGit(projectDir, rel) {
  const r = spawnSync("git", ["ls-files", "--error-unmatch", "--", rel], {
    cwd: projectDir,
    encoding: "utf8",
  });
  return r.status === 0;
}

/** @type {{ test: (rel: string, projectDir: string) => boolean, blockRead?: boolean, why: string }[]} */
const RULES = [
  {
    // .env, .env.local, .env.production... but NOT .env.example
    test: (rel) => /(^|\/)\.env(\.[^/]+)?$/.test(rel) && !rel.endsWith(".env.example"),
    blockRead: true,
    why: "Environment files hold secrets. Use .env.example for variable names and ask the user to change real values.",
  },
  {
    test: (rel) => rel.startsWith("src/generated/") || rel.startsWith("node_modules/") || rel.startsWith("dist/"),
    why: "Generated files. Change prisma/schema.prisma and run `npx prisma generate` instead.",
  },
  {
    // Committed migrations may already be applied somewhere. New, uncommitted ones
    // (e.g. created with `prisma migrate dev --create-only`) can still be edited.
    test: (rel, projectDir) => rel.startsWith("prisma/migrations/") && isTrackedByGit(projectDir, rel),
    why: "This migration is committed and may already be applied. Never edit applied migrations; create a new one.",
  },
  {
    test: (rel) => rel === ".github/workflows/deploy-gcp.yml" || rel === "deploy.sh",
    why: "Deploy pipeline. Only change it when the user explicitly asks.",
  },
  {
    test: (rel) => rel === "package-lock.json",
    why: "Lockfile is managed by npm. Ask the user before changing dependencies.",
  },
];

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const toolName = input?.tool_name;
const filePath = input?.tool_input?.file_path;
if (typeof filePath !== "string") process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const rel = path
  .relative(projectDir, path.resolve(projectDir, filePath))
  .split(path.sep)
  .join("/");
if (rel.startsWith("..")) process.exit(0);

const isRead = toolName === "Read";
for (const rule of RULES) {
  if (isRead && !rule.blockRead) continue;
  if (!rule.test(rel, projectDir)) continue;
  process.stderr.write(`Blocked ${toolName} on ${rel}: ${rule.why}\n`);
  process.exit(2);
}

process.exit(0);
