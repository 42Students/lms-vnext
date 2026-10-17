import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Chat-6 recruiter login and mobile layout safety",()=>{
 it("SA-academics-people-111 reuses an existing recruiter mobile and revokes all sessions when the login mobile changes",()=>{
  const svc=source("src/modules/placements/super-admin-hr-service.ts");
  const ui=source("src/components/admin/super-admin-hr-accounts.tsx");
  expect(svc).toContain("reusedExisting");
  expect(ui).toContain("A recruiter with this mobile already exists. Opening it so you can add colleges.");
  expect(svc).toContain("phoneChanged = input.phoneE164 !== undefined");
  expect(svc).toContain('if(input.status==="ARCHIVED" || phoneChanged)');
  expect(svc).toContain("await terminateSuperAdminHrSessions(context,userId)");
 });
 it("COL-dashboard-17 uses wrapped count labels and a mobile-safe setup checklist with accessible links",()=>{
  const cards=source("src/components/admin/college-dashboard-cards.tsx");
  const checklist=source("src/components/admin/college-setup-checklist.tsx");
  expect(cards).toContain("min-[375px]:grid-cols-2");
  expect(cards).toContain("min-w-0 break-words");
  expect(cards).toContain("focus-visible:outline");
  expect(checklist).toContain("grid min-w-0 gap-4");
  expect(checklist).toContain('href={step.href}');
 });
 it("SA-academics-people-75 keeps create controls and scrolling course tables within mobile width",()=>{
  const page=source("src/components/courses/admin-course-overview.tsx");
  const table=source("src/components/ui/data-table.tsx");
  expect(page).toContain('className="min-w-0 space-y-8"');
  expect(page).toContain("min-w-0 flex-[1_1_14rem]");
  expect(table).toContain("overflow-x-auto");
  expect(table).toContain("w-full border-collapse");
 });
});