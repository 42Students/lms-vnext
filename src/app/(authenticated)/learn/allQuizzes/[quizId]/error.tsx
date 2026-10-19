"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerQuizHistoryError({reset}:{
  error:Error&{digest?:string}; reset:()=>void;
}) {
  return <div className="py-6 text-center">
    <PageHeader title={"Could not load quiz history"} />
    <p className="mt-2 text-sm text-body">No results can be inferred from a failed request.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button onClick={reset}>Retry</Button>
      <Link href="/learn/allQuizzes" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">All Quizzes</Link>
    </div>
  </div>;
}