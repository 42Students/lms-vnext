import { getCurrentRequestContext } from "@/auth/request-context";
import {getDb} from "@/db/client";
import {courseDiscussionMessages} from "@/db/schema";
import {and,eq,gte,isNull,sql} from "drizzle-orm";
import { LearnerCourseDiscussion } from "@/components/courses/learner-course-discussion";
import { getFacultyCourseWorkspace } from "@/modules/courses/faculty-course-service";

export default async function FacultyCourseDiscussionsPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const workspace =
    await getFacultyCourseWorkspace(
      context,
      deliveryId,
    );

  const [recent]=await getDb().select({total:sql<number>`count(*)::int`})
   .from(courseDiscussionMessages).where(and(
     eq(courseDiscussionMessages.deliveryId,deliveryId),
     eq(courseDiscussionMessages.senderRole,"LEARNER"),
     isNull(courseDiscussionMessages.deletedAt),
     gte(courseDiscussionMessages.createdAt,new Date(Date.now()-24*3600000)),
   )).catch(()=>[{total:0}]);
  return (
    <div className="faculty-prototype-discussion min-w-0 max-w-full">
      <section className="min-w-0 overflow-hidden rounded-[13px] border border-[#e5ebf2]">
       <header className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-b border-[#e5ebf2] px-[18px] py-4">
        <div className="min-w-0">
         <h2 className="text-base font-bold text-[#1d293f]">Course discussions · {workspace.course.sectionName}</h2>
         <p className="mt-1 text-xs text-[#60718b]">Everyone in {workspace.course.sectionName} who takes this course sees these.
          Other classes have their own.</p>
        </div>
        {recent&&recent.total>0?<span className="shrink-0 rounded-full bg-[#eef8f9] px-3 py-1 text-xs font-semibold text-[#078191]">
         {recent.total} recent</span>:null}
       </header>
       <LearnerCourseDiscussion key={deliveryId} deliveryId={deliveryId} moderate/>
      </section>
    </div>
  );
}
