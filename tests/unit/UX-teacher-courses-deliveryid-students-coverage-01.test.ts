import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-students-01 /teacher/courses/[deliveryId]/students keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx"),"utf8");
expect(s).toContain("redirect(\"/teacher/courses/\"+encodeURIComponent(target.deliveryId)+\"/students\")");
expect(s).toContain("notFound()");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("FacultyCourseRoster");
const roster=readFileSync(join(process.cwd(),
 "src/components/courses/faculty-course-roster.tsx"),"utf8");
expect(s).toContain('className="sr-only">Students');
expect(roster).toContain('title="No students yet"');
expect(roster).toContain("<DataTable");
expect(roster).toContain('aria-label="Students in this class"');
});
