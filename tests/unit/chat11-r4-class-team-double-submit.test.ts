import {expect,it} from "vitest";
import {mayBeginClassTeamCreation} from "@/modules/projects/class-team-create-once-model";
it("blocks a second create while the first request is in flight",()=>{
 expect(mayBeginClassTeamCreation(false,true)).toBe(true);
 expect(mayBeginClassTeamCreation(true,true)).toBe(false);
 expect(mayBeginClassTeamCreation(false,false)).toBe(false);
});
