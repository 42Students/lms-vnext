"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerApplicationDetailError({reset}:{
  error:Error&{digest?:string};reset:()=>void;
}){
  return <section className="min-w-0 space-y-4">
    <PageHeader title={"Application details could not load"} />
    <p className="mt-2 text-sm text-body">A loading error does not mean your application is missing.</p>
    <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      <Link href="/learn/my-placements/applications" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto text-sm font-semibold text-primary-text hover:underline md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Applications</Link>
    </div>
  </section>;
}