import { redirect } from "next/navigation";

/** Legacy bookmarks use course slugs or numeric IDs, sometimes with cls.
 * The shared /home route resolves aliases only against the authenticated
 * learner's authorized deliveries, and ignores cls for permission checks. */
export default async function LearnerCourseRedirectPage({
 params,searchParams,
}:{
 params:Promise<{deliveryId:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const [{deliveryId},query]=await Promise.all([params,searchParams]);
 const allowed=["cls","ref","lesson","content","filter","academicPeriodId","semesterId"];
 const suffix=new URLSearchParams();
 for(const key of allowed){
  const value=query[key];
  const str=Array.isArray(value)?value[0]:value;
  if(str&&str.length<=128)suffix.set(key,str);
 }
 const serialized=suffix.toString();
 redirect("/learn/courses/"+encodeURIComponent(deliveryId)+"/home"+
  (serialized?"?"+serialized:""));
}
