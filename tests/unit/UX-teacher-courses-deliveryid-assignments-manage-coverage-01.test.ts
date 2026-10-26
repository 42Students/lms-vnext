import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-assignments-manage-01 /teacher/courses/[deliveryId]/assignments/manage enforces page access and feedback contracts",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx"),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain('<PageHeader title="Section assignments"');
 expect(source).toContain('getFacultyCourseWorkspace(context,deliveryId)');
 expect(source).toContain('<FacultyAssignmentEditor key={initialLessonId??"default"} initialLessonId={initialLessonId} deliveryId={deliveryId}');
 expect(source).toContain('!workspace.lessons.some(lesson=>lesson.id===requestedLesson)');
 expect(source).toContain('if(requestedLesson!==undefined');
 expect(source).toContain('<EmptyState title="No registered lessons yet"');
});
