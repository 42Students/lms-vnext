"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
export default function CollegeOfferingError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="mx-auto max-w-3xl space-y-4 rounded-xl border border-border bg-surface p-6">
  <h1 className="text-xl font-semibold text-foreground">Course details could not be loaded</h1>
  <p className="text-body">This is a loading problem, not a missing course. Check your connection and try again.</p>
  <div className="flex flex-wrap gap-4">
   <Button onClick={reset}>Retry</Button>
   <Link href="/college/courses" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Back to Courses</Link>
  </div>
 </section>;
}
