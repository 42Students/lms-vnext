import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import {facultyQuizParamsSchema} from "@/modules/courses/faculty-quiz-authoring-model";
import {FacultyChoiceQuizBuilder} from "@/components/courses/faculty-choice-quiz-builder";
import {PageHeader} from "@/components/ui/page-header";
export default async function Page({params}:{params:Promise<{deliveryId:string}>}){
 const {deliveryId}=facultyQuizParamsSchema.parse(await params);
 const workspace=await getFacultyCourseWorkspace(await getCurrentRequestContext(),deliveryId);
 const quizzes=workspace.lessons.flatMap(l=>l.quizzes.filter(x=>x.deliveryId===deliveryId).map(x=>({
  id:x.id,lessonId:l.id,title:x.title,description:x.description,dueAt:x.dueAt?.toISOString()??null,
  maxAttempts:x.maxAttempts,sequence:x.sequence,status:x.status,updatedAt:x.updatedAt.toISOString(),
 })));
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader eyebrow="Faculty · Courses" title="Section quizzes"
   description={workspace.course.courseName+" · "+workspace.course.sectionName}/>
  {workspace.lessons.length?<FacultyChoiceQuizBuilder deliveryId={deliveryId}
   lessons={workspace.lessons.map(l=>({id:l.id,name:l.name}))} quizzes={quizzes}/>:
   <section role="status" className="rounded border border-border p-4">No registered lessons are available for this Section. Publish a learning path first.</section>}
  <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)}
   className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to course</Link>
 </div>;
}
