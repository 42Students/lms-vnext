import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("public tracker issue discovery privacy",()=>{
 it("publishes no unapproved issue or identifying content",()=>{
  const page=readFileSync("src/app/tracker/issues/public/page.tsx","utf8");
  expect(page).toContain('process.env["PUBLIC_ISSUE_CATALOG_READY"]==="true"');
  expect(page).toContain("isNotNull(db10BugReports.publicCatalogApprovedAt)");
  expect(page).toContain("eq(db10BugReports.productionVerified,true)");
  expect(page).toContain('eq(db10BugReports.status,"CLOSED")');
  expect(page).not.toContain("db10BugReports.description");
  expect(page).not.toContain("db10BugReports.reporterName");
  expect(page).toContain('href="/tracker"');
 });
});
