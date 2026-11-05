"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error;reset:()=>void}){
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Unable to load Section quizzes" />
  <p role="alert" className="max-w-xl text-sm leading-6 text-body">The quiz editor could not be loaded. Retry to recheck Section access and saved drafts.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
   <Button onClick={reset}>Retry</Button>
   <ButtonLink variant="secondary" href="/teacher/courses">Back to courses</ButtonLink>
  </div>
 </section>;
}
