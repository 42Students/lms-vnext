"use client";
import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerInterviewError({ error,reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={["FORBIDDEN","PLACEMENTS_ACCESS_DENIED","LEARNER_MEMBERSHIP_REQUIRED"].includes(error.message)?"Schedule access unavailable":"We could not load your schedule"} />
      <p className="mt-2 text-sm text-body">
        {["FORBIDDEN","PLACEMENTS_ACCESS_DENIED","LEARNER_MEMBERSHIP_REQUIRED"].includes(error.message)
         ?"Your learner placement access is no longer active. Choose another authorized workspace or contact your placement cell."
         :"A loading failure does not mean you have no scheduled interview rounds."}
      </p>
      <div className="mt-4 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        {!["FORBIDDEN","PLACEMENTS_ACCESS_DENIED","LEARNER_MEMBERSHIP_REQUIRED"].includes(error.message)?
         <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Try again</Button>:null}
        <Link href="/learn/my-placements/schedule"
          className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto text-sm font-semibold text-primary-text hover:underline md:min-h-9">
          Open Schedule
        </Link>
      </div>
    </section>
  );
}
