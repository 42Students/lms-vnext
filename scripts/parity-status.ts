import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PARITY_STATUSES = [
  "DONE",
  "PARTIAL",
  "MISSING",
  "VERIFY",
  "REDESIGNED",
  "RETIRED",
  "BLOCKED",
] as const;

export type ParityStatus =
  (typeof PARITY_STATUSES)[number];

export type ParityRow = {
  surface: string;
  status: ParityStatus;
  line: string;
};

export type ParityStatusReport = {
  total: number;
  resolved: number;
  unresolved: number;
  percentResolved: number;
  counts: Record<ParityStatus, number>;
  unresolvedRows: ParityRow[];
};

const statusSet =
  new Set<string>(PARITY_STATUSES);
const resolvedSet = new Set<ParityStatus>([
  "DONE",
  "REDESIGNED",
  "RETIRED",
]);

export function parseParityMatrix(
  markdown: string,
): ParityStatusReport {
  const rows: ParityRow[] = [];

  for (const line of markdown.split("\n")) {
    if (!line.trim().startsWith("|")) {
      continue;
    }

    const cells = line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());

    const rawStatus =
      cells.at(-1)?.toUpperCase();

    if (
      !rawStatus ||
      !statusSet.has(rawStatus)
    ) {
      continue;
    }

    rows.push({
      surface: cells[0] ?? "",
      status: rawStatus as ParityStatus,
      line,
    });
  }

  const counts = Object.fromEntries(
    PARITY_STATUSES.map((status) => [
      status,
      rows.filter(
        (row) => row.status === status,
      ).length,
    ]),
  ) as Record<ParityStatus, number>;

  const resolved = rows.filter((row) =>
    resolvedSet.has(row.status),
  ).length;
  const total = rows.length;

  return {
    total,
    resolved,
    unresolved: total - resolved,
    percentResolved:
      total === 0
        ? 0
        : Math.round(
            (resolved / total) * 10_000,
          ) / 100,
    counts,
    unresolvedRows: rows.filter(
      (row) =>
        !resolvedSet.has(row.status),
    ),
  };
}

export function runParityStatus() {
  const filePath = path.join(
    process.cwd(),
    "docs/planning/account-surface-parity.md",
  );
  const report = parseParityMatrix(
    fs.readFileSync(filePath, "utf8"),
  );

  if (process.argv.includes("--json")) {
    process.stdout.write(
      JSON.stringify(report, null, 2) +
        "\n",
    );
    return;
  }

  const lines = [
    "LMS vNext account-surface parity",
    "",
    `Resolved: ${report.resolved}/${report.total} (${report.percentResolved}%)`,
    `Unresolved: ${report.unresolved}`,
    "",
    ...PARITY_STATUSES.map(
      (status) =>
        `${status}: ${report.counts[status]}`,
    ),
    "",
    "Release blockers:",
    ...report.unresolvedRows.map(
      (row) =>
        `- [${row.status}] ${row.surface}`,
    ),
  ];

  process.stdout.write(
    lines.join("\n") + "\n",
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath &&
  import.meta.url ===
    pathToFileURL(invokedPath).href
) {
  runParityStatus();
}
