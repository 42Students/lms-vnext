import { redirect,notFound } from "next/navigation";
import {z} from "zod";
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
  searchParams:Promise<{filter?:string;lesson?:string}>;
}) {
  const { deliveryId, courseTab } = await params;
  const query=await searchParams;
  const requestedFilter=query.filter?.toUpperCase();
  const filter=(["ALL","LECTURES","RESOURCES","ASSESSMENTS","LIVE"].includes(requestedFilter??"")?
    requestedFilter:"ALL") as "ALL"|"LECTURES"|"RESOURCES"|"ASSESSMENTS"|"LIVE";
  if (courseTab.length !== 1 || (courseTab[0] !== "home" && courseTab[0] !== "blueprint")) {
    redirect(facultyCourseTabHref(deliveryId, "home"));
  }
  const context = await getCurrentRequestContext();
  const workspace = await getFacultyCourseWorkspace(context, deliveryId);
  const lessonId=courseTab[0]==="blueprint"&&query.lesson?query.lesson:null;
  if(lessonId&&(!z.string().uuid().safeParse(lessonId).success||
    !workspace.lessons.some(lesson=>lesson.id===lessonId)))notFound();
  const [homeSignals, display] = await Promise.all([
    getFacultyCourseHomeSignals(context, workspace),
    loadCourseDisplayContentIfReady(workspace.course.courseId),
  ]);
  return (
    <FacultyCourseWorkspace
      workspace={workspace}
      homeSignals={homeSignals}
      display={display}
      view={courseTab[0] === "home" ? "OVERVIEW" : "BLUEPRINT"}
      contentFilter={filter}
      selectedLessonId={lessonId}
    />
  );
}
