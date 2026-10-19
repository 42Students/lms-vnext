"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Project evidence could not load"} />
    <p className="text-sm text-body">Readiness is unavailable because the request failed, not because there are no gaps.</p>
    <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  </section>;
}
