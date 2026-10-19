"use client";
import Link from "next/link";
export default function TpoRequestsError({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-5">
  <h1 className="text-lg font-semibold">Could not load requests</h1>
  <p className="text-sm">Requests are temporarily unavailable. Your selected filters will be kept when you retry.</p>
  <div className="flex flex-wrap gap-3">
   <button type="button" onClick={reset} className="min-h-11 rounded-[9px] border border-border px-4 font-semibold text-primary-text focus-visible:ring-2">Retry requests</button>
   <Link href="/tpo/students" className="inline-flex min-h-11 items-center text-primary-text underline">Back to students</Link>
  </div>
 </section>;
}
