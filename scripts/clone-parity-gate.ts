import fs from "node:fs";
import path from "node:path";
import { parseLearnerSurfaceLedger, parseLearnerFamilyVerification } from "./learner-surface-status";
import { parseParityMatrix } from "./parity-status";
import { buildPageChecklistReport } from "./page-parity-status";

function read(relativePath: string) {
  return fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8",
  );
}

const oracle = JSON.parse(
  read("docs/planning/parity-oracle.json"),
) as {
  legacyFrontend: { routeManifestFresh: boolean };
  releaseGate: {
    oracleFrozenForCutover: boolean;
    legacyDriftReviewed: boolean;
    allFamilyEvidenceVerified: boolean;
  };
};

const learner = parseLearnerSurfaceLedger(
  read("docs/planning/learner-ui-surface-ledger.md"),
);
const families = parseLearnerFamilyVerification(
  read("docs/planning/learner-family-verification.md"),
);
const matrix = parseParityMatrix(
  read("docs/planning/account-surface-parity.md"),
);
const parityDir = path.join(process.cwd(), "docs/parity");
const pages = buildPageChecklistReport(
  fs
    .readdirSync(parityDir)
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .map((file) => ({
      file,
      markdown: fs.readFileSync(
        path.join(parityDir, file),
        "utf8",
      ),
    })),
);

const blockers = [
  !oracle.releaseGate.oracleFrozenForCutover
    ? "cutover oracle is not frozen"
    : null,
  !oracle.legacyFrontend.routeManifestFresh
    ? "legacy route manifest is stale"
    : null,
  !oracle.releaseGate.legacyDriftReviewed
    ? "legacy drift has not been fully reviewed"
    : null,
  learner.unresolved > 0
    ? `Learner ledger has ${learner.unresolved} unresolved rows`
    : null,
  families.verified !== families.total
    ? `Learner family evidence is ${families.verified}/${families.total} VERIFIED`
    : null,
  matrix.unresolved > 0
    ? `master matrix has ${matrix.unresolved} unresolved rows`
    : null,
  pages.open > 0
    ? `detailed page specs have ${pages.open} open checks`
    : null,
].filter((value): value is string => Boolean(value));

const ready = blockers.length === 0;

process.stdout.write(
  [
    "LMS vNext clone-parity release gate",
    "",
    `READY: ${ready ? "YES" : "NO"}`,
    "",
    ...(ready
      ? ["No parity release blockers detected by the repository gate."]
      : [
          "Blockers:",
          ...blockers.map((blocker) => `- ${blocker}`),
        ]),
    "",
  ].join("\n"),
);

if (!ready) {
  process.exitCode = 1;
}
