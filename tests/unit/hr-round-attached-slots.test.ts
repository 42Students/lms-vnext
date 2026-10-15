import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {canRecruiterEditRound} from "@/modules/placements/hr-round-editor-model";
it("blocks edits/removals of a round with an attached registered interview slot",()=>{
 const input={status:"PENDING",createdByUserId:"r",recruiterUserId:"r",hasResults:false};
 expect(canRecruiterEditRound(input)).toBe(true);
 expect(canRecruiterEditRound({...input,hasSlots:true})).toBe(false);
});
it("uses registered slot ownership in both write and read editor decisions",()=>{
 const service=readFileSync("src/modules/placements/hr-round-editor-service.ts","utf8");
 expect(service).toContain('from "@/db/schema/placement-hr-interview-slots"');
 expect(service).toContain("hasSlots:Boolean(attachedSlot)");
 expect(service).toContain("hasSlots:slotIds.has(row.id)");
});
