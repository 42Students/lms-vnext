"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
 return <section role="alert" className="min-w-0 space-y-4">
  <PageHeader title="Gradebook could not load" />
  <p className="max-w-xl text-sm leading-6 text-body">Scores are unavailable, not zero.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
   <Button onClick={reset}>Retry</Button>
   <Link href="/teacher/courses" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Back to courses</Link>
  </div>
 </section>;
}
