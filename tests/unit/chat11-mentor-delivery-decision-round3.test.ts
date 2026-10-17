import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
const text = (path: string) => readFileSync(join(process.cwd(),path),"utf8");

describe("mentor review parity",()=>{
  it("MEN-projects-meetings-65 has separate legacy mentor decision dialogs and retains administrator controls",()=>{
    const code=text("src/components/projects/project-final-delivery-controls.tsx");
    for(const phrase of ["Accept this submission?","Request changes on this submission?",
      "The learner will be notified their submission was accepted.",
      "The learner will see your feedback and be able to edit and resubmit it.",
      'mode!=="MENTOR" ? <label>',"Review final delivery"])
      expect(code).toContain(phrase);
  });
  it("MEN-projects-meetings-65 preserves feedback and shows safe stale-review guidance",()=>{
    const code=text("src/components/projects/project-final-delivery-controls.tsx");
    expect(code).toContain("setStaleReview(true)");
    expect(code).toContain("This submission may have changed since you opened this review");
    expect(code).toContain("Refresh the page to load the latest version before accepting, requesting changes, or locking.");
    expect(code).toContain("setFeedback");
  });
  it("MEN-projects-meetings-66 delivers review outcome to active learners in the same transaction",()=>{
    const service=text("src/modules/projects/mentor-final-delivery-decision-service.ts");
    expect(service).toContain("notifyActiveProjectMembers(tx,reviewedEvent.id");
    expect(service).toContain('roles:["LEARNER"]');
    expect(service).toContain("learnerProjectDeliveryReviewNotice");
  });
});
