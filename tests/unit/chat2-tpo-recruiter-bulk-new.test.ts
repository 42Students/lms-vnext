import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {confirmedTpoBulkLeadStageSchema,decideTpoBulkLeadStage} from "@/modules/placements/tpo-bulk-lead-stage-model";
const src=(p:string)=>readFileSync(p,"utf8");
const id="11111111-1111-4111-8111-111111111111";
const payload={action:"NEW",confirmed:true,selections:[{id,expectedStage:"NOT_NOW"}]};
describe("TPO recruiter bulk return-to-new",()=>{
 it("TPO-recruiters-41 accepts a confirmed New manual stage without reason and rejects unsupported stage",()=>{
  expect(confirmedTpoBulkLeadStageSchema.safeParse(payload).success).toBe(true);
  expect(confirmedTpoBulkLeadStageSchema.safeParse({...payload,action:"RECRUITED"}).success).toBe(false);
  expect(confirmedTpoBulkLeadStageSchema.safeParse({...payload,reason:"Forged"}).success).toBe(false);
 });
 it("TPO-recruiters-41 returns New from Not Now but keeps already New unchanged",()=>{
  const base={manualStage:"NOT_NOW",recruiterUserId:null,unsubscribedAt:null,
   notNowReason:"Later",notNowUntil:null};
  const selection=payload.selections[0] as {id:string;expectedStage:"NOT_NOW"};
  const decision=confirmedTpoBulkLeadStageSchema.parse(payload);
  expect(decideTpoBulkLeadStage(base,selection,decision).status).toBe("updated");
  expect(decideTpoBulkLeadStage({...base,manualStage:"NEW"},{id,expectedStage:"NEW"},decision).status).toBe("unchanged");
 });
 it("TPO-recruiters-41 retains locked audit, clearing Not Now reasons and five-minute undo",()=>{
  const service=src("src/modules/placements/tpo-bulk-lead-stage-service.ts");
  const ui=src("src/components/tpo/recruiter-bulk-stage-controls.tsx");
  expect(service).toContain('input.action === "NEW"');
  expect(service).toContain('manualStage:"NEW",notNowReason:null,notNowUntil:null');
  expect(service).toContain('eventType:"PLACEMENTS_RECRUITER_BULK_STAGE"');
  expect(ui).toContain('<option value="NEW">Restore to New</option>');
  expect(ui).toContain('"/api/placements/tpo/leads/bulk-undo"');
  expect(ui).toContain("five minutes");
 });
});
