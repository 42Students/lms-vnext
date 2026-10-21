import Link from "next/link";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = { title: "42Learn <-> Quiz", icons: {icon:"/assets/images/legacy-42lms-logo.svg"} };
export const viewport: Viewport = { viewportFit:"cover" };
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/page-loading";
import { LearnerQuizAttempt } from "@/components/courses/learner-quiz-attempt";

export default function LearnerQuizAttemptPage() {
  return (
    <main className="min-h-dvh w-full bg-[var(--lms-neutral-100)] text-[var(--lms-neutral-900)]">
      <div className="mx-auto min-h-dvh w-full min-w-0">
        <Link
          href="/learn/allQuizzes"
          className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-[var(--lms-link-text)] hover:underline hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9"
        >
          <img src="/assets/images/legacy-42lms-logo.svg" alt="42Learn" width={130} height={40} className="mr-3 h-10 w-[130px] object-contain" />
          <span>Cancel quiz · All Quizzes</span>
        </Link>
        <div className="min-h-[calc(100dvh-4rem)]">
          <Suspense fallback={<PageLoading label="Loading quiz…" variant="form" count={4}/>}>
            <LearnerQuizAttempt />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
