import { runBulkStatus } from "../trackerBulk";
import {
  MAX_SAVED_FILTERS,
  deleteFilterPreset,
  hasAnyFilter,
  loadSavedFilters,
  saveFilterPreset,
} from "../trackerSavedFilters";

describe("runBulkStatus", () => {
  test("reports per-issue outcomes and keeps going after a failure", async () => {
    const update = jest.fn(async (id) => {
      if (id === "LMS-0002") throw new Error("Issue not found");
    });
    const progress = jest.fn();
    const result = await runBulkStatus(["LMS-0001", "LMS-0002", "LMS-0003"], "CLOSED", update, { onProgress: progress });
    expect(result.succeeded.sort()).toEqual(["LMS-0001", "LMS-0003"]);
    expect(result.failed).toEqual([{ id: "LMS-0002", message: "Issue not found" }]);
    expect(update).toHaveBeenCalledTimes(3);
    expect(update).toHaveBeenCalledWith("LMS-0001", "CLOSED");
    expect(progress).toHaveBeenLastCalledWith({ done: 3, total: 3 });
  });

  test("never runs more than the concurrency cap at once", async () => {
    let active = 0;
    let peak = 0;
    const update = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    };
    await runBulkStatus(Array.from({ length: 10 }, (_, i) => `LMS-${i}`), "FIXING", update, { concurrency: 3 });
    expect(peak).toBeLessThanOrEqual(3);
  });

  test("an empty selection does nothing", async () => {
    const update = jest.fn();
    expect(await runBulkStatus([], "CLOSED", update)).toEqual({ succeeded: [], failed: [] });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("saved filter presets", () => {
  beforeEach(() => window.localStorage.clear());

  test("saves, reloads, replaces by name and deletes", () => {
    saveFilterPreset("Open criticals", { status: "NEW", environment: "PRODUCTION", search: "  ", sort: "DESC" });
    expect(loadSavedFilters()).toEqual([{ name: "Open criticals", filters: { status: "NEW", environment: "PRODUCTION" } }]);

    saveFilterPreset("open criticals", { status: "FIXING" });
    expect(loadSavedFilters()).toEqual([{ name: "open criticals", filters: { status: "FIXING" } }]);

    deleteFilterPreset("open criticals");
    expect(loadSavedFilters()).toEqual([]);
  });

  test("keeps only the newest MAX_SAVED_FILTERS", () => {
    for (let i = 0; i < MAX_SAVED_FILTERS + 3; i += 1) saveFilterPreset(`view ${i}`, { status: "NEW" });
    const list = loadSavedFilters();
    expect(list).toHaveLength(MAX_SAVED_FILTERS);
    expect(list[0].name).toBe(`view ${MAX_SAVED_FILTERS + 2}`);
  });

  test("ignores a blank name and survives corrupted storage", () => {
    saveFilterPreset("   ", { status: "NEW" });
    expect(loadSavedFilters()).toEqual([]);
    window.localStorage.setItem("tracker_saved_filters", "{not json");
    expect(loadSavedFilters()).toEqual([]);
  });

  test("hasAnyFilter ignores defaults and blanks", () => {
    expect(hasAnyFilter({ status: "", sort: "DESC", search: " " })).toBe(false);
    expect(hasAnyFilter({ sort: "ASC" })).toBe(true);
  });
});
