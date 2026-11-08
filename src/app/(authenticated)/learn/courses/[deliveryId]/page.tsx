import {redirect} from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

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
 // A duplicate selector can point at two different classes or lessons. Do not
 // silently use the first one and open a different course context.
 if(allowed.some(key=>Array.isArray(query[key]))) return <section className="min-w-0 space-y-4">
   <PageHeader title="Course link needs review" />
   <ErrorState title="Conflicting course link filters"
     description="This bookmark repeats a course or lesson filter. Open your courses and choose the right lesson instead."
     retryHref="/learn/courses" retryLabel="View my courses" />
 </section>;
 const suffix=new URLSearchParams();
 for(const key of allowed){
  const value=query[key];
  const str=typeof value==="string"?value:undefined;
  if(str&&str.length<=128)suffix.set(key,str);
 }
 const serialized=suffix.toString();
 redirect("/learn/courses/"+encodeURIComponent(deliveryId)+"/home"+
  (serialized?"?"+serialized:""));
}
