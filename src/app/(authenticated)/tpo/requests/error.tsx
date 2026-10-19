"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
export default function TpoRequestsError({reset}:{reset:()=>void}){
 return <Alert tone="error" className="space-y-3">
  <h1 className="text-lg font-semibold">Could not load requests</h1>
  <p className="text-sm">Requests are temporarily unavailable. Your selected filters will be kept when you retry.</p>
  <div className="flex flex-wrap gap-3">
   <Button variant="secondary" type="button" onClick={reset} >Retry requests</Button>
   <Link href="/tpo/students" className="inline-flex min-h-11 items-center text-primary-text underline">Back to students</Link>
  </div>
 </section>;
}
