import {describe,expect,it} from "vitest";
import {tpoDriveStatusLabel,projectTpoDriveLifecycle}
 from "@/modules/placements/tpo-drive-lifecycle-list-model";
describe("TPO-drives-R04 cancelled vs closed list",()=>{
 it("keeps cancelled jobs in Closed counts and view with distinct labels",()=>{
  const rows=[
   {id:"a",title:"Role A",company:"A",status:"CLOSED",workMode:"ONSITE",employmentType:"FULL_TIME",applicationDeadline:null},
   {id:"b",title:"Role B",company:"A",status:"CANCELLED",workMode:"ONSITE",employmentType:"FULL_TIME",applicationDeadline:null},
  ];
  const projected=projectTpoDriveLifecycle(rows,"CLOSED","2026-10-16T12:00:00Z");
  expect(projected.counts.closed).toBe(2);
  expect(projected.rows).toHaveLength(2);
  expect(tpoDriveStatusLabel("CANCELLED")).toBe("Cancelled");
  expect(tpoDriveStatusLabel("CLOSED")).toBe("Closed");
 });
});