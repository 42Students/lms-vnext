import { describe, expect, it } from "vitest";
import { formatDiscussionReply } from "@/modules/courses/learner-discussion-reply-model";
describe("learner discussion replies", () => {
  it("preserves normal messages and labels replies with a stable parent cue",()=>{
    expect(formatDiscussionReply("Hello",null)).toBe("Hello");
    expect(formatDiscussionReply("Thanks","81818181-8181-4818-8818-818181818181")).toBe("↳ Reply to 81818181: Thanks");
  });
});