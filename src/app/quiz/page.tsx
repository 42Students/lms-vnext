import Link from "next/link";
import { Suspense } from "react";
import { LearnerQuizAttempt } from "@/components/courses/learner-quiz-attempt";

export default function LearnerQuizAttemptPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/learn/allQuizzes"
          className="text-sm font-semibold text-primary-text hover:text-primary-hover"
        >
          ← All Quizzes
        </Link>
        <div className="mt-5">
          <Suspense fallback={<div className="rounded-xl border border-border bg-surface p-8 text-sm text-body">Loading quiz…</div>}>
            <LearnerQuizAttempt />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
