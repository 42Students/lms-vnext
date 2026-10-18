import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(path,"utf8");
const app = path => source("src/app/"+path);
const shared=source("src/components/marketing/marketing-layout.tsx");

test("UX-public-home-01 marketing journey preserves headings and uses responsive audience links",()=>{
  const page=app("home/page.tsx");
  assert.match(page,/MarketingLayout/);
  assert.match(page,/One connected platform for learning, projects and placements/);
  assert.match(page,/href="\/universities"/);
  assert.match(page,/href="\/enterprises"/);
  assert.match(page,/focus-visible:outline-2/);
  assert.match(page,/sm:grid-cols-2/);
  assert.match(page,/lg:grid-cols-4/);
});
test("UX-public-page_tsx-01 branded root sign-in remains safe in 320px and unavailable states",()=>{
  const page=app("page.tsx");
  assert.match(page,/min-h-dvh/);
  assert.match(page,/max-w-5xl/);
  assert.match(page,/safe-area-inset-bottom/);
  assert.match(page,/branding\?\.collegeName/);
  assert.match(page,/LoginForm/);
  assert.match(page,/tenant\.kind === "unavailable"/);
  assert.match(page,/tenant\.kind === "unknown"/);
  assert.match(page,/safeReturnTo/);
});
test("UX-public-forbidden-01 keeps actual graceful access-denied page",()=>{
  const page=app("forbidden/page.tsx");
  assert.match(page,/GracefulScreen/);
  assert.match(page,/You do not have access to this page/);
  assert.match(page,/please contact your administrator/);
  assert.match(page,/homeHref="\/dashboard"/);
  assert.match(page,/index: false/);
});
test("UX-public-privacy-policy-01 canonical policy still redirects to full legacy document",()=>{
  const page=app("privacy-policy/page.tsx");
  assert.match(page,/redirect\("\/assets\/static\/privacy-policy-view\.html"\)/);
  assert.match(page,/export const metadata/);
});
test("UX-public-request-demo-01 email demo CTA stays explicit and keyboard accessible",()=>{
  const page=app("request-demo/page.tsx");
  assert.match(page,/MarketingLayout/);
  assert.match(page,/See 42 LMS in action/);
  assert.match(page,/mailto:hello@42lms\.com/);
  assert.match(page,/No form data is collected on this page/);
  assert.match(page,/sm:w-auto/);
  assert.match(page,/min-h-12/);
  assert.match(page,/focus-visible:outline-2/);
});
test("UX-public-company-share-01 code, expiry, privacy and authorized columns remain intact",()=>{
  const page=app("company-share/[token]/page.tsx");
  assert.match(page,/getPublicCompanyApplicantShare\(token/);
  assert.match(page,/result\.kind==="CODE_REQUIRED"/);
  assert.match(page,/type="text" required inputMode="numeric"/);
  assert.match(page,/pattern="\[0-9\]\{6\}"/);
  assert.match(page,/result\.kind!=="READY"/);
  assert.match(page,/safeCompanyShareColumns\(result\.selectedColumns\)/);
  assert.match(page,/tableColumns.*DataTableColumn/);
  assert.match(page,/row\.cells\[key\]\?\?"Not recorded"/);
  assert.match(page,/<DataTable /);
  assert.match(page,/<Pagination /);
  assert.match(page,/<Input /);
  assert.match(page,/<Button /);
  assert.match(page,/No current shortlist records on this page/);
  assert.match(page,/publicApplicantExportHref/);
  assert.doesNotMatch(page,/min-h-10\b/);
});
test("UX-public-enterprises-01 uses shared capabilities and existing enterprise copy",()=>{
  const page=app("enterprises/page.tsx");
  assert.match(page,/MarketingHero/);
  assert.match(page,/Build High-Performing Workforces with AI/);
  assert.match(page,/Talent development that connects to work/);
  assert.match(page,/MarketingFeatureGrid/);
  assert.match(page,/MarketingCta/);
});
test("UX-public-universities-01 uses shared cards and retains campus role labels",()=>{
  const page=app("universities/page.tsx");
  assert.match(page,/MarketingHero/);
  assert.match(page,/Develop Employable Graduates with AI/);
  for(const label of ["Students","Faculty","Mentors","Placement teams","Administrators"]){
    assert.ok(page.includes('title:"'+label+'"'),label);
  }
  assert.match(page,/MarketingFeatureGrid/);
});
test("UX-public-platform-01 preserves role descriptions and responsive lifecycle",()=>{
  const page=app("platform/page.tsx");
  assert.match(page,/One autonomous AI platform for talent and workforce development/);
  assert.match(page,/Every role has a purpose-built workspace/);
  assert.match(page,/A complete talent lifecycle/);
  assert.match(page,/rounded-xl border border-border bg-surface/);
  assert.match(page,/MarketingCta/);
});
test("UX-public-account-security-01 keeps permission redirect and graceful session states",()=>{
  const page=app("(authenticated)/account/security/page.tsx");
  const devices=source("src/components/auth/device-list.tsx");
  assert.match(page,/getCurrentDeviceSession/);
  assert.match(page,/redirect\("\/dashboard"\)/);
  assert.match(page,/listActiveSessions\(session\.userId\)\.catch\(\(\) => null\)/);
  assert.match(page,/<ErrorState/);
  assert.match(page,/<EmptyState/);
  assert.match(page,/<DeviceList/);
  assert.match(devices,/ConfirmDialog/);
  assert.match(devices,/startTransition/);
  assert.match(devices,/finally/);
  assert.match(devices,/router\.refresh\(\)/);
  assert.match(devices,/That didn't work\. Try again\./);
});
test("UX-public-shared-01 shared marketing shell supports narrow screens and focus",()=>{
  assert.match(shared,/min-h-dvh/);
  assert.match(shared,/sm:flex-row/);
  assert.match(shared,/min-h-11/);
  assert.match(shared,/focus-visible:outline-2/);
  assert.match(shared,/sm:grid-cols-2/);
  assert.match(shared,/MarketingHero/);
});
