"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function ProfileChecklistError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title={"Could not load your profile checklist"} />
    <p className="mt-2 text-sm text-body">We cannot infer profile completion while the read failed.</p>
    <div className="mt-4 flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
      <Link href="/learn/profile" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto text-sm font-semibold text-primary-text min-[768px]:min-h-9">Profile</Link>
    </div>
  </div>;
}