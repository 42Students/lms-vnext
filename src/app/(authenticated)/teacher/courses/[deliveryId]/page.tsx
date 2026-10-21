import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { facultyCourseTabHref, validFacultyDefaultDeliveryId } from "@/modules/courses/faculty-course-navigation";

export default async function FacultyCourseDefaultPage({
  params, searchParams,
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const { deliveryId } = await params;
  if (!validFacultyDefaultDeliveryId(deliveryId)) notFound();
  // Only retain supported, bounded deep-link fields. Legacy numeric cls/ref
  // cannot establish faculty enrollment or a vNext delivery identity.
  const query = await searchParams;
  const preserved = new URLSearchParams();
  const rawFilter=typeof query.filter==="string"?query.filter.toUpperCase():"";
  const filter=rawFilter==="LIVE-SESSIONS"?"LIVE":rawFilter;
  if(["ALL","LECTURES","RESOURCES","ASSESSMENTS","LIVE"].includes(filter))
    preserved.set("filter",filter);
  for(const key of ["lesson","content"] as const) {
    const value=query[key];
    if(typeof value==="string"&&z.string().uuid().safeParse(value).success)
      preserved.set(key,value);
  }
  if(query.ref==="course")preserved.set("ref","course");
  const href=facultyCourseTabHref(deliveryId,"home");
  redirect(href+(preserved.size?"?"+preserved.toString():""));
}
