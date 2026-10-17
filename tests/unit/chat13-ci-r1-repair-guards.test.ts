import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-13 stale cloud CI report regression fences",()=>{
 it("SA-placements-projects-14 database schema contains foreignKey imported with placements definitions",()=>{
  const schema=read("src/db/schema/placements.ts");
  expect(schema).toMatch(/import\\s*\\{[^}]*\\bforeignKey\\b[^}]*\\}\\s*from\\s*["']drizzle-orm\\/pg-core["']/);
 });
 it("SA-placements-projects-21 keeps current eligibility and nonfabricated match score copy",()=>{
  const ui=read("src/components/placements/college-application-detail-drawer.tsx");
  for(const phrase of ["Re-screen","Current eligibility:","No fabricated public resume URL or match score is shown.","It does not fabricate a match score or reverse an existing screening decision."])
   expect(ui).toContain(phrase);
 });
 it("SA-placements-projects-36 preserves recruiter lifecycle labels even when controls change",()=>{
  const ui=read("src/components/admin/super-admin-hr-accounts.tsx");
  expect(ui).toContain('aria-label="Recruiter account lifecycle"');
  expect(ui).toContain('<h2 className="text-base font-semibold">Recruiter account lifecycle</h2>');
 });
 it("SA-placements-projects-14 validates cross-level section cascade in the form",()=>{
  const form=read("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain("allowedSectionIds:effectiveSectionIds");
  expect(form).toContain("selectedSectionIds.filter(id=>visibleSections.some(c=>c.id===id))");
 });
});
