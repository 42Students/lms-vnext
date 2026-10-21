/**
 * UI/UX audit, buy-signal extra "Compliance Preflight for NAAC/NIRF export" (2026-10-01).
 */
import { buildAccreditationPreflight } from "@/components/tpo/accreditationPreflight";

const completeRow = { packageLpa: 8, employer: "Acme", employerContact: "hr@acme.com", joiningStatus: "JOINED", rollNumber: "R001", programme: "B.Tech · CSE", batch: "2026-2027" };

test("no missing fields across all rows reports zero incomplete", () => {
  const { incompleteCount, missingByField } = buildAccreditationPreflight([completeRow, { ...completeRow, rollNumber: "R002" }]);
  expect(incompleteCount).toBe(0);
  expect(missingByField).toEqual([]);
});

test("a null, undefined or empty-string field all count as missing", () => {
  const { incompleteCount, missingByField } = buildAccreditationPreflight([
    { ...completeRow, employerContact: null },
    { ...completeRow, packageLpa: undefined },
    { ...completeRow, employer: "" },
  ]);
  expect(incompleteCount).toBe(3);
  expect(missingByField).toEqual(expect.arrayContaining([
    { label: "Employer contact", count: 1 }, { label: "Package (CTC)", count: 1 }, { label: "Employer", count: 1 },
  ]));
});

test("a row missing two fields counts once toward incompleteCount but both fields toward missingByField", () => {
  const { incompleteCount, missingByField } = buildAccreditationPreflight([{ ...completeRow, batch: null, employer: null }]);
  expect(incompleteCount).toBe(1);
  expect(missingByField).toEqual(expect.arrayContaining([{ label: "Batch", count: 1 }, { label: "Employer", count: 1 }]));
});

test("no rows at all is not an error", () => {
  expect(buildAccreditationPreflight([])).toEqual({ total: 0, incompleteCount: 0, missingByField: [] });
  expect(buildAccreditationPreflight(undefined)).toEqual({ total: 0, incompleteCount: 0, missingByField: [] });
});
