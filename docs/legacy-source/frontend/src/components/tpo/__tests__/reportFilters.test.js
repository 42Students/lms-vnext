import { deleteFilters, listSavedFilters, saveFilters } from "../ui/reportFilters";

describe("saved report filters", () => {
  beforeEach(() => window.localStorage.clear());
  it("saves by name per report, replaces a name, and drops empty values", () => {
    expect(listSavedFilters("by-branch")).toEqual([]);
    saveFilters("by-branch", "CSE 2027", { batch: "2027", branch: "CSE", company: "", mode: null });
    saveFilters("by-branch", "cse 2027", { batch: "2027", branch: "CSE", company: "Acme" });
    saveFilters("ctc", "Dream only", { category: "DREAM" });
    expect(listSavedFilters("by-branch")).toEqual([{ name: "cse 2027", filters: { batch: "2027", branch: "CSE", company: "Acme" } }]);
    expect(listSavedFilters("ctc")).toHaveLength(1);
  });
  it("an empty set or a blank name is not worth saving", () => {
    saveFilters("ctc", "Nothing", { batch: "", branch: "" });
    saveFilters("ctc", "  ", { batch: "2027" });
    expect(listSavedFilters("ctc")).toEqual([]);
  });
  it("deletes one by name and keeps the rest", () => {
    saveFilters("ctc", "A", { batch: "1" });
    saveFilters("ctc", "B", { batch: "2" });
    expect(deleteFilters("ctc", "A").map((x) => x.name)).toEqual(["B"]);
  });
  it("keeps at most twelve per report", () => {
    for (let i = 0; i < 15; i += 1) saveFilters("ctc", `S${i}`, { batch: String(i) });
    const names = listSavedFilters("ctc").map((x) => x.name);
    expect(names).toHaveLength(12);
    expect(names[names.length - 1]).toBe("S14");
  });
  it("survives damaged storage and a blocked write", () => {
    window.localStorage.setItem("tpo.reportFilters.v1", "[[");
    expect(listSavedFilters("ctc")).toEqual([]);
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    expect(() => saveFilters("ctc", "X", { batch: "1" })).not.toThrow();
    spy.mockRestore();
  });
});
