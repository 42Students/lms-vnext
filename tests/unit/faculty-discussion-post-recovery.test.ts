import {describe,expect,it} from "vitest";
import {facultyDiscussionPostNeedsReadback} from "../../src/modules/courses/faculty-discussion-post-recovery";

describe("Faculty discussion uncertain write protection",()=>{
 it("requires feed reconciliation for unknown outcome or stale parent",()=>{
  for(const status of [null,408,409,412,500,502,503,504])
   expect(facultyDiscussionPostNeedsReadback(status)).toBe(true);
 });
 it("permits correction of definitive validation and authorization failures",()=>{
  for(const status of [400,401,403,404,422,429])
   expect(facultyDiscussionPostNeedsReadback(status)).toBe(false);
 });
});
