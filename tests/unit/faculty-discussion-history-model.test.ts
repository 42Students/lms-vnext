import { describe, expect, it } from "vitest";
import {
  discussionHistoryLabel,discussionHistoryPagination,
  facultyDiscussionHistoryHref,facultyDiscussionHistorySchema,parseFacultyDiscussionHistoryLocation,
} from "@/modules/courses/faculty-discussion-history-model";
const id="00000000-0000-4000-8000-000000000001";
describe("Faculty discussion audit history",()=>{
  it("labels pin actions and never falsely attributes deletion to Faculty",()=>{
    expect(discussionHistoryLabel("courses.discussion.pin_changed",true)).toBe("Pinned by moderator");
    expect(discussionHistoryLabel("courses.discussion.pin_changed",false)).toBe("Unpinned by moderator");
    expect(discussionHistoryLabel("courses.discussion.deleted",null)).toBe("Discussion deletion recorded");
    expect(discussionHistoryLabel("courses.discussion.replied",null)).toBe("Faculty reply recorded");
  });
  it("strictly refuses forged college/subject and invalid cursor",()=>{
    expect(facultyDiscussionHistorySchema.safeParse({deliveryId:id,collegeId:id}).success).toBe(false);
    expect(facultyDiscussionHistorySchema.safeParse({deliveryId:id,subjectId:id}).success).toBe(false);
    expect(facultyDiscussionHistorySchema.safeParse({deliveryId:id,action:"EDIT"}).success).toBe(false);
    expect(facultyDiscussionHistorySchema.safeParse({deliveryId:id,action:"REPLY"}).success).toBe(true);
    expect(facultyDiscussionHistorySchema.safeParse({deliveryId:id,page:0}).success).toBe(false);
  });
  it("rejects duplicate and foreign-scope URL selectors in the audit viewer",()=>{
    expect(parseFacultyDiscussionHistoryLocation(id,{action:"REPLY",page:"2"}).success).toBe(true);
    for(const raw of [{action:["REPLY","ALL"]},{page:["1","3"]},
      {deliveryId:id},{subjectId:id},{action:"PIN",page:"10000"}]){
      expect(parseFacultyDiscussionHistoryLocation(id,raw).success).toBe(false);
    }
  });
  it("clamps stale pages and constructs delivery-only links",()=>{
    expect(discussionHistoryPagination(0,90)).toEqual({total:0,page:1,pageSize:20,totalPages:1});
    expect(discussionHistoryPagination(21,90).page).toBe(2);
    expect(facultyDiscussionHistoryHref({deliveryId:id,action:"PIN",page:3}))
      .toBe("/teacher/courses/"+id+"/discussion-history?action=PIN&page=3");
    expect(facultyDiscussionHistoryHref({deliveryId:id,action:"REPLY",page:1}))
      .toBe("/teacher/courses/"+id+"/discussion-history?action=REPLY");
  });
});
