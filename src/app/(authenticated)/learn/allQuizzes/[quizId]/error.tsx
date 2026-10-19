"use client";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerQuizHistoryError({reset}:{
  error:Error&{digest?:string}; reset:()=>void;
}) {
  return (
    <ErrorState title={"Could not load quiz history"} description={"No results can be inferred from a failed request."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn/allQuizzes" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">All Quizzes</Link></div>} />
  );
}