import {expect,it} from "vitest";
import {canEditClassTeamPlanner} from "@/modules/projects/class-team-edit-guard-model";
it("prevents edits to team assignments and identifiers during a pending create",()=>{
 expect(canEditClassTeamPlanner(true,false)).toBe(false);
 expect(canEditClassTeamPlanner(false,true)).toBe(false);
 expect(canEditClassTeamPlanner(false,false)).toBe(true);
});
