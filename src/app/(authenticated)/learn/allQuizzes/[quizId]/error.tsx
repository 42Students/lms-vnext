"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearnerQuizHistoryError({reset}:{
  error:Error&{digest?:string}; reset:()=>void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title={"Could not load quiz history"} />
    <Alert tone="error">No results can be inferred from a failed request.</Alert>
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      <Link href="/learn/allQuizzes" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">All Quizzes</Link>
    </div>
  </div>;
}