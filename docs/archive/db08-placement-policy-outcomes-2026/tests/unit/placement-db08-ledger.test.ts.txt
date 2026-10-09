import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readJson = (name: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), "docs/planning", name), "utf8")) as {
    tables: Array<{
      table?: string;
      legacyTable?: string;
      rows?: Array<{ legacyColumn: string }>;
      fields?: Array<{
        legacyField: string;
        status: string;
        reviewedVnextMapping: string | null;
        validationEvidence: string | null;
      }>;
    }>;
    counters?: Record<string, number>;
  };

const source = readJson(
  "db-pass4-columns-db08_placement_policy_and_outcomes.json",
);
const tracker = readJson("database-parity-db08-parallel-tracker.json");

const validStates = new Set([
  "UNMAPPED",
  "MAPPED",
  "IMPLEMENTED",
  "DB_TESTED",
  "WORKFLOW_VERIFIED",
  "BLOCKED",
  "REDESIGNED",
  "RETIRED",
]);

describe("DB08 independent parity tracker", () => {
  it("covers every legacy candidate table and field without omission or duplication", () => {
    const sourceTables = source.tables.map((item) => item.table);
    const trackedTables = tracker.tables.map((item) => item.legacyTable);

    expect(new Set(sourceTables).size).toBe(sourceTables.length);
    expect(new Set(trackedTables).size).toBe(trackedTables.length);
    expect(trackedTables).toEqual(sourceTables);

    for (const original of source.tables) {
      const audited = tracker.tables.find(
        (item) => item.legacyTable === original.table,
      );
      const expectedColumns =
        original.rows?.map((field) => field.legacyColumn) ?? [];
      const actualColumns =
        audited?.fields?.map((field) => field.legacyField) ?? [];
      expect(new Set(actualColumns).size).toBe(actualColumns.length);
      expect(actualColumns).toEqual(expectedColumns);
    }

    const originalFields = source.tables.reduce(
      (count, table) => count + (table.rows?.length ?? 0),
      0,
    );
    expect(tracker.counters?.sourceCandidateTables).toBe(source.tables.length);
    expect(tracker.counters?.sourceCandidateFields).toBe(originalFields);
  });

  it("cannot mark a field verified without a destination and test evidence", () => {
    for (const table of tracker.tables) {
      for (const field of table.fields ?? []) {
        expect(validStates.has(field.status)).toBe(true);
        if (["MAPPED", "IMPLEMENTED", "DB_TESTED", "WORKFLOW_VERIFIED"].includes(field.status)) {
          expect(field.reviewedVnextMapping).toBeTruthy();
        }
        if (["DB_TESTED", "WORKFLOW_VERIFIED"].includes(field.status)) {
          expect(field.validationEvidence).toBeTruthy();
        }
      }
    }
  });
});
