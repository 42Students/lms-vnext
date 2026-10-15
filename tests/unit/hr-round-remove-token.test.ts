import {expect,it} from "vitest";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
it("requires version tokens for delete and update but not creation",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:id,expectedUpdatedAt:"2026-10-15T00:00:00.000Z"}).success).toBe(true);
 expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:id}).success).toBe(false);
});
