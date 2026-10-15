import {expect,it} from "vitest";
import {resolveMentorActivityProjectId} from "@/modules/projects/mentor-project-event-attribution";
const own="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
it("refuses to attribute another project subject through spoofed metadata",()=>{
 const allowed=new Set([own]);
 expect(resolveMentorActivityProjectId({subjectType:"project",subjectId:foreign,metadataProjectId:own},allowed)).toBeNull();
 expect(resolveMentorActivityProjectId({subjectType:"project",subjectId:own,metadataProjectId:foreign},allowed)).toBe(own);
 expect(resolveMentorActivityProjectId({subjectType:"project_submission",subjectId:foreign,metadataProjectId:own},allowed)).toBe(own);
 expect(resolveMentorActivityProjectId({subjectType:"project_submission",subjectId:foreign,metadataProjectId:foreign},allowed)).toBeNull();
});
