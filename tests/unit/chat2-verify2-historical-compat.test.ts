import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {companyDomainSchema} from "@/modules/placements/company-curation-domain-model";
import {authoredImportantDateRoundTrip} from "@/modules/placements/job-important-date-adapter";
import {evaluateLegacyDomainLoginReadiness} from "@/modules/colleges/legacy-domain-login-readiness";

const src=(path:string)=>readFileSync(path,"utf8");
describe("chat-2 verify2 historical aliases, domain, dates and review proof",()=>{
 it("resolves old mentor course index and detail bookmarks without creating an unauthorized course page",()=>{
  const config=src("next.config.ts");
  expect(config).toContain('source: "/mentor/courses/:path*"');
  expect(config).toContain('destination: "/mentor/projects"');
  expect(src("src/app/(authenticated)/mentor/courses/page.tsx")).toContain('redirect("/mentor/projects")');
 });
 it("uses the private-public suffix list to resolve a company's registrable host",()=>{
  expect(companyDomainSchema.parse("mail.company.co.in")).toBe("company.co.in");
  expect(companyDomainSchema.parse("https://jobs.company.co.in/careers")).toBe("company.co.in");
 });
 it("round-trips explicitly authored important-date type and dateType",()=>{
  const row=authoredImportantDateRoundTrip({
   label:"Interview",at:"2026-12-01T10:00:00+05:30",type:"ROUND",dateType:"INTERVIEW",
  });
  expect(row).toMatchObject({label:"Interview",type:"ROUND",dateType:"INTERVIEW"});
 });
 it("renders an 800px college-scoped student audit viewer",()=>{
  const student=src("src/app/(authenticated)/admin/students/page.tsx");
  const viewer=src("src/components/college/college-person-audit-modal.tsx");
  expect(student).toContain('<CollegePersonAuditModal membershipId={row.id}');
  expect(viewer).toContain('className="max-w-[800px]"');
  expect(viewer).toContain('kind="+kind');
 });
 it("separates unknown required domain evidence from advisory setup warnings",()=>{
  const base={requireVerifiedDomains:false,domainTotal:1,domainVerified:0,domainPrimary:1,
   verifiedPrimaryDomains:0,hasLogo:false,departments:0,facultyMemberships:0,enrolledLearners:0};
  const known=evaluateLegacyDomainLoginReadiness(base);
  expect(known.readyForDomainLogin).toBe(true);
  expect(known.warnings).toContain("MISSING_LOGO");
  const unknown=evaluateLegacyDomainLoginReadiness({...base,domainTotal:null});
  expect(unknown.readyForDomainLogin).toBeNull();
 });
});
