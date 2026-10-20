"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import authStyles from "@/components/public/public-auth-skin.module.css";
import { Button } from "@/components/ui/button";
export default function CompanyShareError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10`}>
  <section role="alert" className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
   <PageHeader title="We couldn&apos;t load this share" />
   <p className="text-sm text-body">
    We couldn&apos;t load the shared applicant list right now. Please retry. If this keeps happening, contact the placement cell.
   </p>
   <Button type="button" onClick={reset}>Retry</Button>
   <Link href="/" className="inline-flex min-h-9 items-center px-4 text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Home</Link>
  </section>
 </main>;
}
