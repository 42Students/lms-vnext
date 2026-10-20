import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/page-loading";
import { LearnerQuizAttempt } from "@/components/courses/learner-quiz-attempt";

export default function LearnerQuizAttemptPage() {
  return (
    <main className="min-h-dvh bg-[var(--lms-neutral-100)] px-4 py-6 text-[var(--lms-neutral-900)] min-[768px]:px-6">
      <div className="mx-auto w-full min-w-0 max-w-6xl rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-canvas-padding)]">
        <Link
          href="/learn/allQuizzes"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-9"
        >
          ← All Quizzes
        </Link>
        <div className="mt-5">
          <Suspense fallback={<PageLoading label="Loading quiz…" variant="form" count={4}/>}>
            <LearnerQuizAttempt />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
