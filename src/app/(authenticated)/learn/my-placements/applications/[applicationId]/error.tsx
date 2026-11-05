"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
export default function LearnerApplicationDetailError({reset}:{
  error:Error&{digest?:string};reset:()=>void;
}){
  return <section className="min-w-0 space-y-4">
    <PageHeader title={"Application details could not load"} />
    <p className="mt-2 text-sm text-body">A loading error does not mean your application is missing.</p>
    <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      <TextLink href="/learn/my-placements/applications" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto text-sm md:min-h-9">Applications</TextLink>
    </div>
  </section>;
}