import type { Metadata, Viewport } from "next";
export const metadata: Metadata = { title: "42Learn <-> Quiz", icons: {icon:"/assets/images/legacy-42lms-logo.svg"} };
export const viewport: Viewport = { viewportFit:"cover" };
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/page-loading";
import { LearnerQuizAttempt } from "@/components/courses/learner-quiz-attempt";
import { Img } from "@/components/ui/img";
import { TextLink } from "@/components/ui/text-link";

export default function LearnerQuizAttemptPage() {
  return (
    <main className="min-h-dvh w-full bg-[var(--lms-neutral-100)] text-[var(--lms-neutral-900)]">
      <div className="mx-auto min-h-dvh w-full min-w-0">
        <TextLink
          href="/learn/allQuizzes"
          className="inline-flex min-h-11 items-center px-4 text-sm md:min-h-9"
        >
          <Img src="/assets/images/legacy-42lms-logo.svg" alt="42Learn" width={130} height={40} className="mr-3 h-10 w-[132px] object-contain" />
          <span>Cancel quiz · All Quizzes</span>
        </TextLink>
        <div className="min-h-[calc(100dvh-4rem)]">
          <Suspense fallback={<PageLoading label="Loading quiz…" variant="form" count={4}/>}>
            <LearnerQuizAttempt />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
