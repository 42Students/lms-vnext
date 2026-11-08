"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
export default function AdminQuizzesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4"><PageHeader title="Quizzes" /><ErrorState title="Could not load quizzes" description="The selected college quiz directory is unavailable." action={<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={reset}>Retry</Button><ButtonLink href="/admin/courses" variant="secondary" className="min-h-11 w-full sm:w-auto">Back to courses</ButtonLink></div>} /></div>;
}
