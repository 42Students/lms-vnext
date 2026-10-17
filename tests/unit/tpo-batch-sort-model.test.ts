import { describe, expect, it } from "vitest";
import { sortTpoBatchNames, tpoBatchSortSchema } from "@/modules/placements/tpo-batch-sort-model";

describe("TPO batch directory sorting", () => {
  const rows = [{ id: "c", name: "Zoology" }, { id: "b", name: "Arts" }, { id: "a", name: "Arts" }];
  it("orders with stable identity tie-breaks without mutating the fetched roster", () => {
    expect(sortTpoBatchNames(rows, "NAME_ASC").map(r => r.id)).toEqual(["a", "b", "c"]);
    expect(sortTpoBatchNames(rows, "NAME_DESC").map(r => r.id)).toEqual(["c", "b", "a"]);
    expect(rows.map(r => r.id)).toEqual(["c", "b", "a"]);
  });
  it("TPO-batches-09 defaults to the placement working set and rejects invalid URL values", () => {
    expect(tpoBatchSortSchema.parse(undefined)).toBe("WORKING_SET");
    expect(tpoBatchSortSchema.safeParse("anything").success).toBe(false);
  });
});
