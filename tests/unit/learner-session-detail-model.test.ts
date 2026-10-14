import {describe,expect,it} from "vitest";
import {learnerClassSessionNotes} from "@/modules/academics/learner-session-detail-model";
describe("learner schedule event notes",()=>{
  it("exposes authored session notes without inventing course context",()=>{
    expect(learnerClassSessionNotes("  Bring lab report.  ")).toBe("Bring lab report.");
    expect(learnerClassSessionNotes(null)).toBeNull();
    expect(learnerClassSessionNotes("  ")).toBeNull();
  });
  it("leaves untrusted text to the ordinary React text renderer",()=>{
    expect(learnerClassSessionNotes("<script>danger</script>")).toBe("<script>danger</script>");
  });
});
