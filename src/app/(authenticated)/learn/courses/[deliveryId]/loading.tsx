import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
/** Preserve old LMS course-overview canvas dimensions during redirect. */
export default function Loading(){
 return <div className="min-w-0 space-y-[var(--lms-space-4)] rounded-[var(--lms-canvas-radius)] bg-surface p-[var(--lms-canvas-padding)]">
   <GracefulPageLoading label="Loading course" shape="faculty-course"/>
 </div>;
}
