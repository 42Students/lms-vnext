"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Discussion participation could not load" />
  <p role="alert" className="max-w-xl text-sm leading-6 text-body">The read failed. Missing results are not assumed to be zero.</p>
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
   <Button onClick={reset}>Retry</Button>
   <ButtonLink variant="secondary" href="/teacher/courses">Back to courses</ButtonLink>
  </div>
 </section>;
}
