import {notFound} from "next/navigation";
import {readPublicExternalJob} from "@/modules/placements/public-external-job-service";
import { PublicExternalJobDetails } from "@/components/placements/public-external-job-details";
import { runAsSystem } from "@/db/tenant-context";
export const dynamic="force-dynamic";
async function ExternalJobPage({params}:{
 params:Promise<{slug:string}>;
}){
 const {slug}=await params;
 const job=await readPublicExternalJob(slug);
 if(!job)notFound();
 return <PublicExternalJobDetails job={job} />;
}

// Public page, no actor: runs in a named system scope so row-level security (when enforced) still lets it read
// the one record its link points at. The scope name shows in the database session.
export default async function ExternalJobPagePublic(props: Parameters<typeof ExternalJobPage>[0]) {
  return runAsSystem("public-page:jobs-external", () => ExternalJobPage(props));
}
