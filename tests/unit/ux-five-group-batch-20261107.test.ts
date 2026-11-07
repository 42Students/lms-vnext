import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appendUniquePeopleCsvRows, PEOPLE_CSV_CAP } from "@/modules/people/college-people-export-model";
import { trackerLogCsv } from "@/components/tracker/tracker-live-logs-explorer";

const source = (path: string) => readFileSync(path, "utf8");

describe("UX-G132 attendance write safety", () => {
 it("reviews attendance policy changes and rejects noninteger/out-of-bounds drafts before save", () => {
  const src = source("src/components/attendance/college-attendance-policy-form.tsx");
  expect(src).toContain("const validDraft=thresholdValid&&hoursValid");
  expect(src).toContain('title="Apply attendance policy changes?"');
  expect(src).toContain('confirmDisabled={!validDraft}');
  expect(src).toContain("if(!validDraft)");
  expect(src).toContain('readOnly = false');
 });
 it("locks a faculty schedule mutation before the first network await", () => {
  const src = source("src/components/attendance/faculty-attendance-schedule-editor.tsx");
  expect(src).toContain("if(busy||writeLock.current)return");
  expect(src).toContain("writeLock.current=true");
  expect(src).toContain("writeLock.current=false");
  expect(src).toContain("expectedUpdatedAt:selected?.updatedAt");
 });
});

describe("UX-G154 project write safety", () => {
 it("blocks repeated member submissions and stale candidate selections", () => {
  const src = source("src/components/projects/project-team-controls.tsx");
  expect(src).toContain("if (mutationLock.current || pending || searching) return");
  expect(src).toContain("mutationLock.current = true");
  expect(src).toContain("mutationLock.current = false");
  expect(src).toContain("disabled={pending || searching || !membershipId}");
 });
 it("locks template create before network mutation", () => {
  const src = source("src/components/projects/project-template-controls.tsx");
  expect(src).toContain("if (mutationLock.current || pending) return");
  expect(src).toContain("mutationLock.current = true");
  expect(src).toContain("mutationLock.current = false");
 });
});

describe("UX-G161 tracker recoverability and formula safety", () => {
 it("neutralizes Unicode-obscured formula prefixes without changing CSV row count", () => {
  const csv = trackerLogCsv([{
   id: "log", time: "2026-11-07T12:00:00Z",
   event: "\u200B=HYPERLINK(\"https://example.com\",\"click\")",
   path: "\u2060@SUM(1,1)", message: "\u0301+CMD\r\nsecond line",
   requestId: "ref", component: "svc",
  }]);
  expect(csv.startsWith("Time,Event,Route,Component,Reference,Message\n")).toBe(true);
  expect(csv).toContain("'\u200B=HYPERLINK");
  expect(csv).toContain("'\u2060@SUM");
  expect(csv).toContain("'\u0301+CMD second line");
  expect(csv.split("\n")).toHaveLength(2);
 });
 it("locks status changes while waiting for the refreshed version", () => {
  const src=source("src/components/tracker/audit-finding-status-action.tsx");
  expect(src).toContain("setStale(true);router.refresh()");
  expect(src).toContain("},[current,version])");
  expect(src).toContain("auditFindingStatusPayload(version,status)");
 });
});

describe("UX-G178 people CSV completeness and deduplication", () => {
 it("deduplicates overlapping membership pages and respects configured cap", () => {
  type Member = Parameters<typeof appendUniquePeopleCsvRows>[0][number];
  const member=(id:string)=>({membership:{id}}) as unknown as Member;
  const rows:Member[]=[];
  appendUniquePeopleCsvRows(rows,[member("a"),member("b"),member("a")],3);
  appendUniquePeopleCsvRows(rows,[member("b"),member("c"),member("d")],3);
  expect(rows.map(row=>row.membership.id)).toEqual(["a","b","c"]);
  expect(PEOPLE_CSV_CAP).toBe(1000);
 });
 it("keeps authorization and warns when pagination has a gap or truncation", () => {
  const src=source("src/modules/people/college-people-export-service.ts");
  expect(src).toContain('hasMembershipRole(context, "COLLEGE_ADMIN")');
  expect(src).toContain('requirePermission(context, "people.manage"');
  expect(src).toContain("appendUniquePeopleCsvRows(rows, page.items)");
  expect(src).toContain("rows.length < Math.min(total, PEOPLE_CSV_CAP)");
  const sa=source("src/modules/people/admin-users-export-service.ts");
  expect(sa).toContain("seen.has(row.membershipId)");
  expect(sa).toContain("items.length<Math.min(first.total,SUPER_ADMIN_PEOPLE_CSV_CAP)");
 });
});

describe("UX-G184 shared route recovery", () => {
 it("gives each role a meaningful error destination and loading announcement", () => {
  for(const [role,href] of [["admin","/admin/tenants"],["teacher","/teacher/courses"]] as const){
   const error=source("src/app/(authenticated)/"+role+"/error.tsx");
   expect(error).toContain('homeHref="'+href+'"');
   expect(error).toContain("insideShell");
  }
  for(const role of ["admin","teacher","hr"]){
   const loading=source("src/app/(authenticated)/"+role+"/loading.tsx");
   expect(loading).toContain('label="Loading ');
   expect(loading).toContain('shape="directory"');
  }
  for(const role of ["admin","college-admin","hr","teach","teacher"]){
   expect(source("src/app/(authenticated)/"+role+"/not-found.tsx")).toContain("Page not found");
  }
 });
});
