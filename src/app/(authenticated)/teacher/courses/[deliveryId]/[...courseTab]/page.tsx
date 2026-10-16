import { redirect } from "next/navigation";
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
  searchParams:Promise<{filter?:string}>;
}) {
  const { deliveryId, courseTab } = await params;
  const requestedFilter=(await searchParams).filter?.toUpperCase();
  const filter=(["ALL","LECTURES","RESOURCES","ASSESSMENTS","LIVE"].includes(requestedFilter??"")?
    requestedFilter:"ALL") as "ALL"|"LECTURES"|"RESOURCES"|"ASSESSMENTS"|"LIVE";
  if (courseTab.length !== 1 || (courseTab[0] !== "home" && courseTab[0] !== "blueprint")) {
    redirect(facultyCourseTabHref(deliveryId, "home"));
  }
  const context = await getCurrentRequestContext();
  const workspace = await getFacultyCourseWorkspace(context, deliveryId);
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
    />
  );
}
