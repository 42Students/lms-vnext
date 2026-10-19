"use client";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerApplicationDetailError({reset}:{
  error:Error&{digest?:string};reset:()=>void;
}){
  return (
    <ErrorState title={"Application details could not load"} description={"A loading error does not mean your application is missing."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn/my-placements/applications" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline sm:min-h-9">Applications</Link></div>} />
  );
}