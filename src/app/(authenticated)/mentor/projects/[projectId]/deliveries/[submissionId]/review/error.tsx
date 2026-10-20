"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="min-w-0 max-w-full space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Delivery review could not load"} />
    <p className="text-sm text-body">A failed read is not evidence that this version has no review.</p>
    <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>
  </section>;
}
