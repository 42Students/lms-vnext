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
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button className="max-md:min-h-11" onClick={reset}>Retry</Button>
      <Link href="/learn/my-placements/applications" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline md:min-h-9">Applications</Link>
    </div>
  </section>;
}