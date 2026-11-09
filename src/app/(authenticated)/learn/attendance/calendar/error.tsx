"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

/** Preserve retry and a safe attendance-detail route on a failed calendar read. */
export default function Error({reset}:{
  error:Error & {digest?:string};
  reset:()=>void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Attendance calendar could not be loaded" />
    <Alert tone="error">The read failed; missing or unmarked sessions cannot be inferred from this error.</Alert>
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button type="button" onClick={reset}
        className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>
      <ButtonLink variant="secondary" href="/learn/attendance"
        className="min-h-11 w-full sm:w-auto md:min-h-9">
        View attendance details
      </ButtonLink>
    </div>
  </section>;
}
