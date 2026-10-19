"use client";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
  <h1 className="font-semibold">Couldn&apos;t refresh batches</h1>
  <p className="text-sm text-body">The latest batch data could not be loaded. No eligibility decisions were changed.</p>
  <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
 </section>;
}
