"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import authStyles from "@/components/public/public-auth-skin.module.css";
import { Button } from "@/components/ui/button";
export default function CompanyShareError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <main style={{minHeight:"100dvh"}} className={`${authStyles["page"]} mx-auto flex w-full max-w-xl min-w-0 flex-col justify-center px-4 pb-8 pt-24 min-[768px]:py-12`}>
  <section aria-label="Shared applicant loading error" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
   <PageHeader title="We couldn&apos;t load this share" />
   <p role="alert" className="text-sm text-body">
    We couldn&apos;t load the shared applicant list right now. Please retry. If this keeps happening, contact the placement cell.
   </p>
   <Button type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={reset}>Retry</Button>
   <Link href="/" className="inline-flex min-h-11 w-full items-center justify-center px-4 text-sm md:min-h-9 md:w-auto font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Home</Link>
  </section>
 </main>;
}
