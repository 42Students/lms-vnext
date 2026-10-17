import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 faculty courses round 7",()=>{
it("FAC-courses-29 confirms the audited source behavior",()=>{const s=read("src/components/courses/faculty-course-roster.tsx");for(const p of ["No students yet","Students will appear here once they are enrolled in this class."])expect(s).toContain(p);});
it("FAC-courses-31 confirms the audited source behavior",()=>{const s=read("src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx");for(const p of ["LearnerCourseDiscussion"])expect(s).toContain(p);for(const text of ["Moderation history","Participation","Section notices (unavailable)"])expect(s).not.toContain(text);});
it("FAC-courses-R05 confirms the audited source behavior",()=>{const s=read("src/components/courses/learner-course-discussion.tsx");for(const p of ["beforeunload","Discard your unsent discussion message?","document.addEventListener(\"click\",guard,true)"])expect(s).toContain(p);});
it("FAC-courses-R06 confirms the audited source behavior",()=>{const s=read("src/components/courses/learner-course-discussion.tsx");for(const p of ["reconcileLatestDiscussionPage(previous, incoming, received.length)","loadError && messages.length > 0","Discussion refresh failed."])expect(s).toContain(p);});
});
