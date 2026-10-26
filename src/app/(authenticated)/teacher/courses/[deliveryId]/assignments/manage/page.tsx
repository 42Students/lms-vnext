import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import {facultyAssignmentParamsSchema} from "@/modules/courses/faculty-assignment-authoring-model";
import {FacultyAssignmentEditor} from "@/components/courses/faculty-assignment-editor";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {EmptyState} from "@/components/ui/empty-state";
import {notFound} from "next/navigation";
export default async function Page({params,searchParams}:{params:Promise<{deliveryId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {deliveryId}=facultyAssignmentParamsSchema.parse(await params);
 const context=await getCurrentRequestContext();
 const workspace=await getFacultyCourseWorkspace(context,deliveryId);
 const requestedLesson=(await searchParams).lesson;
 if(requestedLesson!==undefined&&(typeof requestedLesson!=="string"||
   !workspace.lessons.some(lesson=>lesson.id===requestedLesson)))notFound();
 const initialLessonId=typeof requestedLesson==="string"?requestedLesson:null;
 const assignments=workspace.lessons.flatMap(lesson=>lesson.assignments.filter(x=>x.deliveryId===deliveryId).map(x=>({
  id:x.id,lessonId:lesson.id,title:x.title,description:x.description,dueAt:x.dueAt?.toISOString()??null,
  maxPoints:x.maxPoints,sequence:x.sequence,status:x.status,updatedAt:x.updatedAt.toISOString(),
 })));
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Section assignments"
   description={workspace.course.courseName+" · "+workspace.course.sectionName}
   actions={<PageBackLink href={"/teacher/courses/"+encodeURIComponent(deliveryId)} label="Back to course"/>} />
  {workspace.lessons.length?
   <FacultyAssignmentEditor key={initialLessonId??"default"} initialLessonId={initialLessonId} deliveryId={deliveryId}
     methodsEnabled={true}
     lessons={workspace.lessons.map(x=>({id:x.id,name:x.name}))} assignments={assignments}/>
   :<EmptyState title="No registered lessons yet" description="Create and publish a learning path before authoring assignments."/>}
 </div>;
}
