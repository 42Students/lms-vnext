import {it,expect} from "vitest";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
it("round update must have a concurrency token and bounded duration",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(hrRoundFormSchema.safeParse({action:"UPDATE",roundId:id,expectedUpdatedAt:"2026-10-15T12:00:00.000Z",name:"Tech"}).success).toBe(true);
 expect(hrRoundFormSchema.safeParse({action:"UPDATE",roundId:id,name:"Tech"}).success).toBe(false);
 expect(hrRoundFormSchema.safeParse({action:"CREATE",kind:"INTERVIEW",name:"Interview",durationMinutes:1500}).success).toBe(false);
});
