"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerSupportError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={"Support requests could not load"} />
    <p className="mt-2 text-sm text-body">This is a loading error, not proof that no requests exist.</p>
    <div className="mt-4 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      <Link href="/learn/my-placements/placement" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">Placement Cell</Link>
    </div>
  </section>;
}