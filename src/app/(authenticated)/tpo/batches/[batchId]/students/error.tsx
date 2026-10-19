"use client";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{reset:()=>void}){return <section role="alert"><p>Unable to load the student eligibility grid.</p><Button variant="secondary" onClick={reset}>Retry</Button></section>;}