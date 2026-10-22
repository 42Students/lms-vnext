import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoDriveDayCheckInSchema} from "@/modules/placements/tpo-drive-day-checkin-model";
const source=(path:string)=>readFileSync(path,"utf8");
describe("chat-2 verify2 recruiter drives and full-day parity",()=>{
 it("retains only a same-user, same-college, same-filter snapshot through refresh failure",()=>{
  const page=source("src/app/(authenticated)/hr/drives/page.tsx");
  const retained=source("src/components/hr/recruiter-drives-retained.tsx");
  expect(page).toContain('const snapshotKey=context.user.id+":"+selectedCollege+":"+returnTo;');
  expect(page).toContain("<RecruiterDrivesRetained key={snapshotKey} failed>");
  expect(page).toContain("<RecruiterDrivesRetained key={snapshotKey} failed={false}>");
  expect(retained).toContain("This refresh failed. Showing the last successful drive list.");
  expect(retained).toContain("lastSuccessful??children");
  expect(retained).toContain("router.refresh()");
  expect(retained).not.toContain("localStorage");
  expect(retained).not.toContain("sessionStorage");
 });
 it("includes completed same-day rounds and never caps the all-day IST queue",()=>{
  const code=source("src/modules/placements/tpo-live-drive-day-service.ts");
  const queue=code.split("export async function getTpoLiveDriveDaySummary")[0]!;
  expect(queue).toContain('inArray(placementJobs.status,["PUBLISHED","CLOSED"])');
  expect(queue).toContain('ne(placementJobRounds.status,"CANCELLED")');
  expect(queue).toContain("gte(placementJobRounds.scheduledAt,day.start)");
  expect(queue).toContain("lt(placementJobRounds.scheduledAt,day.end)");
  expect(queue).not.toContain(".limit(");
  expect(code).toContain("dayRows, rows");
 });
 it("keeps optional room and absence notification semantics",()=>{
  const parsed=tpoDriveDayCheckInSchema.parse({confirmed:true,
   applicationId:"11111111-1111-4111-8111-111111111111",
   expectedAttendance:"WAITING",status:"PRESENT"});
  expect(parsed.room).toBeUndefined();
  expect(tpoDriveDayCheckInSchema.parse({...parsed,room:null}).room).toBeNull();
  const code=source("src/modules/placements/tpo-drive-day-checkin-service.ts");
  expect(code).toContain("input.room===undefined?prior?.room??null:input.room");
  expect(code).toContain('prior?.status !== "ABSENT"');
  expect(code).toContain('kind: "MARKED_ABSENT"');
 });
});
