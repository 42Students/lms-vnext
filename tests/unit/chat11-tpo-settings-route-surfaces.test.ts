import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const dir="src/app/(authenticated)/tpo/settings/";
const pages=[
 ["after-college","requireTpoBatchActor","Outcome-label storage is not available yet."],
 ["blocked-dates","getTpoBlockedDates","Blocked-date storage is pending migration registration."],
 ["branding","hasMembershipRole","No public logo URL is configured"],
 ["job-types","getTpoJobTypes","Job types storage is awaiting migration registration."],
 ["notices","requireTpoBatchActor","Communication settings are not available in this database."],
 ["notifications","hasMembershipRole","Invalid notification filters"],
 ["prep-readiness","getTpoPrepReadiness","Saved choices were not changed."],
 ["public-link","hasMembershipRole","TpoPublicJoinLinkCard"],
 ["public-page","hasMembershipRole","TpoSettingsNav"],
 ["recruiters","hasMembershipRole","Invalid recruiter access filters"],
 ["rules","hasMembershipRole","TpoSettingsNav"],
 ["season","hasMembershipRole","No placement seasons"],
 ["see","hasMembershipRole","College sharing policy"],
 ["team","hasMembershipRole","Faculty team assignments unavailable"],
 ["templates","requireTpoBatchActor","No recipients are selected or contacted."],
 ["trusted","hasMembershipRole","Trusted-domain allowlist unavailable"],
] as const;

describe("TPO-settings-audit-ROUTES-01: all settings routes require a TPO-scoped reader",()=>{
 for(const [route,authorization,emptyOrState] of pages){
  it(`TPO-settings-audit-ROUTES-01 /${route} uses scoped server data and a recoverable or truthful state`,()=>{
   const page=readFileSync(dir+route+"/page.tsx","utf8");
   expect(page,route).toContain("getCurrentRequestContext");
   expect(page,route).toContain(authorization);
   expect(page,route).toContain('<TpoSettingsNav active="'+route+'"');
   expect(page,route).toContain(emptyOrState);
   expect(page,route).not.toContain("dangerouslySetInnerHTML");
   expect(page,route).not.toContain("window.confirm(");
  });
 }
 it("does not use counted notices to imply actual email/SMS delivery",()=>{
  const page=readFileSync(dir+"notices/page.tsx","utf8");
  expect(page).toContain("not confirmed individual delivery or read receipts");
  expect(page).toContain("Actual email/SMS delivery is not certified without provider status.");
 });
 it("does not allow editing when prep course options failed to load",()=>{
  const page=readFileSync(dir+"prep-readiness/page.tsx","utf8");
  expect(page).toContain("parsed.success&&coursesResult.ok");
  expect(page).toContain("getTpoPrepReadiness(context)");
  expect(page).toContain("listTpoPrepCourses(context)");
  expect(page).toContain("data.updatedAt?.toISOString()");
 });
});
