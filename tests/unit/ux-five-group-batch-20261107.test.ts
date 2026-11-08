import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appendUniquePeopleCsvRows, PEOPLE_CSV_CAP } from "@/modules/people/college-people-export-model";
import {neutralStudentCsvCell,studentImportReportCsv} from "@/modules/people/college-student-csv-model";
import {neutralizeContactCell} from "@/modules/people/college-contacts-export-model";
import { trackerLogCsv } from "@/components/tracker/tracker-live-logs-explorer";
import { trackerReportSchema } from "@/modules/bug-tracker/report-input-model";

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
 it("freezes all roster selections while a save outcome or confirmation is unresolved", () => {
  const src = source("src/components/attendance/faculty-attendance-workspace.tsx");
  const markOne = src.slice(src.indexOf("function markOne("), src.indexOf("function requestAttendanceConfirmation()"));
  expect(markOne).toContain("submitLock.current || writeUnknown || confirmingAttendance");
  const roster = src.slice(src.indexOf('aria-label="Attendance roster"'), src.indexOf('{selectedSession?.attendanceStatus==="MARKED"?('));
  expect(roster.match(/disabled=\{markingWindow !== "OPEN" \|\| submitting \|\| writeUnknown \|\| submitLock\.current \|\| confirmingAttendance\}/g)).toHaveLength(2);
  const bulk = src.slice(src.indexOf('className="take-attendance-panel__tools'), src.indexOf('aria-label="Attendance roster"'));
  expect(bulk.match(/writeUnknown \|\| submitLock\.current \|\| confirmingAttendance/g)).toHaveLength(4);
 });
 it("locks a faculty schedule mutation before the first network await", () => {
  const src = source("src/components/attendance/faculty-attendance-schedule-editor.tsx");
  expect(src).toContain("if(busy||writeLock.current)return");
  expect(src).toContain("writeLock.current=true");
  expect(src).toContain("writeLock.current=false");
  expect(src).toContain("expectedUpdatedAt:selected?.updatedAt");
 });
 it("makes Faculty confirm the exact IST window and reschedule intent", () => {
  const src = source("src/components/attendance/faculty-attendance-schedule-editor.tsx");
  expect(src).toContain('?"Schedule an attendance session":"Reschedule an attendance session"');
  expect(src).toContain('description={`Session:');
  expect(src).toContain('${startsAt.replace("T"," ")} IST');
  expect(src).toContain('${endsAt.replace("T"," ")} IST');
  expect(src).toContain('location.trim()');
  expect(src).toContain('This updates the selected unmarked session.');
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
 it("locks template publish/archive/duplicate and project member promote/remove before awaiting I/O", () => {
  const template=source("src/components/projects/project-template-controls.tsx");
  const actions=template.slice(template.indexOf("export function ProjectTemplateActions("));
  expect(actions).toContain("if(operationLock.current || pending!==null)return");
  expect(actions).toContain("operationLock.current = true");
  expect(actions).toContain("operationLock.current = false");
  const team=source("src/components/projects/project-team-controls.tsx");
  const memberActions=team.slice(team.indexOf("export function ProjectMemberActions("),
    team.indexOf("export function MentorLearnerTeamActions("));
  expect(memberActions.match(/if\(memberActionLock\.current \|\| pending\)return/g)).toHaveLength(2);
  expect(memberActions.match(/memberActionLock\.current = false/g)).toHaveLength(2);
 });
 it("locks metadata and plan template writes before an awaited confirmation or PATCH", () => {
  const overview=source("src/components/projects/template-metadata-edit-control.tsx");
  expect(overview).toContain("if(pending||submitLock.current||!confirmed)return");
  expect(overview).toContain("submitLock.current=true");
  expect(overview).toContain("finally{submitLock.current=false;setPending(false)");
  const plan=source("src/components/projects/super-admin-template-plan-editor.tsx");
  expect(plan).toContain("if (pending || saveLock.current) return");
  expect(plan).toContain("saveLock.current = true");
  expect(plan.indexOf("saveLock.current = true")).toBeLessThan(
    plan.indexOf('await askConfirm("Save changes as a new template version?")'));
  expect(plan).toContain("saveLock.current = false");
 });
 it("preserves cross-page selected college labels without trusting them for authorization", () => {
  const src=source("src/components/projects/super-admin-template-college-bulk.tsx");
  expect(src).toContain("savedSelection.find(row=>row.id===id)");
  expect(src).toContain("expectedCollegeIds:[...current].sort()");
  expect(src).toContain("collegeIds:desired.sort()");
 });
});

describe("UX-G161 tracker recoverability and formula safety", () => {
 it("accepts the complete signed-in report form contract and rejects missing screen", () => {
  const payload={
    reporterName:"Seed Superadmin",accountRole:"SUPER_ADMIN",
    environment:"DEVELOPMENT",page:"Dashboard",screen:"Overview",
    section:null,issueType:"UI / Alignment",severity:"NOT_SURE",
    description:"E2E UX acceptance: navigation label did not fit at mobile width.",
    evidenceLink:null,sourceUrl:"http://localhost:3000/tracker",
    sourcePath:"/tracker",browser:"Playwright",viewport:"1280x800",
  };
  const valid=trackerReportSchema.safeParse(payload);
  expect(valid.success,valid.success?"":JSON.stringify(valid.error.issues)).toBe(true);
  expect(trackerReportSchema.safeParse({...payload,screen:null}).success).toBe(false);
 });

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
 it("synchronously guards manual Telegram sends before the first API await", () => {
  const src=source("src/components/tracker/tracker-telegram-manual-panel.tsx");
  expect(src).toContain("const sendLock=useRef(false)");
  expect(src).toContain("if(pending||sendLock.current)return");
  expect(src).toContain("sendLock.current=true");
  expect(src).toContain("finally{sendLock.current=false;setPending(false)");
  expect(src).toContain('title={confirm==="TEST"?"Send a Telegram test alert?":"Send the daily digest to Telegram now?"}');
  expect(src).toContain("Manual sends are rate-limited.");
 });
 it("resets idempotency retries when the reporter changes page or screen", () => {
  const form=source("src/components/tracker/tracker-report-form.tsx");
  expect(form).toContain('retryKeyRef.current=null;\n              setDraft(current=>({...current,page:');
  expect(form).toContain('retryKeyRef.current=null;\n                setDraft(current=>({...current,screen:');
 });
 it("serializes all three workflow mutations and requires a fresh issue version", () => {
  const src=source("src/components/tracker/tracker-workflow-panel.tsx");
  expect(src).toContain("const mutationLock = useRef(false)");
  expect(src).toContain("const [needsRefresh, setNeedsRefresh] = useState(false)");
  expect(src).toContain("if (pending || needsRefresh || mutationLock.current) return false");
  expect((src.match(/startExclusiveMutation\(async/g)??[]).length).toBe(3);
  expect(src).toContain("mutationLock.current = true");
  expect(src).toContain("finally { mutationLock.current = false; }");
  expect((src.match(/setNeedsRefresh\(true\)/g)??[]).length).toBeGreaterThanOrEqual(3);
  expect(src).toContain("Refresh the issue before making another change");
  expect(src).toContain("expectedVersion:issue.version");
 });
 it("locks status changes while waiting for the refreshed version", () => {
  const src=source("src/components/tracker/audit-finding-status-action.tsx");
  expect(src).toContain("setStale(true);router.refresh()");
  expect(src).toContain("},[publicId,current,version])");
  expect(src).toContain("auditFindingStatusPayload(version,status)");
 });
});

describe("UX-G178 people CSV completeness and deduplication", () => {
 it("defuses invisible combining marks in college contacts CSV without changing ordinary labels", () => {
  for(const dangerous of ["\u20DD=HYPERLINK(1)","\u0903@SUM(1,2)","\u2060+CMD","\u034F-2+5"]) {
   expect(neutralizeContactCell(dangerous)).toBe('"' + "'" + dangerous + '"');
  }
  expect(neutralizeContactCell("College Faculty")).toBe('"College Faculty"');
  expect(neutralizeContactCell('"Quoted"')).toBe('"""Quoted"""');
 });

 it("defuses invisible Unicode formulas in student import report cells", () => {
  for(const dangerous of ["\u2060=HYPERLINK(1)","\u200B@SUM(1,2)","\u034F+CMD","\uFEFF-1+2","\u2028=1"]) {
   expect(neutralStudentCsvCell(dangerous)).toBe('"' + "'" + dangerous + '"');
   expect(studentImportReportCsv([{row:2,status:"INVALID",detail:dangerous}]))
    .toContain('"' + "'" + dangerous + '"');
  }
  expect(neutralStudentCsvCell("A normal name")).toBe('"A normal name"');
  expect(neutralStudentCsvCell('"A quoted name"')).toBe('"""A quoted name"""');
  expect(neutralStudentCsvCell(" =1+2")).toBe('"\' =1+2"');
 });

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
  const fixture=source("src/app/e2e/ux-g184-authenticated-states/page.tsx");
  expect(fixture).toContain('process.env.NODE_ENV!=="development"');
  expect(fixture).toContain('process.env.UX_G184_ROUTE_STATE_FIXTURE!=="1"');
  expect(fixture).toContain('(role==="college-admin"&&state!=="not-found")');
    for(const role of ["admin","college-admin","hr","teach","teacher"]){
   expect(source("src/app/(authenticated)/"+role+"/not-found.tsx")).toContain("Page not found");
  }
 });
});
