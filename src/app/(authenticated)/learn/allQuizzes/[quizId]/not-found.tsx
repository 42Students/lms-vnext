import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function QuizHistoryNotFound(){
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Page not found"/>
    <p className="max-w-prose text-sm text-body">This page may have moved or is no longer available.</p>
    <Link href="/learn/allQuizzes" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">All Quizzes</Link>
  </section>;
}
