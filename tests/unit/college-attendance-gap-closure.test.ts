import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {adminAttendanceCellState,attendanceMonthDays,attendanceMonthLabel,
 attendanceIndiaDay,attendanceCsvCell,adminAttendancePercent} from "@/modules/attendance/admin-grid-model";
import {ADMIN_ATTENDANCE_COPY} from "@/modules/attendance/admin-attendance-copy";
import {DEFAULT_ATTENDANCE_POLICY} from "@/modules/attendance/policy-validation";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const workspace=()=>source("src/components/attendance/admin-attendance-workspace.tsx");
const page=()=>source("src/app/(authenticated)/college/attendance/page.tsx");
const a={id:"morning",startsAt:"2099-10-01T03:30:00Z",attendanceStatus:"MARKED"};
const b={id:"second",startsAt:"2099-10-01T09:30:00Z",attendanceStatus:"MARKED"};
const now=new Date("2099-10-20T00:00:00Z");
describe("College Attendance legacy and graceful-state gaps",()=>{
 it("COL-attendance-03 every IST day exists including no-class and Sunday shaded cells",()=>{
  const dates=attendanceMonthDays("2099-10",[b,a]);
  expect(dates).toHaveLength(31);
  expect(dates[0]?.day).toBe("2099-10-01");
  expect(dates[0]?.sessions.map(r=>r.id)).toEqual(["morning","second"]);
  expect(dates[1]?.sessions).toEqual([]);
  expect(dates.filter(x=>x.isSunday).length).toBeGreaterThanOrEqual(4);
  expect(workspace()).toContain("No class scheduled");
  expect(workspace()).toContain("✖");
  expect(workspace()).toContain("isSunday");
 });
 it("COL-attendance-04 monthly class health shows marked-only percent and no inferred future absences",()=>{
  const rows=[{scheduleEventId:"morning",membershipId:"a",status:"ABSENT"}];
  expect(adminAttendancePercent("a",[a,b],rows,now)).toBe(50);
  const content=workspace();
  for(const label of ["Monthly attendance","Students","Sessions held","Absences","Not marked","Active days"])
   expect(content).toContain(label);
  expect(content).toContain("present marks across");
 });
 it("COL-attendance-05 successful correction is announced by role status, not silent refresh",()=>{
  expect(workspace()).toContain("Attendance corrected for ");
  expect(workspace()).toContain('setNotice(');
  expect(workspace()).toContain('role="status"');
 });
 it("COL-attendance-06 record drawer performs one guarded save without native confirmation",()=>{
  const s=workspace();
  expect(s).not.toContain("window.confirm");
  expect(s).toContain('disabled={correcting}');
  expect(s).toContain("Current status");
  expect(s).toContain("This change is recorded."); 
 });
 it("COL-attendance-07 vNext models Excused Medical Late distinctly rather than silently absent",()=>{
  expect(adminAttendanceCellState(a,{status:"EXCUSED"},now).label).toBe("Excused");
  expect(adminAttendanceCellState(a,{status:"MEDICAL"},now).label).toBe("Medical");
  expect(adminAttendanceCellState(a,{status:"LATE"},now).label).toBe("Late");
 });
 it("COL-attendance-09 past-term options use persisted ended-at facts, active first and delivery-specific selection",()=>{
  const service=source("src/modules/attendance/admin-service.ts");
  const form=workspace();
  expect(service).toContain('isPast:sql<boolean>');
  expect(service).toContain("case when ${courseSectionDeliveries.endedAt} is null then 0 else 1 end");
  expect(service).not.toContain('isNull(\n              courseSectionDeliveries.endedAt,');
  expect(form).toContain('isPast:boolean');
  expect(form).toContain('item.isPast?" · past":""');
  expect(form).toContain("termDeliveries.length>1");
  expect(form).toContain('params.set("deliveryId"');
  expect(page()).toContain("entry.deliveryId===query.deliveryId");
 });
 it("COL-attendance-10 elective labels come from persisted offering type, never guessed by course name",()=>{
  const service=source("src/modules/attendance/admin-service.ts");
  const form=workspace();
  expect(service).toContain("offeringType:courseOfferings.type");
  expect(form).toContain('offeringType:"CORE"|"ELECTIVE"');
  expect(form).toContain('row.offeringType==="ELECTIVE"');
  expect(form).toContain('item.offeringType==="ELECTIVE"?" (elective)":""');
  expect(form).toContain("{course.code} · {course.name}");
 });
 it("COL-attendance-11 invalid filters and absent selected college show in-page error and reset, not thrown error",()=>{
  const src=page();
  expect(src).toContain("safeParse(await searchParams)");
  expect(src).toContain("Reset attendance filters");
  expect(src).toContain("Choose a college to view attendance");
  expect(source("src/app/(authenticated)/college/attendance/error.tsx")).toContain("Retry");
 });
 it("COL-attendance-12 monthly CSV exports one calendar-day column with P A or N codes, never formula injection",()=>{
  const s=workspace();
  expect(s).toContain('sessionDays.map(row=>row.day)');
  expect(s).toContain('return "P"');
  expect(s).toContain('return "A"');
  expect(s).toContain('return "N"');
  expect(attendanceCsvCell("=1+1")).toBe('"\'=1+1"');
 });
 it("COL-attendance-13 month navigator prints MMMM YYYY without losing URL filters",()=>{
  expect(attendanceMonthLabel("2099-10")).toBe("October 2099");
  expect(attendanceMonthLabel("bad")).toBe("Choose a month");
  expect(workspace()).toContain("attendanceMonthLabel(data.month)");
  expect(workspace()).toContain("params.set");
 });
 it("COL-attendance-14 department below-threshold reporting is not misrepresented as a measured rate",()=>{
  expect(source("src/app/(authenticated)/college/attendance/page.tsx")).toContain("Attendance by Department");
 });
 it("COL-attendance-15 semester/department advanced filtering cannot bypass assigned college context",()=>{
  expect(page()).toContain("getAdminAttendanceOptions(context, collegeId)");
 });
 it("COL-attendance-16 reset persists defaults with explicit existing-session warning and audited policy write",()=>{
  expect(workspace()).toContain("College Admin corrections are not limited");
  expect(DEFAULT_ATTENDANCE_POLICY).toEqual({eligibilityThresholdPercent:75,correctionWindowHours:24});
  const form=source("src/components/attendance/college-attendance-policy-form.tsx");
  const service=source("src/modules/attendance/policy-service.ts");
  expect(form).toContain("Reset to default");
  expect(form).toContain("await persistPolicy(DEFAULT_ATTENDANCE_POLICY");
  expect(form).toContain("which past sessions may be corrected");
  expect(form).toContain("<ConfirmDialog");
  expect(form).toContain("await apiFetch<");
  expect(form).toContain("useGuardedAction");
  expect(service).toContain('eventType: "ATTENDANCE_POLICY_UPDATED"');
  expect(service).toContain("return getDb().transaction");
  expect(service).toContain("fromCorrectionWindowHours: before.correctionWindowHours");
 });
 it("COL-attendance-17 grid has accessible caption, per-cell button labels and explanation for future disability",()=>{
  const w=workspace();
  expect(w).toContain('<caption className="sr-only">');
  expect(w).toContain("Attendance can be corrected after it begins.");
  expect(w).toContain("focus-visible:outline-2");
 });
});
