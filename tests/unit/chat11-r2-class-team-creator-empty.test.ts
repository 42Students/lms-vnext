import {expect,it} from "vitest";
import {classTeamCreatorEmptyMessages} from "@/modules/projects/class-team-creator-empty-model";
it("distinguishes loading from no eligible classes",()=>{
 expect(classTeamCreatorEmptyMessages(true,0,1).classes).toBeNull();
 expect(classTeamCreatorEmptyMessages(false,0,1).classes).toMatch(/No active classes/);
});
it("explains the missing upstream template assignment",()=>{
 const state=classTeamCreatorEmptyMessages(false,1,0);
 expect(state.templates).toMatch(/template is assigned/);
 expect(state.classes).toBeNull();
});
it("does not show blocking empty states for a ready workspace",()=>{
 expect(classTeamCreatorEmptyMessages(false,2,3)).toEqual({classes:null,templates:null});
});
