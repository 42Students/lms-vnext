"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
return <section role="alert" className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]"><PageHeader title={"Unable to load discussion history"} /><p className="mt-2 text-sm text-body">The read failed; missing events cannot be assumed.</p><Button type="button" variant="secondary" onClick={reset} className="mt-4 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold">Retry</Button></section>;
}
