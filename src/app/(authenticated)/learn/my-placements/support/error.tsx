"use client";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerSupportError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return (
    <ErrorState title={"Support requests could not load"} description={"This is a loading error, not proof that no requests exist."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn/my-placements/placement" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">Placement Cell</Link></div>} />
  );
}