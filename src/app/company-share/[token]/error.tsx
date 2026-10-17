"use client";
import Link from "next/link";
export default function CompanyShareError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
  <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
   <h1 className="text-xl font-semibold text-foreground">We couldn&apos;t load this share</h1>
   <p className="text-sm text-body">
    We couldn&apos;t load the shared applicant list right now. Please retry. If this keeps happening, contact the placement cell.
   </p>
   <button type="button" onClick={reset}
    className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary">
    Retry
   </button>
   <Link href="/" className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-primary-text underline">Home</Link>
  </section>
 </main>;
}
