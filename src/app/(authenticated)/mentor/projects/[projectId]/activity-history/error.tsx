"use client";
import { Button } from "@/components/ui/button";


export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <section role="alert" className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Unable to load Mentor project activity history</h1>
    <p className="mt-2 text-sm text-body">
      The read failed; an error is not evidence that no records exist.
    </p>
    <Button type="button" variant="secondary" onClick={reset}>
      Retry
    </Button>
  </section>;
}
