import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("Company-scoped Team discussion navigation",()=>{
 it("TPO-companies-05 offers Open in Team from both canonical detail and company memory, not an unscoped name lookup",()=>{
  const detail=readFileSync("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx","utf8");
  const memory=readFileSync("src/components/tpo/tpo-company-memory-workspace.tsx","utf8");
  expect(detail).toContain('href={"/tpo/companies/"+encodeURIComponent(route.companyId)+"/team"}');
  expect(memory).toContain('company.canonicalCompanyId?<Link');
  expect(memory).toContain('"/team"}');
  expect(memory).toContain("Open in Team");
  expect(memory).not.toContain('href={"/tpo/team?about=COMPANY:"+company.name}');
 });
 it("TPO-inbox-team-16 keeps private company messages separate from recruiter conversations",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx","utf8");
  expect(page).toContain("Recruiters and students cannot read it.");
  expect(page).toContain("readTpoCompanyTeam(context,companyId)");
  expect(page).toContain("result.canPost?");
  expect(page).toContain("This relationship is archived. Its discussion is read-only.");
 });
});