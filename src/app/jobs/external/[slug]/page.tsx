import {notFound} from "next/navigation";
import {readPublicExternalJob} from "@/modules/placements/public-external-job-service";
import { ButtonLink } from "@/components/ui/button-link";
export const dynamic="force-dynamic";
export default async function ExternalJobPage({params}:{
 params:Promise<{slug:string}>;
}){
 const {slug}=await params;
 const job=await readPublicExternalJob(slug);
 if(!job)notFound();
 return <main className="mx-auto my-6 max-w-3xl space-y-5 border border-border bg-surface p-6">
  <header>
   <h1 className="text-2xl font-semibold">{job.title}</h1>
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
