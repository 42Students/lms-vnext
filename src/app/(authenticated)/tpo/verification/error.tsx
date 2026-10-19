"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
export default function TpoVerificationError({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-5">
  <h1 className="text-lg font-semibold">Could not load verification</h1>
  <p className="text-sm">This information is temporarily unavailable. Your filters are still selected.</p>
  <div className="flex flex-wrap gap-3">
   <Button variant="secondary" type="button" onClick={reset} >Retry verification</Button>
   <Link href="/tpo/students" className="inline-flex min-h-11 items-center text-primary-text underline">Back to students</Link>
  </div>
 </section>;
}