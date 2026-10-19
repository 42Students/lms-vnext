"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerSupportError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <section className="py-6 text-center">
    <PageHeader title={"Support requests could not load"} />
    <p className="mt-2 text-sm text-body">This is a loading error, not proof that no requests exist.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button onClick={reset}>Retry</Button>
      <Link href="/learn/my-placements/placement" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">Placement Cell</Link>
    </div>
  </section>;
}