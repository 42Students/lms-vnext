import { redirect, notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { facultyCourseTabHref, validFacultyDefaultDeliveryId } from "@/modules/courses/faculty-course-navigation";
import {resolveFacultyCourseDeliveryForLink,listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import Link from "next/link";

export default async function FacultyCourseDefaultPage({
  params, searchParams,
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const { deliveryId } = await params;
  const query = await searchParams;
  const cls = typeof query.cls === "string" ? query.cls : null;

  // Legacy index performed a replace without a read, but vNext must validate
  // the current persisted teaching assignment before navigating to a route.
  // Keep redirect (temporary/replace semantics); a permanently cached 308
  // would outlive faculty assignment changes.
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"FACULTY"))return <div className="min-w-0 space-y-4">
    <PageHeader title="Course workspace"/>
    <ErrorState title="Faculty access required"
      description="This course workspace is available to assigned faculty members."
      action={<Link href="/teacher/courses" className="inline-flex min-h-11 items-center font-semibold text-link underline">Back to courses</Link>}/>
  </div>;
  // Resolve historical course codes/slugs only against this faculty member's
  // current, authorized teaching assignments. Numeric legacy identifiers do
  // not have a trusted crosswalk and must never select a different delivery.
  const canonical = !validFacultyDefaultDeliveryId(deliveryId) || cls
    ? await resolveFacultyCourseDeliveryForLink(
        context,deliveryId,cls,
      )
    : deliveryId;
  if(!canonical)notFound();
  const assignments=await listFacultyCourseDeliveries(context);
  if(!assignments.some(item=>item.deliveryId===canonical))
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Course workspace"/>
      <ErrorState title="Teaching assignment unavailable"
        description="Your current faculty account is not assigned to this course or class."
        action={<Link href="/teacher/courses" className="inline-flex min-h-11 items-center font-semibold text-link underline">My teaching courses</Link>}/>
    </div>;

  // Legacy bookmarks retained their full query. Preserve repeated keys,
  // empty values and special characters rather than silently dropping a
  // class, lesson or filter hint on the default-route redirect.
  const preserved=new URLSearchParams();
  for(const [key,raw] of Object.entries(query)){
    if(key.length>100)continue;
    for(const value of Array.isArray(raw)?raw:[raw]){
      if(typeof value==="string"&&value.length<=2048)preserved.append(key,value);
    }
  }
  const href=facultyCourseTabHref(canonical,"home");
  redirect(href+(preserved.size?"?"+preserved.toString():""));
}
