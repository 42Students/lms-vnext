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

export const LEARNER_FAMILY_STATUSES = [
  "UNVERIFIED",
  "IN_PROGRESS",
  "VERIFIED",
  "STALE",
  "BLOCKED",
] as const;

export type LearnerSurfaceStatus =
  (typeof LEARNER_SURFACE_STATUSES)[number];
export type LearnerFamilyStatus =
  (typeof LEARNER_FAMILY_STATUSES)[number];

const statusSet = new Set<string>(
  LEARNER_SURFACE_STATUSES,
);
const familyStatusSet = new Set<string>(
  LEARNER_FAMILY_STATUSES,
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

export function parseLearnerFamilyVerification(
  markdown: string,
) {
  const rows: Array<{
    family: string;
    scope: string;
    status: LearnerFamilyStatus;
  }> = [];

  for (const line of markdown.split("\n")) {
    if (!/^\| L\d+ \|/.test(line.trim())) continue;
    const cells = line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    const status = cells[2]?.toUpperCase();
    if (!status || !familyStatusSet.has(status)) continue;
    rows.push({
      family: cells[0] ?? "",
      scope: cells[1] ?? "",
      status: status as LearnerFamilyStatus,
    });
  }

  const counts = Object.fromEntries(
    LEARNER_FAMILY_STATUSES.map((status) => [
      status,
      rows.filter((row) => row.status === status)
        .length,
    ]),
  ) as Record<LearnerFamilyStatus, number>;

  return {
    total: rows.length,
    verified: rows.filter((row) => row.status === "VERIFIED").length,
    counts,
    next:
      rows.find((row) => row.status !== "VERIFIED") ?? null,
    rows,
  };
}

export function runLearnerSurfaceStatus() {
  const ledgerPath = path.join(
    process.cwd(),
    "docs/planning/learner-ui-surface-ledger.md",
  );
  const familyPath = path.join(
    process.cwd(),
    "docs/planning/learner-family-verification.md",
  );
  const report = parseLearnerSurfaceLedger(
    fs.readFileSync(ledgerPath, "utf8"),
  );
  const families = parseLearnerFamilyVerification(
    fs.readFileSync(familyPath, "utf8"),
  );
  const releaseReady =
    report.unresolved === 0 &&
    families.total > 0 &&
    families.verified === families.total;

  const payload = {
    ...report,
    familyVerification: families,
    releaseReady,
  };

  if (process.argv.includes("--json")) {
    process.stdout.write(
      JSON.stringify(payload, null, 2) + "\n",
    );
    return;
  }

  process.stdout.write(
    [
      "LMS vNext Learner UI surface parity",
      "",
      `Surface rows resolved: ${report.resolved}/${report.total} (${report.percentResolved}%)`,
      `Surface rows unresolved: ${report.unresolved}`,
      "",
      ...LEARNER_SURFACE_STATUSES.map(
        (status) =>
          `${status}: ${report.counts[status]}`,
      ),
      "",
      `Families VERIFIED: ${families.verified}/${families.total}`,
      ...LEARNER_FAMILY_STATUSES.map(
        (status) =>
          `Family ${status}: ${families.counts[status]}`,
      ),
      "",
      `Release-ready Learner parity: ${releaseReady ? "YES" : "NO"}`,
      report.next
        ? `Next surface: ${report.next.id} — ${report.next.surface} [${report.next.status}]`
        : "Next surface: all ledger rows resolved",
      families.next
        ? `Next family evidence: ${families.next.family} — ${families.next.scope} [${families.next.status}]`
        : "Next family evidence: all families VERIFIED",
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
