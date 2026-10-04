import Link from "next/link";

export default function LearnerQuizAttemptPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/learn/allQuizzes"
          className="text-sm font-semibold text-primary-text hover:text-primary-hover"
        >
          ← All Quizzes
        </Link>
        <section
          className="mt-6 min-h-[70vh] rounded-xl border border-border bg-surface"
          aria-label="Quiz attempt"
        />
      </div>
    </main>
  );
}
