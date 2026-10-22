import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";

const source=readFileSync(join(process.cwd(),"src/app/company-share/[token]/page.tsx"),"utf8");
describe("company applicant share external link safety",()=>{
 it("uses one-tab navigation rather than unsafe new-window targets",()=>{
  expect(source).not.toContain('target="_blank"');
  expect(source).toContain('rel="noopener noreferrer"');
  expect(source).toContain(' (external website)');
  expect(source).toContain('min-h-11 items-center');
 });
 it("rejects credentials and ambiguous links before rendering an external href",()=>{
  expect(source).toContain('url.protocol==="https:"&&!url.username&&!url.password');
  expect(source).toContain('value!==value.trim()');
  expect(source).toContain("new URL(value)");
 });
 it("does not accidentally render unshared or invalid candidate data as links",()=>{
  expect(source).toContain('safeCompanyShareColumns(result.selectedColumns)');
  expect(source).toContain('return value==="Link not shown"?value:"-"');
  expect(source).toContain('getPublicCompanyApplicantShare(token,page??1,"VIEW",q??"",proof)');
 });
});
