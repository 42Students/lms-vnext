import {it,expect} from "vitest";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
const update={action:"UPDATE",roundId:"11111111-1111-4111-8111-111111111111",
 expectedUpdatedAt:"2026-10-15T10:00:00+05:30",name:"Technical"};
it("represents an explicit unscheduled mode without losing a partial update",()=>{
 expect(hrRoundFormSchema.parse({...update,mode:null}).mode).toBeNull();
 expect(hrRoundFormSchema.parse({...update,mode:"VIRTUAL"}).mode).toBe("VIRTUAL");
 expect(hrRoundFormSchema.parse({...update}).mode).toBeUndefined();
});
