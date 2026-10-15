import {expect,it} from "vitest";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
const row={action:"CREATE",kind:"INTERVIEW",name:"Technical Interview"};
it.each(["Round\rForged","Round\nForged","Round\tTab","Round\u0000Null"])(
 "rejects unsafe control characters in round title %s",name=>{
 expect(hrRoundFormSchema.safeParse({...row,name}).success).toBe(false);
});
it("accepts ordinary round names",()=>expect(hrRoundFormSchema.safeParse(row).success).toBe(true));
