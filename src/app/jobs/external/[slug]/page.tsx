import {notFound} from "next/navigation";
import {readPublicExternalJob} from "@/modules/placements/public-external-job-service";
import { ButtonLink } from "@/components/ui/button-link";
import { Heading } from "@/components/ui/heading";
import { runAsSystem } from "@/db/tenant-context";
export const dynamic="force-dynamic";
async function ExternalJobPage({params}:{
 params:Promise<{slug:string}>;
}){
 const {slug}=await params;
 const job=await readPublicExternalJob(slug);
 if(!job)notFound();
 return <main className="mx-auto my-6 max-w-3xl space-y-5 border border-border bg-surface p-6">
  <header>
   <Heading level={1} size="2xl">{job.title}</Heading>
   <p className="mt-2 text-sm text-body">{job.companyName}</p>
  </header>
  <p className="whitespace-pre-wrap break-words text-sm">{job.description}</p>
  <p className="text-sm">Work mode: {job.workMode.replaceAll("_"," ")}</p>
  <p className="text-sm">This external application is managed by the employer.
   The LMS cannot confirm whether your employer application was submitted.</p>
  <ButtonLink variant="primary" href={job.applyHref} rel="noopener noreferrer">
   Continue to employer website ↗
  </ButtonLink>
 </main>;
}

// Public page, no actor: runs in a named system scope so row-level security (when enforced) still lets it read
// the one record its link points at. The scope name shows in the database session.
export default async function ExternalJobPagePublic(props: Parameters<typeof ExternalJobPage>[0]) {
  return runAsSystem("public-page:jobs-external", () => ExternalJobPage(props));
}
