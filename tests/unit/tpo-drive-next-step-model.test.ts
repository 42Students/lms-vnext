import { describe, expect, it } from "vitest";
import { projectTpoDriveNextStep } from "@/modules/placements/tpo-drive-next-step-model";

const base = {
  jobId: "a b/c",
  status: "DRAFT",
  publishAllowed: false,
  closeAllowed: false,
  shortlistCount: null,
  pendingRequests: 0,
  stagedRounds: [],
};
describe("TPO-drive-workspace-02 next step", () => {
  it("never links a blocked draft directly to publish", () => {
    const result = projectTpoDriveNextStep(base);
    expect(result.primary.label).toBe("Fix these before publishing");
    expect(result.primary.href).toBe("/tpo/placements/jobs/a%20b%2Fc/edit");
  });
  it("routes publish-ready drafts to the actual confirmation controls", () => {
    const result = projectTpoDriveNextStep({...base, publishAllowed: true});
    expect(result.primary).toMatchObject({label: "Publish", href: "#drive-lifecycle-publish"});
    expect(result.more[0]?.label).toBe("Edit draft");
  });
  it("prioritizes staged results before pending requests, sharing and closing", () => {
    const result = projectTpoDriveNextStep({
      ...base, status: "PUBLISHED", closeAllowed: true,
      pendingRequests: 4, shortlistCount: 19,
      stagedRounds: [{id:"1",name:"Technical round",pendingCount:2}, {id:"2",name:"Interview",pendingCount:6}],
    });
    expect(result.primary.label).toBe("Review and apply 6 result(s)");
    expect(result.primary.href).toBe("#drive-round-actions");
    expect(result.more.map(a=>a.label)).toEqual(["Review 4 request(s)","Share with company","Applicants"]);
    expect(result.more).toHaveLength(3);
  });
  it("does not invent shortlist or request counts when unavailable", () => {
    const result = projectTpoDriveNextStep({...base,status:"PUBLISHED"});
    expect(result.primary.label).toBe("No action needed");
    expect(result.more).toHaveLength(1);
    expect(result.more[0]?.label).toBe("Applicants");
  });
  it("prioritizes the first deadline for a published drive without one",()=>{
    const result=projectTpoDriveNextStep({...base,status:"PUBLISHED",deadlineMissing:true});
    expect(result.primary).toMatchObject({label:"Set deadline",href:"#drive-deadline-actions"});
    expect(result.more[0]?.label).toBe("Applicants");
  });
  it("does not offer non-applicant reminders for outside or expired drives", () => {
    const reminded={...base,status:"PUBLISHED",canRemindNonApplicants:true,nonApplicantCount:9};
    expect(projectTpoDriveNextStep(reminded).primary.label).toBe("Remind all");
    for(const excluded of [{recordedOutside:true},{deadlinePassed:true}]){
      const result=projectTpoDriveNextStep({...reminded,...excluded});
      expect([result.primary,...result.more].some(item=>item.label==="Remind all")).toBe(false);
    }
  });
  it("never suggests a lifecycle change on a cancelled or closed drive", () => {
    for (const status of ["CLOSED", "CANCELLED", "ARCHIVED"]) {
      const view = projectTpoDriveNextStep({...base,status,closeAllowed:true});
      expect(view.primary.label).toBe("Applicants");
      expect(view.more).toEqual([]);
    }
  });
});
