import {it,expect} from "vitest";
import {prepareTpoBatchReminder} from "@/modules/placements/tpo-communication-prep-model";
it("keeps missing registration evidence unknown and never claims delivery",()=>{
 const input={batchName:"CSE",unrecorded:0,activeLearners:100,available:false,finished:false};
 expect(prepareTpoBatchReminder(input).status).toMatch(/unavailable/);
 expect(prepareTpoBatchReminder({...input,available:true,unrecorded:7}).status).toContain("7 of 100");
 expect(prepareTpoBatchReminder({...input,available:true,finished:true}).status).toMatch(/finished/);
});
