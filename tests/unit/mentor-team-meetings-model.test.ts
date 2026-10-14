import {describe,expect,it} from "vitest";
import {
  mentorTeamMeetingsHref,mentorTeamMeetingsPage,mentorTeamMeetingsQuerySchema,
} from "@/modules/projects/mentor-team-meetings-model";
const projectId="00000000-0000-4000-8000-000000000001";
describe("Mentor exact-project Team and Meeting log",()=>{
  it("strictly allows only project ID and registered status/pagination",()=>{
    expect(mentorTeamMeetingsQuerySchema.safeParse({projectId}).success).toBe(true);
    expect(mentorTeamMeetingsQuerySchema.safeParse({projectId,collegeId:projectId}).success).toBe(false);
    expect(mentorTeamMeetingsQuerySchema.safeParse({projectId,status:"RESCHEDULED"}).success).toBe(false);
    expect(mentorTeamMeetingsQuerySchema.safeParse({projectId,type:"EMAIL"}).success).toBe(false);
    expect(mentorTeamMeetingsQuerySchema.safeParse({projectId,outcome:"YES"}).success).toBe(false);
    expect(mentorTeamMeetingsQuerySchema.safeParse({projectId,order:"SECRET"}).success).toBe(false);
    expect(mentorTeamMeetingsQuerySchema.parse({projectId,order:"OLDEST"}).order).toBe("OLDEST");
    expect(mentorTeamMeetingsHref({projectId,status:"ALL",order:"OLDEST",page:2}))
      .toContain("order=OLDEST&page=2");
    expect(mentorTeamMeetingsQuerySchema.parse({projectId,outcome:"RECORDED"}).outcome).toBe("RECORDED");
    expect(mentorTeamMeetingsHref({projectId,status:"ALL",outcome:"NOT_RECORDED",page:2}))
      .toContain("outcome=NOT_RECORDED&page=2");
    expect(mentorTeamMeetingsQuerySchema.parse({projectId,type:"RETRO"}).type).toBe("RETRO");
    expect(mentorTeamMeetingsHref({projectId,status:"ALL",type:"REVIEW",page:2})).toContain("type=REVIEW&page=2");
    expect(mentorTeamMeetingsQuerySchema.safeParse({projectId,page:0}).success).toBe(false);
  });
  it("clamps empty/stale page state and preserves the exact project",()=>{
    expect(mentorTeamMeetingsPage(0,999)).toEqual({total:0,page:1,totalPages:1,pageSize:20});
    expect(mentorTeamMeetingsPage(21,999)).toEqual({total:21,page:2,totalPages:2,pageSize:20});
    expect(mentorTeamMeetingsHref({projectId,status:"COMPLETED",page:2}))
      .toBe("/mentor/projects/"+projectId+"/team-meetings?status=COMPLETED&page=2");
  });
});
