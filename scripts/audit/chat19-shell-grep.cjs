#!/usr/bin/env node
"use strict";
/**
 * Lane 19: exact full-checkout grep ledger for checklist B3/B4.
 * Run from the repo root once the orchestrator has merged the lane.
 * This reports actual matches; it never ticks checklist items or edits files.
 */
const { execFileSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "../..");
if (!existsSync(resolve(root, ".git"))) throw new Error("Run in the checked-out lms-vnext repository");

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
];

function search(rule) {
  // Git pathspec glob braces are not portable, so issue one query per suffix.
  const matches = [];
  for (const ext of ["tsx", "ts", "css"]) {
    const byExt = ["grep", "-n", "-I", "-E", rule.regex, "--",
      ...rule.paths.map(path => `:(glob)${path}/**/*.${ext}`)];
    try {
      const output = execFileSync("git", byExt, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
      matches.push(...output.split("\n").filter(Boolean));
    } catch (error) {
      if (error.status !== 1) throw error;
    }
  }
  return {
    rule: rule.label,
    command: `git grep -n -I -E '${rule.regex}' -- ${rule.paths.join(" ")} [tsx,ts,css]`,
    lineCount: matches.length,
    fileCount: new Set(matches.map(line => line.split(":")[0])).size,
    matches,
  };
}

const results = rules.map(search);
process.stdout.write(JSON.stringify({ head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), results }, null, 2) + "\n");
