"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
  return <section role="alert" className="space-y-3 p-5">
    <PageHeader title={"Published learner scores could not load"} />
    <p>The read failed. Missing scores are not assumed to be zero.</p>
    <Button type="button" variant="secondary" type="button" onClick={reset} className="text-primary-text inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold">Retry</Button>
  </section>;
}
