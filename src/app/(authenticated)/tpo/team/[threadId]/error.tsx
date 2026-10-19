"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}){return <section role="alert" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5"><h2 className="font-semibold">Private messages unavailable</h2><p className="text-sm text-body">No conversation content could be loaded.</p><Button type="button" variant="secondary" onClick={reset}>Retry</Button></section>;}
