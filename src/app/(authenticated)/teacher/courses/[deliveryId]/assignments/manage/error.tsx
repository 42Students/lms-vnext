"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error;reset:()=>void}){
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Unable to load Section assignments" />
  <p role="alert" className="max-w-xl text-sm leading-6 text-body">Assignment authoring could not load. Retry to restore your current course state.</p>
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    <Button onClick={reset}>Retry</Button>
    <ButtonLink variant="secondary" href="/teacher/courses">Back to courses</ButtonLink>
  </div>
 </section>;
}