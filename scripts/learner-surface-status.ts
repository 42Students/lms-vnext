import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const LEARNER_SURFACE_STATUSES = [
  "UNCHECKED",
  "AUDITING",
  "GAP",
  "FIXED",
  "CLOSED",
  "BLOCKED",
  "REDESIGNED",
  "RETIRED",
] as const;

export type LearnerSurfaceStatus =
  (typeof LEARNER_SURFACE_STATUSES)[number];

const statusSet = new Set<string>(
  LEARNER_SURFACE_STATUSES,
);
const resolvedSet = new Set<LearnerSurfaceStatus>([
  "CLOSED",
  "REDESIGNED",
  "RETIRED",
]);

export function parseLearnerSurfaceLedger(
  markdown: string,
) {
  const rows: Array<{
    id: string;
    surface: string;
    status: LearnerSurfaceStatus;
  }> = [];

  for (const line of markdown.split("\n")) {
    if (!line.trim().startsWith("| L")) continue;
    const cells = line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());

    const rawStatus = cells.at(-1)?.toUpperCase();
    if (!rawStatus || !statusSet.has(rawStatus)) {
      continue;
    }

    rows.push({
      id: cells[0] ?? "",
      surface: cells[1] ?? "",
      status: rawStatus as LearnerSurfaceStatus,
    });
  }

  const counts = Object.fromEntries(
    LEARNER_SURFACE_STATUSES.map((status) => [
      status,
      rows.filter((row) => row.status === status)
        .length,
    ]),
  ) as Record<LearnerSurfaceStatus, number>;
  const resolved = rows.filter((row) =>
    resolvedSet.has(row.status),
  ).length;

  return {
    total: rows.length,
    resolved,
    unresolved: rows.length - resolved,
    percentResolved:
      rows.length === 0
        ? 0
        : Math.round(
            (resolved / rows.length) * 10_000,
          ) / 100,
    counts,
    next:
      rows.find(
        (row) => !resolvedSet.has(row.status),
      ) ?? null,
    rows,
  };
}

export function runLearnerSurfaceStatus() {
  const filePath = path.join(
    process.cwd(),
    "docs/planning/learner-ui-surface-ledger.md",
  );
  const report = parseLearnerSurfaceLedger(
    fs.readFileSync(filePath, "utf8"),
  );

  if (process.argv.includes("--json")) {
    process.stdout.write(
      JSON.stringify(report, null, 2) + "\n",
    );
    return;
  }

  process.stdout.write(
    [
      "LMS vNext Learner UI surface parity",
      "",
      `Resolved: ${report.resolved}/${report.total} (${report.percentResolved}%)`,
      `Unresolved: ${report.unresolved}`,
      "",
      ...LEARNER_SURFACE_STATUSES.map(
        (status) =>
          `${status}: ${report.counts[status]}`,
      ),
      "",
      report.next
        ? `Next: ${report.next.id} — ${report.next.surface} [${report.next.status}]`
        : "Next: Learner surface ledger resolved",
      "",
    ].join("\n"),
  );
}

const invoked = process.argv[1];
if (
  invoked &&
  import.meta.url === pathToFileURL(invoked).href
) {
  runLearnerSurfaceStatus();
}
