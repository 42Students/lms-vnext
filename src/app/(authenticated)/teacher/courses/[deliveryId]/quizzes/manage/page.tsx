import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import {facultyQuizParamsSchema} from "@/modules/courses/faculty-quiz-authoring-model";
import {FacultyChoiceQuizBuilder} from "@/components/courses/faculty-choice-quiz-builder";
import {PageHeader} from "@/components/ui/page-header";
import {notFound} from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
export default async function Page({params,searchParams}:{params:Promise<{deliveryId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {deliveryId}=facultyQuizParamsSchema.parse(await params);
 const workspace=await getFacultyCourseWorkspace(await getCurrentRequestContext(),deliveryId);
 const requestedLesson=(await searchParams).lesson;
 if(requestedLesson!==undefined&&(typeof requestedLesson!=="string"||
   !workspace.lessons.some(lesson=>lesson.id===requestedLesson)))notFound();
 const initialLessonId=typeof requestedLesson==="string"?requestedLesson:null;
 const quizzes=workspace.lessons.flatMap(l=>l.quizzes.filter(x=>x.deliveryId===deliveryId).map(x=>({
  id:x.id,lessonId:l.id,title:x.title,description:x.description,dueAt:x.dueAt?.toISOString()??null,
  maxAttempts:x.maxAttempts,sequence:x.sequence,status:x.status,updatedAt:x.updatedAt.toISOString(),
  shuffleQuestions:x.shuffleQuestions,shuffleOptions:x.shuffleOptions,
 })));
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader eyebrow="Faculty · Courses" title="Section quizzes"
   description={workspace.course.courseName+" · "+workspace.course.sectionName}
   actions={<ButtonLink variant="secondary" href={"/teacher/courses/"+encodeURIComponent(deliveryId)} className="w-full sm:w-auto">Back to course</ButtonLink>} />
  {workspace.lessons.length?<FacultyChoiceQuizBuilder key={initialLessonId??"default"} initialLessonId={initialLessonId} deliveryId={deliveryId}
   lessons={workspace.lessons.map(l=>({id:l.id,name:l.name}))} quizzes={quizzes}/>:
   <section role="status" className="border-y border-[var(--lms-canvas-border)] bg-transparent py-4">No registered lessons are available for this Section. Publish a learning path first.</section>}
 </div>;
}
