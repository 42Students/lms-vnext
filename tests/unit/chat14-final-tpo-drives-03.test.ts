import {describe,it,expect} from "vitest";
import {projectTpoDriveLifecycle,driveRequestStatusLabel} from "@/modules/placements/tpo-drive-lifecycle-list-model";
describe("chat-14 final sprint",()=>{
 it("TPO-drives-03 WRONG: cancelled drives belong to Closed and rejected requests remain separate",()=>{
  const base={id:"job",title:"Internship",company:"Example",workMode:"HYBRID",employmentType:"INTERNSHIP",applicationDeadline:null};
  const rows=projectTpoDriveLifecycle([{...base,status:"CLOSED"},{...base,id:"cancelled",status:"CANCELLED"},{...base,id:"live",status:"PUBLISHED"}],"CLOSED","2099-01-01T00:00:00Z");
  expect(rows.rows.map(row=>row.id)).toEqual(["cancelled","job"]);
  expect(rows.counts.closed).toBe(2);
  expect(driveRequestStatusLabel("REJECTED")).toBe("Declined");
 });
});