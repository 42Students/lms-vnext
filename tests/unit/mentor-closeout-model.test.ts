import {describe,expect,it} from "vitest";
import {closeoutChecklist,mentorCloseoutSchema} from "@/modules/projects/mentor-closeout-model";
describe("Mentor registered closeout",()=>{
  const eligible={
    projectStatus:"ACTIVE",approved:true,openTasks:0,openSprints:0,openReleases:0,
  };
  it("requires an approved delivery and all registered work complete",()=>{
    expect(closeoutChecklist(eligible).canComplete).toBe(true);
    for(const value of [
      {...eligible,approved:false},{...eligible,openTasks:1},
      {...eligible,openSprints:1},{...eligible,openReleases:1},
      {...eligible,projectStatus:"COMPLETED"},
    ]) expect(closeoutChecklist(value).canComplete).toBe(false);
  });
  it("requires explicit all-true confirmations and optimistic token",()=>{
    const complete={
      expectedUpdatedAt:"2026-10-14T10:00:00.000Z",
      confirmDeliveryReviewed:true,confirmTeamNotified:true,confirmCloseout:true,
    };
    expect(mentorCloseoutSchema.safeParse(complete).success).toBe(true);
    expect(mentorCloseoutSchema.safeParse({...complete,confirmTeamNotified:false}).success).toBe(false);
    expect(mentorCloseoutSchema.safeParse({...complete,projectStatus:"CLOSED"}).success).toBe(false);
  });
});
