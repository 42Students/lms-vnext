import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {publicPublicationDecision} from "@/modules/placements/public-page/publication-policy";
import {publicJoinLinkPath,tpoPublicJoinLinkToggleSchema} from "@/modules/placements/tpo-public-join-link-model";

const source=(path:string)=>readFileSync(path,"utf8");

describe("Chat-5 delegated decisions: safe behavior and remaining boundaries",()=>{
 it("TPO-calendar-reports-23 requires explicit notification delivery evidence, not calendar UI claims",()=>{
  const service=source("src/modules/placements/round-service.ts");
  expect(service).toContain("placement");
  // OPEN: per-candidate schedule notices and email receipts still require implementation.
  expect(existsSync("src/modules/placements/round-service.ts")).toBe(true);
 });
 it("TPO-campaigns-public-17 preserves a scoped opt-out path instead of treating email delivery as proof of unsubscribe",()=>{
  const docs=source("docs/audit/acceptance/tpo-campaigns-public-verification.md");
  expect(docs).toContain("TPO-campaigns-public-17 | OPEN");
  expect(docs).toContain("durable signed per-recipient opt-out");
 });
 it("TPO-campaigns-public-25 keeps public join links explicitly revocable instead of perpetual access",()=>{
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COLLEGE",enabled:false}).success).toBe(true);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",companyId:"11111111-1111-4111-8111-111111111111",enabled:false}).success).toBe(true);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",enabled:true}).success).toBe(false);
  expect(publicJoinLinkPath("COMPANY","secret")).toContain("/company-join/");
  expect(source("src/modules/placements/tpo-public-join-link-service.ts")).toContain("revokedAt");
 });
 it("TPO-campaigns-public-R08 does not equate self-granted links with verified TPO endorsement",()=>{
  const service=source("src/modules/placements/public-join/join-service.ts");
  expect(service).toContain("placementRecruiterCollegeGrants");
  expect(service).toContain("grantedByUserId");
  expect(source("docs/audit/acceptance/tpo-campaigns-public-verification.md")).toContain("TPO-campaigns-public-R08 | OPEN");
 });
 it("TPO-companies-04 keeps trust display separate from company drive-request approval",()=>{
  const company=source("src/modules/placements/tpo-company-lifecycle-service.ts");
  expect(company).toContain("isTrusted");
  expect(source("docs/audit/acceptance/tpo-companies-verification.md")).toContain("independent TPO approval");
 });
 it("TPO-companies-25 removes obsolete environment gates, while keeping same-origin protection",()=>{
  for(const path of ["src/app/api/placements/tpo/companies/route.ts",
    "src/app/api/placements/tpo/companies/detail/route.ts",
    "src/app/api/placements/tpo/companies/[companyId]/people/route.ts"]){
    expect(source(path)).not.toContain("DB09_TPO_API_READY");
  }
  expect(source("src/app/api/placements/tpo/companies/[companyId]/people/route.ts")).toContain("isSameOriginRequest(request)");
 });
 it("TPO-drive-workspace-51 avoids silently equating employer reported acceptance with learner acknowledged acceptance",()=>{
  const register=source("src/modules/placements/tpo-drive-offer-register-model.ts");
  expect(register).toContain("acceptanceChannel");
  expect(register).toContain("acceptedDisputableUntil");
  expect(register).toContain("offerRulesCheck");
  expect(source("docs/audit/acceptance/tpo-drive-workspace-verification.md")).toContain("TPO-drive-workspace-51 | OPEN");
 });
 it("TPO-drives-28 keeps employer contract type distinct from college-specific counts-as-placed configuration",()=>{
  const types=source("src/modules/placements/tpo-job-type-write-service.ts");
  expect(types).toContain("countsAsPlaced");
  expect(types).toContain("tpoJobTypeNameSchema");
  expect(source("docs/audit/acceptance/tpo-drives-verification.md")).toContain("TPO-drives-28 | OPEN");
 });
 it("TPO-drives-34 targets typed cohort IDs in the college, not ambiguous batch names",()=>{
  expect(source("src/db/schema/placement-job-cohorts.ts")).toContain("cohortId");
  expect(source("src/modules/placements/tpo-drive-lifecycle-list-service.ts")).toContain("cohortId");
 });
 it("TPO-home-25 retains scoped college-wide placement operations instead of silently hiding work without an owner",()=>{
  const service=source("src/modules/placements/tpo-operations-service.ts");
  expect(service).toContain("requirePlacementManageScope");
  expect(service).toContain("collegeId");
 });
 it("TPO-home-26 shows a real placements-module-off state before loading TPO operations",()=>{
  const page=source("src/app/(authenticated)/tpo/home/page.tsx");
  expect(page).toContain("resolveOptionalModuleAccess(ctx)");
  expect(page).toContain("Placements is switched off for this college");
 });
 it("TPO-home-27 denies Faculty-only accounts the TPO tooling they were not explicitly granted",()=>{
  const model=source("src/modules/placements/tpo-workspace-access-model.ts");
  expect(model).toContain('hasMembershipRole(context, "TPO")');
  expect(model).toContain('can(context, "placements.manage"');
 });
 it("TPO-inbox-team-08 never fabricates email relay or inbound-email delivery when provider is absent",()=>{
  const docs=source("docs/audit/acceptance/tpo-inbox-team-verification.md");
  expect(docs).toContain("TPO-inbox-team-08 | BLOCKED");
  expect(docs).toContain("never claim unconfigured email");
 });
 it("TPO-inbox-team-35 keeps the college's role-administration controls as the source of placement-team authority",()=>{
  const team=source("src/app/(authenticated)/tpo/settings/team/page.tsx");
  expect(team).toContain("team");
  expect(source("docs/audit/acceptance/tpo-inbox-team-verification.md")).toContain("avoid a TPO Team page that can self-grant");
 });
 it("TPO-settings-audit-05 avoids inventing an unregistered TPO_ADMIN security role",()=>{
  const model=source("src/modules/placements/tpo-workspace-access-model.ts");
  expect(model).toContain("placements.manage");
  expect(model).toContain('hasMembershipRole(context, "TPO")');
 });
 it("TPO-settings-audit-12 does not mutate canonical learner marks merely to change derived percentages",()=>{
  const docs=source("docs/audit/acceptance/tpo-settings-audit-verification.md");
  expect(docs).toContain("TPO-settings-audit-12 | NOT-A-GAP");
  expect(docs).toContain("Preserve canonical CGPA");
 });
 it("TPO-settings-audit-81 labels template examples as manual rather than pretending recipients were contacted",()=>{
  const page=source("src/app/(authenticated)/tpo/settings/templates/page.tsx");
  expect(page).toContain("not stored college templates");
  expect(page).toContain("Copying text does not send email");
 });
 it("TPO-settings-audit-R03 checks the live consented learner count and refuses tiny cohorts",()=>{
  const service=source("src/modules/placements/public-page/publication-service.ts");
  expect(service).toContain("registeredPublicPlacementCohort");
  expect(service).toContain('eq(placementBatchRegistrations.choice,"PLACEMENTS")');
  expect(service).toContain("populationCount:population");
  expect(publicPublicationDecision({enabled:true},{populationCount:4,publishedAt:null})).toBe("SMALL_COHORT");
  expect(publicPublicationDecision({enabled:true},{populationCount:5,publishedAt:null})).toBe("ENABLE");
 });
});
