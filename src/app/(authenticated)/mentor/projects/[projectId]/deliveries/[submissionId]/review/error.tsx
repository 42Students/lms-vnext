"use client";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Delivery review could not load</h1>
    <p className="text-sm text-body">A failed read is not evidence that this version has no review.</p>
    <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  </section>;
}
