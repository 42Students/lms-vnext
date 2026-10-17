import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/page-loading";
import { LearnerQuizAttempt } from "@/components/courses/learner-quiz-attempt";

export default function LearnerQuizAttemptPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/learn/allQuizzes"
          className="text-sm font-semibold text-[var(--lms-link-text)] hover:text-primary-hover"
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
