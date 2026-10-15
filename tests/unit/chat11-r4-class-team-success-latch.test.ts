import {expect,it} from "vitest";
import {mayBeginClassTeamCreation} from "@/modules/projects/class-team-create-once-model";
it("keeps the synchronous latch engaged after success until navigation unmounts the form",()=>{
 const afterSuccess=true;
 expect(mayBeginClassTeamCreation(afterSuccess,true)).toBe(false);
});
it("permits a user-controlled retry after a failed POST releases the latch",()=>{
 const afterFailure=false;
 expect(mayBeginClassTeamCreation(afterFailure,true)).toBe(true);
});
