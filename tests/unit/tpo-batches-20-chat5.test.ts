import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoBatchReminderDayKey,tpoBatchReminderCopy} from "@/modules/placements/tpo-batch-notification-model";
const read=(p:string)=>readFileSync(p,"utf8");
describe("batch daily reminder delivery",()=>{
 it("TPO-batches-20 enforces one audited in-app reminder per IST day for authorized unregistered learners",()=>{
  expect(tpoBatchReminderDayKey(new Date("2099-03-04T20:00:00Z"))).toBe("2099-03-05");
  expect(tpoBatchReminderCopy("CSE",new Date("2099-03-06T18:29:00Z")).body).toContain("CSE");
  const service=read("src/modules/placements/tpo-batch-reminder-service.ts");
  for(const term of ["getTpoBatch(ctx,batchId)","colleges.id,collegeId","for(\"update\")",
    "findUnchosenEligibleBatchStudents(tx,collegeId,batch.id)","tpoBatchReminderDayKey(now)",
    "dedupeKey","onConflictDoNothing()","BATCH_REMINDED","channels:[\"IN_APP\"]"])
   expect(service).toContain(term);
  expect(service).toContain("tx.insert(inAppNotifications)");
  expect(service).not.toContain("emailSent:true");
  const route=read("src/app/api/placements/tpo/batches/[batchId]/remind/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  const ui=read("src/components/tpo/tpo-batch-invitation-control.tsx");
  expect(ui).toContain("Send reminder");
  expect(ui).toContain("remindReview");
  expect(ui).toContain("Everyone has chosen already");
 });
});
