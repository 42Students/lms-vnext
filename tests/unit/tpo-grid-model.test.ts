import { describe, expect, it } from "vitest";
import { chosenTpoGridColumns, csvSafeGridCell, exportTpoGridCsv, parseTpoGridColumns, tpoGridQuerySchema, updateTpoGridQuery } from "@/modules/placements/tpo-grid-model";

const columns = [
  { key: "name", label: "Name", read: (row: { name: string; secret: string }) => row.name },
  { key: "secret", label: "Export field", exportOnly: true, read: (row: { name: string; secret: string }) => row.secret },
];
describe("shared TPO spreadsheet model", () => {
  it("does not display export-only columns even if selected", () => {
    expect(chosenTpoGridColumns(columns, ["name", "secret"]).map((column) => column.key)).toEqual(["name"]);
    expect(parseTpoGridColumns("name,secret,unknown,name", ["name", "secret"])).toEqual(["name", "secret"]);
  });
  it("preserves URL filters and resets page on search change", () => {
    const params = updateTpoGridQuery(new URLSearchParams("page=7&filter.stage=READY&sort=name"), { search: "Ada" });
    expect(params.get("filter.stage")).toBe("READY");
    expect(params.get("sort")).toBe("name");
    expect(params.has("page")).toBe(false);
    expect(params.get("search")).toBe("Ada");
  });
  it("validates query limits", () => {
    expect(tpoGridQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
    expect(tpoGridQuerySchema.safeParse({ page: "2", filters: { stage: "OPEN" } }).success).toBe(true);
  });
  it("exports extra columns with CSV formula protection", () => {
    const csv = exportTpoGridCsv(columns, [{ name: "=SUM(1)", secret: "private" }]);
    expect(csv).toContain("'=SUM(1)");
    expect(csv).toContain("private");
    expect(csvSafeGridCell('Ada "A"')).toBe('"Ada ""A"""');
  });
});
