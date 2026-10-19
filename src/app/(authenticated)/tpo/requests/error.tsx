"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import {Button} from "@/components/ui/button";
export default function TpoRequestsError({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3">
  <PageHeader title={"Could not load requests"} />
  <p className="text-sm">Requests are temporarily unavailable. Your selected filters will be kept when you retry.</p>
  <div className="flex flex-wrap gap-3">
   <Button variant="secondary" type="button" onClick={reset} >Retry requests</Button>
   <Link href="/tpo/students" className="inline-flex min-h-11 items-center text-primary-text underline">Back to students</Link>
  </div>
 </section>;
}
