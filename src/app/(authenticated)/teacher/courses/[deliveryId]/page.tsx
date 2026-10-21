import { redirect, notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { facultyCourseTabHref, validFacultyDefaultDeliveryId } from "@/modules/courses/faculty-course-navigation";
import {resolveFacultyCourseDeliveryForLink} from "@/modules/courses/faculty-course-service";

export default async function FacultyCourseDefaultPage({
  params, searchParams,
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const { deliveryId } = await params;
  const query = await searchParams;
  const cls = typeof query.cls === "string" ? query.cls : null;

  // Resolve historical course codes/slugs only against this faculty member's
  // current, authorized teaching assignments. Numeric legacy identifiers do
  // not have a trusted crosswalk and must never select a different delivery.
  const canonical = !validFacultyDefaultDeliveryId(deliveryId) || cls
    ? await resolveFacultyCourseDeliveryForLink(
        await getCurrentRequestContext(),deliveryId,cls,
      )
    : deliveryId;
  if(!canonical)notFound();

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
