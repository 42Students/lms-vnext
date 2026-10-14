import {describe,expect,it} from "vitest";
import {facultyDiscussionParticipationSchema,facultyDiscussionParticipationSummary}
  from "@/modules/courses/faculty-discussion-participation-model";
describe("Faculty discussion participation",()=>{
  it("counts stored roles without claiming reply resolution",()=>{
    expect(facultyDiscussionParticipationSummary({total:4,faculty:1,learner:2,pinned:1}))
      .toEqual({total:4,faculty:1,learner:2,pinned:1,other:1,facultyShare:25});
    expect(facultyDiscussionParticipationSummary({total:0,faculty:0,learner:0,pinned:0}).facultyShare)
      .toBeNull();
  });
  it("rejects client injected college or invalid delivery",()=>{
    const deliveryId="00000000-0000-4000-8000-000000000001";
    expect(facultyDiscussionParticipationSchema.safeParse({deliveryId}).success).toBe(true);
    expect(facultyDiscussionParticipationSchema.safeParse({deliveryId,collegeId:deliveryId}).success).toBe(false);
  });
});
