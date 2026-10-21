import { logIdentity, mergeLogEntries } from "../trackerLogsUtils";

describe("tracker Logs utilities", () => {
  test("uses stable Cloud Logging identity fields", () => {
    expect(logIdentity({
      logName: "projects/p/logs/stdout",
      insertId: "abc",
      timestamp: "2026-09-23T10:00:00Z",
    })).toBe("projects/p/logs/stdout|abc|2026-09-23T10:00:00Z");
  });

  test("merges refreshed entries without duplicating already loaded history", () => {
    const oldEntry = { logName: "l", insertId: "1", timestamp: "t1" };
    const newEntry = { logName: "l", insertId: "2", timestamp: "t2" };

    expect(mergeLogEntries([newEntry, oldEntry], [oldEntry])).toEqual([
      newEntry,
      oldEntry,
    ]);
  });
});
