"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function FacultyProfileDetailsError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <ErrorState title="Faculty profile could not load" description="Your previous information has not been changed."
 action={<div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row"><Button onClick={reset} className="w-full sm:w-auto">Retry</Button><Link href="/teacher/profile" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Profile</Link></div>}/>;
}
