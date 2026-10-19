"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
    <PageHeader title={"Discussion participation could not load"} /><p>The read failed. Missing results are not assumed to be zero.</p>
    <Button type="button" variant="secondary" type="button" onClick={reset} className="min-h-10 text-primary-text inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold">Retry</Button>
  </section>;
}
