import {describe,expect,it} from "vitest";
import {decideTpoLeadOwnerChange} from "@/modules/placements/tpo-bulk-lead-owner-model";
import {decideTpoBulkLeadStage} from "@/modules/placements/tpo-bulk-lead-stage-model";
const id="ea132852-770b-4cf1-8548-c16733bd0917",owner="ef386a9b-b61d-42df-b038-6025548f7c36";
describe("TPO-recruiters-R03 bulk actions on joined and unsubscribed",()=>{
 it("allows a different owner even after joining",()=>{
  expect(decideTpoLeadOwnerChange({ownerMembershipId:null,recruiterUserId:id,unsubscribedAt:null},
   {id,expectedOwnerMembershipId:null},owner).status).toBe("updated");
 });
 it("can park an unsubscribed contact while preserving its opt-out",()=>{
  const decision={action:"NOT_NOW" as const,confirmed:true as const,reason:"Not hiring",
   revisitDate:null,selections:[{id,expectedStage:"CONTACTED" as const}]};
  expect(decideTpoBulkLeadStage({manualStage:"CONTACTED",recruiterUserId:null,
    unsubscribedAt:new Date(),notNowReason:null,notNowUntil:null},
    decision.selections[0],decision).status).toBe("updated");
 });
});
