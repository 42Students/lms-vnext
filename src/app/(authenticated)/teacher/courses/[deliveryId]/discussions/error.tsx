"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function FacultyCourseDiscussionsError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="min-w-0 space-y-4">
  <PageHeader title="Couldn't load discussions" />
  <p className="max-w-xl text-sm leading-6 text-body">Course discussion access could not be loaded. Retry instead of treating this as an empty conversation.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
   <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
   <ButtonLink variant="secondary" href="/teacher/courses">Back to courses</ButtonLink>
  </div>
 </section>;
}
