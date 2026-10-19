"use client";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{reset:()=>void}){return <section role="alert" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5"><p>Unable to load eligibility history.</p><Button variant="secondary" onClick={reset}>Retry</Button></section>;}