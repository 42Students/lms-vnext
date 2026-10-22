import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { projectCompanyShareRows } from "@/modules/placements/company-share/column-model";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

it("renders equivalent three-field mobile cards and desktop tables", () => {
  const page = read("src/app/company-share/[token]/page.tsx");
  const table = read("src/components/ui/data-table.tsx");

  // The UX rollout consolidated separate mobile cards and desktop rows into
  // one shared renderer; both views must use the SAME approved column/cell map.
  expect(page).toContain("columns.map((key,index)=>");
  expect(page).toContain("mobileLabel: COMPANY_SHARE_COLUMNS[key]");
  expect(page).toContain('cell: row=>{');
  expect(page).toContain('key==="APPLICATION_ID"?row.applicationId:row.cells[key]');
  expect(page).toContain('<DataTable columns={tableColumns} rows={result.rows} mobileMode="cards"');
  expect(page).toContain("getRowKey={row=>row.applicationId}");
  expect(table).toContain("columns.map(col=>");
  expect(table).toContain('mobileMode = "scroll"');
  expect(table).toContain('horizontal?"table-cell');
  expect(table).toContain('horizontal?"table-row');
  expect(table).toContain('phoneVisible?"block":"hidden"');
  expect(table).toContain('md:table-cell');
  expect(table).toContain('md:hidden');
  expect(table).toContain("col.mobileLabel??col.header");
  expect(table).toContain('data-slot="data-table"');

  // Private applicant fields cannot leak through a second responsive branch.
  expect(page).not.toContain("row.phone");
  expect(page).not.toContain("row.resume");
});

it("discloses only the selected fields on either viewport", () => {
  const applicant = {
    applicationId: "application-1",
    displayName: "Learner",
    email: "private@example.com",
    phone: "+919999999999",
    rollNumber: "R123",
    profileDocument: null,
    branch: "CSE",
    stage: "SHORTLISTED",
  };
  const [row] = projectCompanyShareRows([applicant], ["NAME", "ROLL_NUMBER", "STAGE"]);
  expect(row).toBeDefined();
  expect(Object.keys(row!.cells)).toEqual(["APPLICATION_ID","NAME", "ROLL_NUMBER", "STAGE"]);
  expect(row!.cells).toEqual({APPLICATION_ID:"application-1",NAME: "Learner", ROLL_NUMBER: "R123", STAGE: "Shortlisted" });
  expect(JSON.stringify(row!.cells)).not.toContain("private@example.com");
  expect(JSON.stringify(row!.cells)).not.toContain("+919999999999");
});
