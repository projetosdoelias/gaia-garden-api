#!/usr/bin/env node
/**
 * PostToolUse hook: run ESLint (--fix) on the file Claude just edited.
 *
 * - Exit 0: clean (or file not lintable) -> Claude continues.
 * - Exit 2: lint errors remain -> stderr is fed back to Claude so it fixes them.
 * - ESLint crash/timeout never blocks Claude (exit 0 with a note).
 *
 * Input: hook JSON on stdin ({ tool_name, tool_input: { file_path }, cwd, ... }).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const LINTABLE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const IGNORED = [
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)dist\//,
  /(^|\/)src\/generated\//,
  /(^|\/)\.claude\//,
];

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path;
if (typeof filePath !== "string" || !LINTABLE.test(filePath)) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const absPath = path.resolve(projectDir, filePath);
const rel = path.relative(projectDir, absPath).split(path.sep).join("/");

if (rel.startsWith("..") || IGNORED.some((r) => r.test(rel)) || !existsSync(absPath)) {
  process.exit(0);
}

const eslintBin = path.join(
  projectDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "eslint.cmd" : "eslint",
);
if (!existsSync(eslintBin)) process.exit(0);

const result = spawnSync(eslintBin, ["--fix", "--no-warn-ignored", rel], {
  cwd: projectDir,
  encoding: "utf8",
  timeout: 55_000,
});

if (result.status === 0) process.exit(0);

if (result.status === 1) {
  process.stderr.write(
    `ESLint found problems in ${rel} that --fix could not resolve. Fix them before continuing:\n` +
      `${result.stdout ?? ""}${result.stderr ?? ""}`,
  );
  process.exit(2);
}

// status 2 = ESLint config error/crash, null = timeout. Inform, don't block.
process.stderr.write(`ESLint could not run on ${rel} (exit ${result.status}). ${result.stderr ?? ""}\n`);
process.exit(0);
