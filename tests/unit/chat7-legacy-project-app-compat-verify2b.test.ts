import {describe,it,expect} from "vitest";
import {legacyLearnerProjectProjection,LEGACY_LEARNER_PROJECT_FIELDS} from "@/modules/projects/legacy-learner-project-dto";
import {LEGACY_APPLICATION_STATUS_CROSSWALK,LEGACY_REAPPLY_DECISION,isLegacyAppliedStatus} from "@/modules/placements/legacy-application-status-crosswalk";

describe("legacy project and application view compatibility",()=>{
 it("keeps missing project labels null and caps valid progress",()=>{
   expect(legacyLearnerProjectProjection({id:"project"})).toEqual({
    id:"project",course:null,mentor:null,phase:null,nextDue:null,progress:0,status:"UNKNOWN"});
   expect(legacyLearnerProjectProjection({id:"p",completedTasks:12,activeTasks:10,status:"ACTIVE"}).progress).toBe(100);
   expect(LEGACY_LEARNER_PROJECT_FIELDS.map(row=>row.legacy)).toEqual(["course","mentor","phase","nextDue","progress","status"]);
 });
 it("never treats the display-only APPLIED label as an unrestricted reapply",()=>{
   expect(isLegacyAppliedStatus(" applied ")).toBe(true);
   expect(LEGACY_APPLICATION_STATUS_CROSSWALK.find(row=>row.legacy==="APPLIED")?.application).toBe("SUBMITTED");
   expect(LEGACY_REAPPLY_DECISION.default).toBe("DENY");
   expect(LEGACY_REAPPLY_DECISION.denyOnBookedInterview).toBe(true);
 });
});
