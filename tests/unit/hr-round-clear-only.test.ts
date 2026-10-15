import {expect,it} from "vitest";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
const base={action:"UPDATE",roundId:"11111111-1111-4111-8111-111111111111",expectedUpdatedAt:"2026-10-15T12:00:00+05:30"};
it("treats null mode as an intentional edit, not an absent change",()=>{
 const parsed=hrRoundFormSchema.safeParse({...base,mode:null});
 expect(parsed.success).toBe(true);
 if(parsed.success)expect(parsed.data.mode).toBeNull();
 expect(hrRoundFormSchema.safeParse(base).success).toBe(false);
});
