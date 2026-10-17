import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const s=(path:string)=>readFileSync(path,"utf8");
describe("TPO batches lifecycle legacy parity",()=>{
 it("TPO-batches-26 accepts missing lifecycle version and displays legacy finish and reopen consequences",()=>{
  const service=s("src/modules/placements/tpo-batch-lifecycle-service.ts");
  const ui=s("src/components/tpo/tpo-batch-lifecycle-control.tsx");
  expect(service).toContain('z.literal("none")');
  expect(service).toContain('if(input.action!=="FINISH"||input.expectedVersion!=="none")');
  expect(service).toContain("invitedAt:null,finishedAt:now");
  expect(service).toContain("await auditTpoJobChange").toBe(false); // cohort audit uses activity_events
  expect(service).toContain('eventType:"placements.batch.finished"');
  expect(ui).toContain("It leaves the working set: hidden from Placement eligibility by default");
  expect(ui).toContain("It comes back into the working set");
  expect(ui).toContain('"Batch finished":"Batch reopened"');
  expect(ui).toContain('outcome.changed');
 });
});
