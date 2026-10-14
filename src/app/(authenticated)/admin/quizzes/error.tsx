"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function AdminQuizzesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load quizzes" description="The selected college quiz directory is unavailable." action={<Button onClick={reset}>Retry</Button>} />;
}
