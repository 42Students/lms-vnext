import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");

describe("TPO public college placements legacy framing",()=>{
 it("TPO-campaigns-public-36 renders only the college's actual name, not an invented Placements at prefix",()=>{
  const page=src("src/app/placements/page.tsx");
  expect(page).toContain('{college?.collegeName??"College placements"}');
  expect(page).not.toContain('{"Placements at "');
  expect(page).not.toContain("42Students · Placements");
  expect(page).not.toContain("Back to college home");
  expect(page).toContain("PublicRecruitFromUs");
 });
 it("TPO-campaigns-public-36 retains the verified Recruit from us form and thank-you copy",()=>{
  const form=src("src/components/placements/public-recruit-from-us.tsx");
  const copy=src("src/modules/placements/public-enquiry/public-copy.ts");
  expect(form).toContain('aria-label="Recruit from us"');
  expect(form).toContain("publicRecruitThanks(collegeName)");
  expect(copy).toContain("The placement cell at");
 });
});