import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import {facultyAssignmentParamsSchema} from "@/modules/courses/faculty-assignment-authoring-model";
import {FacultyAssignmentEditor} from "@/components/courses/faculty-assignment-editor";
import {PageHeader} from "@/components/ui/page-header";
export default async function Page({params}:{params:Promise<{deliveryId:string}>}){
 const {deliveryId}=facultyAssignmentParamsSchema.parse(await params);
 const context=await getCurrentRequestContext();
 const workspace=await getFacultyCourseWorkspace(context,deliveryId);
 const assignments=workspace.lessons.flatMap(lesson=>lesson.assignments.filter(x=>x.deliveryId===deliveryId).map(x=>({
  id:x.id,lessonId:lesson.id,title:x.title,description:x.description,dueAt:x.dueAt?.toISOString()??null,
  maxPoints:x.maxPoints,sequence:x.sequence,status:x.status,updatedAt:x.updatedAt.toISOString(),
 })));
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader eyebrow="Faculty · Courses" title="Section assignments"
   description={workspace.course.courseName+" · "+workspace.course.sectionName} />
  {workspace.lessons.length?
   <FacultyAssignmentEditor deliveryId={deliveryId}
     methodsEnabled={true}
     lessons={workspace.lessons.map(x=>({id:x.id,name:x.name}))} assignments={assignments}/>
   :<p role="status" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">No registered lessons yet. Create and publish a learning path before authoring assignments.</p>}
  <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Back to course</Link>
 </div>;
}
