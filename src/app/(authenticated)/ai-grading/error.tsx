"use client";
import Link from "next/link";
export default function FacultyAiGradingError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}){
 return <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
  <h1 className="text-xl font-semibold text-foreground">Grading review unavailable</h1>
  <p className="text-sm text-body">The submission review could not be loaded. No grade was saved or published by this page.</p>
  <div className="flex flex-wrap gap-3">
   <button type="button" onClick={reset} className="rounded-md border border-border px-4 py-2 text-sm font-semibold">Retry authorized review</button>
   <Link href="/teacher/allAssignments" className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">Back to assignments</Link>
  </div>
 </section>;
}
