import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {
  recordedOutsideDriveSchema,outsideDriveIsPlatformJob,
} from "@/modules/placements/recorded-outside-model";
import {
  tpoNonApplicantReminderBlockReason,
} from "@/modules/placements/tpo-remind-not-applied-model";
import {
  companyShareIssueSchema,issueCompanyShareAccessCode,validCompanyShareAccessCode,
} from "@/modules/placements/company-share/token-model";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const path={
  share:"src/app/company-share/[token]/page.tsx",
  shareRead:"src/modules/placements/company-share/public-service.ts",
  shareAccess:"src/modules/placements/company-share/access-service.ts",
  shareWrite:"src/modules/placements/company-share/manage-service.ts",
  shareExport:"src/app/api/placements/company-share/[token]/export/route.ts",
  tpoNew:"src/app/(authenticated)/tpo/placements/new/page.tsx",
  tpoList:"src/app/(authenticated)/tpo/placements/lifecycle/page.tsx",
  outside:"src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx",
  outsideDetail:"src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx",
  outsidePost:"src/app/api/placements/recorded-outside/route.ts",
  outsideService:"src/modules/placements/recorded-outside-service.ts",
  outsidePeople:"src/modules/placements/recorded-outside-participation-service.ts",
} as const;

describe("2026-11-03 source-backed missing-surface triage",()=>{
  it("company-share is a routed, code-gated external applicant list rather than an absent page",()=>{
    const page=source(path.share);
    expect(page).toContain('getPublicCompanyApplicantShare(token,page??1,"VIEW"');
    expect(page).toContain('get("company_share_access")');
    expect(page).toContain("<ShareCodeForm");
    expect(page).toContain('result.kind==="CODE_REQUIRED"');
    expect(page).toContain('result.kind!=="READY"');
    expect(page).toContain("<DataTable");
    expect(page).toContain("<Pagination");
    expect(page).toContain("publicApplicantExportHref");
    const code=issueCompanyShareAccessCode();
    expect(validCompanyShareAccessCode(code.code,code.salt,code.hash)).toBe(true);
    expect(validCompanyShareAccessCode("INVALID",code.salt,code.hash)).toBe(false);
  });
  it("external share requires scoped approved applicants, unexpired token and audited reads",()=>{
    const query=source(path.shareRead);
    expect(query).toContain("companyShareTablesReady()");
    expect(query).toContain("validCompanyShareAccessProof(");
    expect(query).toContain("isNull(shares.revokedAt)");
    expect(query).toContain("gt(shares.expiresAt");
    expect(query).toContain("projectCompanyShareRows(");
    expect(query).toContain('for("share"');
    expect(query).toContain("placementCompanyShareSelections");
    expect(query).toContain("views");
    const manage=source(path.shareWrite);
    expect(manage).toContain("issueTpoCompanyApplicantShare");
    expect(manage).toContain("revokeTpoCompany");
    expect(manage).toContain("assertPersistedPlatformPermission");
    const access=source(path.shareAccess);
    expect(access).toContain("canEmailAuthorizedCompanyShareCode");
    expect(access).toContain("context.recruiter.grants.some");
    expect(access).toContain("companyShareEmailThrottle");
  });
  it("shared applicant export requires the same code proof and forbids unshared resumes",()=>{
    const exportRoute=source(path.shareExport);
    expect(exportRoute).toContain('get("company_share_access")');
    expect(exportRoute).toContain('getPublicCompanyApplicantShare(token,1,"CSV"');
    expect(exportRoute).toContain('!result.selectedColumns.includes("RESUME")');
    expect(exportRoute).toContain("NO_VERIFIED_RESUMES");
    expect(exportRoute).toContain('redirect:"error"');
    expect(exportRoute).toContain("maxZipFiles=20");
    expect(exportRoute).toContain('Cache-Control":"private, no-store');
    expect(companyShareIssueSchema.safeParse({jobId:"not-a-uuid"}).success).toBe(false);
  });
  it("outside-platform drive is reachable from both creation and lifecycle, with a genuine guarded POST",()=>{
    const newPage=source(path.tpoNew), list=source(path.tpoList);
    expect(newPage).toContain('href="/tpo/placements/recorded-outside"');
    expect(list).toContain('href="/tpo/placements/recorded-outside"');
    const page=source(path.outside);
    expect(page).toContain("hasMembershipRole(context,\"TPO\")");
    expect(page).toContain("<RecordedOutsideForm");
    expect(page).toContain("listTpoOutsideDriveRecords");
    expect(page).toContain("verifyRecordedOutsideConfirmation");
    const post=source(path.outsidePost);
    expect(post).toMatch(/isSameOriginRequest\(request\)|from "@\/security\/route"/);
    expect(post).toContain("recordOutsideDrive(");
    expect(post).toContain("303");
  });
  it("outside record persists only a college-scoped history, and supports participant results",()=>{
    const svc=source(path.outsideService);
    expect(svc).toContain("recordedOutsideDriveSchema.parse(raw)");
    expect(svc).toContain("assertPersistedPlatformPermission");
    expect(svc).toContain("tx.insert(placementOutsideDriveRecords)");
    expect(svc).not.toContain("tx.insert(placementJobs)");
    const participants=source(path.outsidePeople);
    expect(participants).toContain("requireTpoJobCollege(context)");
    expect(participants).toContain("requireTpoJobActor(tx,context)");
    expect(participants).toContain("setTpoOutsideDriveParticipant");
    expect(source(path.outsideDetail)).toContain("getTpoOutsideDriveParticipants");
    expect(outsideDriveIsPlatformJob()).toBe(false);
    const id="11111111-1111-4111-8111-111111111111";
    const record={collegeId:id,companyRelationshipId:id,
      title:"External college placement",occurredAt:"2026-10-02T10:00:00+05:30"};
    expect(recordedOutsideDriveSchema.safeParse(record).success).toBe(true);
    expect(recordedOutsideDriveSchema.safeParse({...record,learnerId:id}).success).toBe(false);
  });
  it("outside drives cannot trigger learner application reminders even when accidentally marked published",()=>{
    const now=new Date("2026-11-03T10:00:00Z");
    const job={status:"PUBLISHED",recordedOutside:true,applicationDeadline:null};
    expect(tpoNonApplicantReminderBlockReason(job,now))
      .toBe("Outside drives do not accept applications");
    expect(tpoNonApplicantReminderBlockReason({...job,recordedOutside:false},now))
      .toBeNull();
  });
});
