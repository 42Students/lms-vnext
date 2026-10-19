"use client";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{reset:()=>void}){return <section role="alert"><p>Unable to load eligibility history.</p><Button variant="secondary" onClick={reset}>Retry</Button></section>;}