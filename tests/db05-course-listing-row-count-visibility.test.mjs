import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/modules/courses/course-service.ts", import.meta.url), "utf8");

test("course listing rows and paginated total share the exact lifecycle/soft-delete filter", () => {
  assert.match(source, /function courseListingStateConditions\(includeArchived: boolean, onlyArchived: boolean\)/);
  assert.match(source, /if \(onlyArchived\) return \[eq\(courses\.status, "ARCHIVED"\)\]/);
  assert.match(source, /return \[eq\(courses\.status, "ACTIVE"\), isNull\(courses\.deletedAt\)\]/);
  // One use in the data reader and one in the SQL count reader.
  assert.equal((source.match(/conditions\.push\(\.\.\.courseListingStateConditions\(includeArchived, onlyArchived\)\)/g) ?? []).length, 2);
});
