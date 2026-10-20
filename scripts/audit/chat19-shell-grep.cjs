#!/usr/bin/env node
"use strict";
/**
 * Lane chat-19 / checklist B3+B4, read-only complete-checkout grep ledger.
 *
 * Usage (from any cwd within the repo, after fetching this branch):
 *   node scripts/audit/chat19-shell-grep.cjs
 *   node scripts/audit/chat19-shell-grep.cjs --markdown
 *
 * This script only invokes git grep and rev-parse. No app, build, tests or
 * CI are run. Do not tick B3/B4 from source-only results: the owner also
 * requires legacy value comparison and responsive visual verification.
 */
const { execFileSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "../..");
if (!existsSync(resolve(root, ".git"))) {
  throw new Error("Run in a checked-out lms-vnext Git worktree");
}
const usage = "Usage: node scripts/audit/chat19-shell-grep.cjs [--json|--markdown]";
const option = process.argv[2] || "--json";
if (!["--json", "--markdown"].includes(option) || process.argv.length > 3) {
  throw new Error(usage);
}

const rules = [
  {
    label: "sidebar-class-coverage",
    regex: "lms-desktop-sidebar|fl-d-panel-l|lms-sidebar-item",
    paths: ["src"],
  },
  {
    label: "shell-and-tpo-overlay-coverage",
    regex: 'role="(dialog|alertdialog)"|fixed inset-0|fixed inset-x-0 bottom-0',
    paths: ["src/components/shell", "src/components/tpo"],
  },
  {
    label: "route-progress-coverage",
    regex: "progress|nprogress|pageSlideIn|is-route-transitioning|data-route-transitioning",
    paths: ["src/components/shell", "src/app"],
  },
  {
    label: "raw-control-coverage",
    regex: "<(button|select|input|textarea)([[:space:]>])",
    paths: ["src/components/shell", "src/components/tpo"],
  },
  {
    label: "shell-hardcoded-visuals",
    regex: "#[[:xdigit:]]{3,8}|rounded-(lg|xl|md)",
    paths: ["src/components/shell"],
  },
  {
    // The running old LMS has no 3px route strip. This strict negative
    // ledger keeps a future shell edit from bringing that decoration back.
    label: "nonlegacy-top-strip-regressions",
    regex: 'lms-route-progress-segment|className="lms-route-progress"|role="progressbar"',
    paths: ["src/components/shell"],
  },
  {
    label: "duplicate-sidebar-and-mobile-footer",
    regex: "lms-desktop-sidebar|lms-legacy-mobile-footer|lms-tpo-mobile-footer|ln-footer",
    paths: ["src"],
  },
];

function commandFor(rule, ext) {
  // Git glob pathspecs work recursively and include root-level files too.
  // Filter extensions at git level, never by substring on the printed lines.
  return ["grep", "-n", "-I", "-E", rule.regex, "--",
    ...rule.paths.map(path => `:(glob)${path}/**/*.${ext}`)];
}

function runGrep(args) {
  try {
    return execFileSync("git", args, {
      cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    }).split("\n").filter(Boolean);
  } catch (error) {
    // git grep exit 1 means exactly zero matches. Exit 128 (bad pathspec,
    // missing worktree, or other Git failure) must never be counted as zero.
    if (error.status === 1) return [];
    throw error;
  }
}

function parseMatch(line) {
  const match = /^([^:]+):(\d+):(.*)$/.exec(line);
  if (!match) throw new Error(`Unexpected git grep -n output: ${line}`);
  return { path: match[1], line: Number(match[2]), snippet: match[3] };
}

function search(rule) {
  const commands = ["tsx", "ts", "css"].map(ext => commandFor(rule, ext));
  const matches = commands.flatMap(args => runGrep(args)).map(parseMatch);
  const paths = [...new Set(matches.map(match => match.path))].sort();
  return {
    rule: rule.label,
    commands: commands.map(args => "git " + args.map(arg => JSON.stringify(arg)).join(" ")),
    lineCount: matches.length,
    fileCount: paths.length,
    files: paths,
    shellLineCount: matches.filter(match => match.path.startsWith("src/components/shell/")).length,
    tpoLineCount: matches.filter(match => match.path.startsWith("src/components/tpo/")).length,
    // Preserve precise file:line output so the audit can write exemptions
    // for legitimate legacy SCSS colours or other owner-lane components.
    matches: matches.map(match => `${match.path}:${match.line}:${match.snippet}`),
  };
}

const result = {
  head: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root, encoding: "utf8",
  }).trim(),
  note: "Read-only repository-wide source ledger; browser and legacy parity not certified",
  results: rules.map(search),
};
if (option === "--json") {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} else {
  const lines = [
    "# Chat-19 B3/B4 grep proof",
    "",
    `Commit: \`${result.head}\``,
    "",
    "| Scope / expression | Lines | Files | Shell lines | TPO lines |",
    "|---|---:|---:|---:|---:|",
    ...result.results.map(row =>
      `| \`${row.rule}\` | ${row.lineCount} | ${row.fileCount} | ${row.shellLineCount} | ${row.tpoLineCount} |`),
    "",
  ];
  for (const row of result.results) {
    lines.push(`## ${row.rule}`, "", "Commands:", "```sh",
      ...row.commands, "```", "", "Matching file:line:source output:", "```text",
      ...(row.matches.length ? row.matches : ["(zero)"]), "```", "");
  }
  process.stdout.write(lines.join("\n") + "\n");
}
