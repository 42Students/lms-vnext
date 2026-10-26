import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoStudentPrototypeJourneySteps,tpoStudentVerifiedSnapshotCount} from "@/modules/placements/tpo-student-journey-strip-model";
const file=(path:string)=>readFileSync(path,"utf8");

describe("TPO prototype Students / All students",()=>{
 it("keeps the authorized roster as the only source for preview selection",()=>{
  const source=file("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(source).toContain("const active=matches.length===1?matches[0]!:null");
  expect(source).toContain("const preview=selected?active:sortedRows[0]??null");
  expect(source).toContain('data-testid="tpo.students.prototype-roster"');
  expect(source).toContain("<TpoStudentRosterInspector student={preview}");
  expect(source).toContain("onOpen:row=>open(row.membershipId)");
  expect(source).toContain("selected&&!active");
 });
 it("preserves the full advanced student drawer through an explicit action",()=>{
  const source=file("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(source).toContain("const [fullDetailsOpen,setFullDetailsOpen]=useState(false)");
  expect(source).toContain("onDetails={()=>open(preview.membershipId,true)}");
  expect(source).toContain("active&&fullDetailsOpen?<TpoStudentQuickPanel");
  expect(source).toContain("onNavigate={id=>open(id,true)}");
  expect(source).toContain('onClose={()=>setFullDetailsOpen(false)}');
  expect(source).toContain("TpoStudentsSelection");
 });
 it("derives summary metrics from persisted student evidence instead of prototype examples",()=>{
  const inspector=file("src/components/tpo/tpo-student-roster-inspector.tsx");
  for(const fragment of ["student.displayName","student.rollNumber","student.branchName","student.cohortName",
   "student.verification.status","student.verification.waitingSections","student.applicationCount",
   "student.offerCount","student.bestSoFar","student.offersAwaitingAnswer"]){
   expect(inspector).toContain(fragment);
  }
  expect(inspector).toContain('data-testid="tpo.students.prototype-inspector"');
  expect(inspector).toContain('hasResume===undefined?"Not recorded"');
  expect(inspector).toContain('student.marksVerified===true?"Verified"');
  expect(inspector).not.toContain("420 students");
  expect(inspector).not.toContain("Bhavana Rao");
 });
 it("does not leak email by default and preserves authorized advanced paths",()=>{
  const inspector=file("src/components/tpo/tpo-student-roster-inspector.tsx");
  expect(inspector).not.toContain("student.email");
  expect(inspector).toContain('href="/tpo/verification"');
  expect(inspector).toContain('href={studentHref+"/history"}');
  expect(inspector).toContain('href={studentHref+"/participation"}');
  expect(inspector).toContain('onDismiss');
 });
 it("renders the five original journey stages from verified source counts, not fixture values",()=>{
  const summary={activeLearners:40,placementPool:35,readyNotApplying:8,
   needsReadinessSupport:2,notRegistered:5,applying:20,placed:10,
   placedInPool:10,placedOutsidePool:0,readinessUnverified:true as const};
  const steps=tpoStudentPrototypeJourneySteps(summary,null);
  expect(steps.map(item=>item.label)).toEqual(["Eligible","Registered","Verified","Applying","Placed"]);
  expect(steps.map(item=>item.count)).toEqual([40,35,null,20,10]);
  expect(steps[2]?.percent).toBeNull();
  expect(tpoStudentPrototypeJourneySteps(summary,32)[2]?.count).toBe(32);
  expect(tpoStudentPrototypeJourneySteps(summary,99)[2]?.count).toBeNull();
  const src=file("src/app/(authenticated)/tpo/students/page.tsx");
  expect(src).toContain("tpoStudentPrototypeJourneySteps(summary,verifiedCount)");
  expect(src).toContain("Verification total unavailable");
 });
 it("requires the entire authorized student snapshot and explicit status for Verified",()=>{
  const record=(status:string)=>({verification:{status}});
  expect(tpoStudentVerifiedSnapshotCount({expectedTotal:2,rows:[record("VERIFIED"),record("WAITING")]})).toBe(1);
  expect(tpoStudentVerifiedSnapshotCount({expectedTotal:3,rows:[record("VERIFIED"),record("WAITING")]})).toBeNull();
  expect(tpoStudentVerifiedSnapshotCount({expectedTotal:2,rows:[record("VERIFIED"),record("UNKNOWN")]})).toBeNull();
  expect(tpoStudentVerifiedSnapshotCount({expectedTotal:2,rows:null})).toBeNull();
 });
 it("places the original eight visible student columns first without losing advanced grid fields",()=>{
  const src=file("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(src).toContain('const legacyVisibleColumns=["student","number","branch","stage","profile","best","applications","offers"]');
  expect(src).toContain("TpoGrid integratedWorkspace");
  expect(src).toContain("columns={displayColumns}");
  expect(src).toContain("TpoStudentRosterInspector student={preview}");
 });

});
