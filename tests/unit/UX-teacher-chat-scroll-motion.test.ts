import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-scroll-motion-04 exposes chat scroll edge fades and reduces imperative smooth motion",()=>{
const source=readFileSync(join(process.cwd(),"src/components/courses/learner-course-discussion.tsx"),"utf8");
for(const expected of ["data-scroll-fade=\"top\"","data-scroll-fade=\"bottom\"","Course discussion messages","role=\"region\"","tabIndex={0}","ResizeObserver(update)","motion-safe:animate-spin","(prefers-reduced-motion: reduce)","behavior=\"auto\""])expect(source).toContain(expected);
expect(source).toContain("scrollHeight-node.scrollTop-node.clientHeight>1");
});
