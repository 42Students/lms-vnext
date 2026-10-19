"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error;reset:()=>void}){return <section role="alert" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]"><PageHeader title={"Unable to load task feedback"} /><p className="text-sm text-body">A failed read is not an empty review history.</p><Button type="button" variant="secondary" onClick={reset}>Retry</Button></section>}