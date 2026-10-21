import { columnsFromRows, escapeCsvCell, exportRowsToCsv } from "../csvExport";

describe("csv export helpers", () => {
  test("columnsFromRows derives ordered {key,label} columns from the first row", () => {
    expect(columnsFromRows([{ id: 1, name: "A" }, { id: 2, name: "B" }])).toEqual([
      { key: "id", label: "id" },
      { key: "name", label: "name" },
    ]);
  });

  test("columnsFromRows is empty for no rows", () => {
    expect(columnsFromRows([])).toEqual([]);
    expect(columnsFromRows(undefined)).toEqual([]);
  });

  test("escapeCsvCell quotes commas/quotes and neutralises spreadsheet formulas", () => {
    expect(escapeCsvCell('a,"b"')).toBe('"a,""b"""');
    expect(escapeCsvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCsvCell(null)).toBe("");
  });

  describe("exportRowsToCsv", () => {
    let captured;
    beforeEach(() => {
      captured = null;
      global.URL.createObjectURL = jest.fn((blob) => { captured = blob; return "blob:test"; });
      global.URL.revokeObjectURL = jest.fn();
      jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    const readBlob = (blob) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blob);
    });

    test("the 3-argument form with derived columns exports the header and every row", async () => {
      const rows = [{ id: 1, name: "Maths" }, { id: 2, name: "Physics, Advanced" }];
      exportRowsToCsv("x.csv", columnsFromRows(rows), rows);
      expect(await readBlob(captured)).toBe('id,name\n1,Maths\n2,"Physics, Advanced"');
    });

    test("the old 2-argument misuse (rows passed as columns) is what produced a blank export", async () => {
      // Regression documentation: this is the call shape the pages used to make.
      const rows = [{ id: 1, name: "Maths" }];
      exportRowsToCsv("x.csv", rows, undefined);
      const text = await readBlob(captured);
      expect(text).not.toContain("Maths");
    });
  });
});
