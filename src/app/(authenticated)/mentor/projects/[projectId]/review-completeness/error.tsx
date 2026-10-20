"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function Error({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <section role="alert" className="min-w-0 max-w-full space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Delivery review read failed"} />
    <p className="m-0 text-sm text-body">
      Unavailable records do not prove a missing submission or missing review.
    </p>
    <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>
      Retry
    </Button>
  </section>;
}
