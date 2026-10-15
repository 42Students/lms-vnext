
import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorTeamMeetingsQuerySchema} from "@/modules/projects/mentor-team-meetings-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("rejects contradictory meeting status and outcome query values",()=>{
 const bad=singleValueMentorFilters({status:["REQUESTED","CANCELLED"]});
 expect(mentorTeamMeetingsQuerySchema.safeParse(bad?{projectId,...bad}:null).success).toBe(false);
 expect(singleValueMentorFilters({outcome:["RECORDED","NOT_RECORDED"]})).toBeNull();
 const safe=singleValueMentorFilters({outcome:["RECORDED"]});
 expect(mentorTeamMeetingsQuerySchema.safeParse(safe?{projectId,...safe}:null).success).toBe(true);
});
