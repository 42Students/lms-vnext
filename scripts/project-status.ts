import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type ChecklistState =
  | "done"
  | "partial"
  | "open";

export type ChecklistItem = {
  section: string;
  state: ChecklistState;
  text: string;
};

export type SectionStatus = {
  section: string;
  done: number;
  partial: number;
  open: number;
  total: number;
  strictPercent: number;
  practicalPercent: number;
};

export type ProjectStatus = {
  done: number;
  partial: number;
  open: number;
  total: number;
  strictPercent: number;
  practicalPercent: number;
  sections: SectionStatus[];
  remaining: ChecklistItem[];
};

const executionStartPattern =
  /^# A\. Repository and foundation$/;
const executionEndPattern =
  /^# AE\. Rules for future ChatGPT sessions$/;
const sectionPattern =
  /^# ([A-Z]{1,2}\. .+)$/;
const itemPattern =
  /^\s*-\s+\[([xX~ ])\]\s+(.+)$/;

function percent(
  numerator: number,
  denominator: number,
) {
  if (denominator === 0) return 0;
  return Math.round(
    (numerator / denominator) *
      10_000,
  ) / 100;
}

function sectionStatus(
  section: string,
  items: readonly ChecklistItem[],
): SectionStatus {
  const done = items.filter(
    (item) => item.state === "done",
  ).length;
  const partial = items.filter(
    (item) => item.state === "partial",
  ).length;
  const open = items.filter(
    (item) => item.state === "open",
  ).length;
  const total = done + partial + open;

  return {
    section,
    done,
    partial,
    open,
    total,
    strictPercent:
      percent(done, total),
    practicalPercent: percent(
      done + partial * 0.5,
      total,
    ),
  };
}

export function parseExecutionChecklist(
  markdown: string,
): ProjectStatus {
  const items: ChecklistItem[] = [];
  let inExecutionScope = false;
  let currentSection = "";

  for (const line of markdown.split("\n")) {
    if (
      executionEndPattern.test(line)
    ) {
      break;
    }

    if (
      executionStartPattern.test(line)
    ) {
      inExecutionScope = true;
      currentSection =
        "A. Repository and foundation";
      continue;
    }

    if (!inExecutionScope) {
      continue;
    }

    const sectionMatch =
      line.match(sectionPattern);
    if (sectionMatch) {
      currentSection =
        sectionMatch[1] ?? currentSection;
      continue;
    }

    const itemMatch =
      line.match(itemPattern);
    if (!itemMatch || !currentSection) {
      continue;
    }

    const marker = itemMatch[1];
    items.push({
      section: currentSection,
      state:
        marker?.toLowerCase() === "x"
          ? "done"
          : marker === "~"
            ? "partial"
            : "open",
      text: itemMatch[2] ?? "",
    });
  }

  const sections = [
    ...new Set(
      items.map((item) => item.section),
    ),
  ].map((section) =>
    sectionStatus(
      section,
      items.filter(
        (item) =>
          item.section === section,
      ),
    ),
  );

  const overall = sectionStatus(
    "Overall",
    items,
  );

  return {
    done: overall.done,
    partial: overall.partial,
    open: overall.open,
    total: overall.total,
    strictPercent:
      overall.strictPercent,
    practicalPercent:
      overall.practicalPercent,
    sections,
    remaining: items.filter(
      (item) => item.state !== "done",
    ),
  };
}

function printText(
  status: ProjectStatus,
) {
  const output = [
    "LMS vNext execution status",
    "",
    `Done: ${status.done}`,
    `Partial: ${status.partial}`,
    `Open: ${status.open}`,
    `Total execution items: ${status.total}`,
    `Strict completion: ${status.strictPercent}%`,
    `Practical completion (partials = 50%): ${status.practicalPercent}%`,
    "",
    "By phase:",
    ...status.sections.map(
      (section) =>
        `- ${section.section}: ${section.done} done / ${section.partial} partial / ${section.open} open (${section.strictPercent}% strict)`,
    ),
    "",
    "Remaining:",
    ...status.remaining.map(
      (item) =>
        `- [${item.state}] ${item.section} — ${item.text}`,
    ),
  ];

  process.stdout.write(
    output.join("\n") + "\n",
  );
}

export function runProjectStatus() {
  const checklistPath = path.join(
    process.cwd(),
    "docs/planning/vnext-execution-checklist.md",
  );
  const status =
    parseExecutionChecklist(
      fs.readFileSync(
        checklistPath,
        "utf8",
      ),
    );

  if (
    process.argv.includes("--json")
  ) {
    process.stdout.write(
      JSON.stringify(
        status,
        null,
        2,
      ) + "\n",
    );
    return;
  }

  printText(status);
}

const invokedPath = process.argv[1];

if (
  invokedPath &&
  import.meta.url ===
    pathToFileURL(invokedPath).href
) {
  runProjectStatus();
}
