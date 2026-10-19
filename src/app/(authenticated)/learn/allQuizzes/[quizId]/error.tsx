"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerQuizHistoryError({reset}:{
  error:Error&{digest?:string}; reset:()=>void;
}) {
  return <div className="py-6 text-center">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Could not load quiz history</h1>
    <p className="mt-2 text-sm text-body">No results can be inferred from a failed request.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button onClick={reset}>Retry</Button>
      <Link href="/learn/allQuizzes" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">All Quizzes</Link>
    </div>
  </div>;
}