import {describe,expect,it} from "vitest";
import {facultyDiscussionReplySchema,facultyReplyParentTokenMatches}
 from "@/modules/courses/faculty-discussion-reply-model";
describe("Faculty moderated reply",()=>{
 it("requires the exact parent version and explicit confirmation",()=>{
  const ok={messageText:"Here is the answer",replyToMessageId:"00000000-0000-4000-8000-000000000001",
   expectedParentUpdatedAt:"2026-10-14T13:00:00.123Z",confirmed:true};
  expect(facultyDiscussionReplySchema.safeParse(ok).success).toBe(true);
  expect(facultyDiscussionReplySchema.safeParse({...ok,confirmed:false}).success).toBe(false);
  expect(facultyDiscussionReplySchema.safeParse({...ok,collegeId:"forged"}).success).toBe(false);
 });
 it("compares the stored parent Date using millisecond precision",()=>{
  const now=new Date("2026-10-14T13:00:00.123Z");
  expect(facultyReplyParentTokenMatches(now,now.toISOString())).toBe(true);
  expect(facultyReplyParentTokenMatches(now,"2026-10-14T13:00:00.122Z")).toBe(false);
 });
});
