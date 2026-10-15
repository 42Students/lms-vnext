import {expect,it} from "vitest";
import {canRefreshClassTeamRoster} from "@/modules/projects/class-team-roster-refresh-model";
it("allows an explicit roster refresh only for a selected class",()=>{
 expect(canRefreshClassTeamRoster("class-1",false,false)).toBe(true);
 expect(canRefreshClassTeamRoster("",false,false)).toBe(false);
});
it("never resets the preview during a pending create or load",()=>{
 expect(canRefreshClassTeamRoster("class-1",true,false)).toBe(false);
 expect(canRefreshClassTeamRoster("class-1",false,true)).toBe(false);
});
