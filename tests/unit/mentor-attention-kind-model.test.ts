import {describe,expect,it} from "vitest";
import {selectMentorAttention,mentorAttentionKindSchema}
 from "@/modules/projects/mentor-attention-kind-model";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";
const a=(kind:MentorProjectAttention["kind"]):MentorProjectAttention=>({
 projectId:"p",key:kind,kind,title:kind,description:"Recorded",
 href:"/mentor/projects/p",occurredAt:"2026-10-14T10:00:00Z",
});
describe("Mentor project-attention filters",()=>{
 it("filters only already-scoped records",()=>{
  const items=[a("REVIEW"),a("STALLED")];
  expect(selectMentorAttention(items,"REVIEW")).toHaveLength(1);
  expect(selectMentorAttention(items,"ALL")).toHaveLength(2);
 });
 it("rejects unknown categories",()=>{
  expect(mentorAttentionKindSchema.safeParse("ALL").success).toBe(true);
  expect(mentorAttentionKindSchema.safeParse("FOREIGN").success).toBe(false);
 });
});
