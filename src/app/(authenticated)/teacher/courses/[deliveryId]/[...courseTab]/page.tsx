import { redirect,notFound } from "next/navigation";
import {z} from "zod";
import {Banner} from "@/components/ui/banner";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseWorkspace } from "@/components/courses/faculty-course-workspace";
import { getFacultyCourseWorkspace } from "@/modules/courses/faculty-course-service";
import { getFacultyCourseHomeSignals } from "@/modules/courses/faculty-course-home-service";
import { loadCourseDisplayContentIfReady } from "@/modules/courses/course-display-service";
import { facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";

export default async function FacultyCourseTabPage({
  params,searchParams,
}: {
  params: Promise<{ deliveryId: string; courseTab: string[] }>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const { deliveryId, courseTab } = await params;
  const query=await searchParams;
  const requestedFilter=typeof query.filter==="string"?query.filter.toUpperCase():"";
  const normalizedFilter=requestedFilter==="LIVE-SESSIONS"?"LIVE":requestedFilter;
  const filter=(["ALL","LECTURES","RESOURCES","ASSESSMENTS","LIVE"].includes(normalizedFilter)?
    normalizedFilter:"ALL") as "ALL"|"LECTURES"|"RESOURCES"|"ASSESSMENTS"|"LIVE";
  const context = await getCurrentRequestContext();
  // A malformed or foreign delivery must not be redirected before the
  // active Faculty membership and teaching assignment are verified.
  const workspace = await getFacultyCourseWorkspace(context, deliveryId);
  const requestedLesson=typeof query.lesson==="string"?query.lesson:null;
  const requestedContent=typeof query.content==="string"?query.content:null;
  if(requestedLesson&&!z.string().uuid().safeParse(requestedLesson).success)notFound();
  if(requestedContent&&!z.string().uuid().safeParse(requestedContent).success)notFound();
  const owningLesson=requestedContent?workspace.lessons.find(lesson=>
    lesson.contents.some(content=>content.id===requestedContent)||
    lesson.assignments.some(item=>item.id===requestedContent)||
    lesson.quizzes.some(item=>item.id===requestedContent)):null;
  if(requestedContent&&!owningLesson)notFound();
  const lessonId=requestedLesson??owningLesson?.id??null;
  if(lessonId&&!workspace.lessons.some(lesson=>lesson.id===lessonId))notFound();
  if(requestedLesson&&owningLesson&&requestedLesson!==owningLesson.id)notFound();
  const segment=courseTab.length===1?courseTab[0]!.toLowerCase():"";
  const aliases:Record<string,string>={
   "attendance":"attendanceDetail","attendancereport":"attendanceDetail",
   "attendancedetail":"attendanceDetail","attendance-report":"attendanceDetail",
   "discussion":"discussions","discussions":"discussions",
   "students":"students","classmates":"students",
  };
  const alias=aliases[segment];
  if(alias){
   const safe=new URLSearchParams();
   if(filter!=="ALL")safe.set("filter",filter);
   if(lessonId)safe.set("lesson",lessonId);
   if(requestedContent)safe.set("content",requestedContent);
   redirect("/teacher/courses/"+encodeURIComponent(deliveryId)+"/"+alias+
      (safe.size?"?"+safe.toString():""));
  }
  if (courseTab.length !== 1 || (courseTab[0] !== "home" && courseTab[0] !== "blueprint")) {
    const safe=new URLSearchParams();
    if(filter!=="ALL")safe.set("filter",filter);
    if(lessonId)safe.set("lesson",lessonId);
    if(requestedContent)safe.set("content",requestedContent);
    redirect(facultyCourseTabHref(deliveryId,requestedContent?"blueprint":"home")+
      (safe.size?"?"+safe.toString():""));
  }
  if(requestedContent&&courseTab[0]==="home"){
    const safe=new URLSearchParams({lesson:owningLesson!.id,content:requestedContent});
    if(filter!=="ALL")safe.set("filter",filter);
    redirect(facultyCourseTabHref(deliveryId,"blueprint")+"?"+safe.toString());
  }
  const [homeSignals, displayResult] = await Promise.all([
    getFacultyCourseHomeSignals(context, workspace).catch(()=>null),
    loadCourseDisplayContentIfReady(workspace.course.courseId)
      .then(data=>({data,failed:false}))
      .catch(()=>({data:null,failed:true})),
  ]);
  return (
    <div className="min-w-0 space-y-4">
      {displayResult.failed ? <Banner tone="warning" role="alert">
        Failed to load course details.
        <Link href={facultyCourseTabHref(deliveryId,courseTab[0] as "home"|"blueprint")}
          className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Try again
        </Link>
      </Banner> : null}
      {requestedContent ? <Banner tone="info" role="status">
        Showing the selected lesson item in Blueprint. Use its View action for details.
      </Banner> : null}
      <FacultyCourseWorkspace
        workspace={workspace}
        homeSignals={homeSignals}
        display={displayResult.data}
        view={courseTab[0] === "home" ? "OVERVIEW" : "BLUEPRINT"}
        contentFilter={filter}
        selectedLessonId={lessonId}
        selectedContentId={requestedContent}
      />
    </div>
  );
}
