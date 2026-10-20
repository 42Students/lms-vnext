"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
  return <section role="alert" className="space-y-3 p-5"><PageHeader title={"Gradebook could not load"} /><p>Scores are unavailable, not zero.</p><Button type="button" variant="secondary" onClick={reset} className="text-primary-text inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold">Retry</Button></section>;
}