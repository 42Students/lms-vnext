"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeContactsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [noticeVisible,setNoticeVisible]=useState(true);
  // Route error notification is client-only: retry navigates an authorized GET
  // and never enqueues email, SMS or other outbound delivery.
  useEffect(()=>{
    const timeout=window.setTimeout(()=>setNoticeVisible(false),5000);
    return ()=>window.clearTimeout(timeout);
  },[]);
  return <>
    {noticeVisible?<div role="status" aria-live="polite"
      className="fixed bottom-5 right-5 z-50 w-[min(calc(100vw-2.5rem),25rem)] rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 shadow-lg">
      <strong className="block text-sm text-foreground">Couldn't load contacts</strong>
      <p className="mt-1 text-sm text-body">Something went wrong on our end. Please refresh the page or try again shortly.</p>
    </div>:null}
    <ErrorState title="Couldn't load contacts" description="Something went wrong on our end. Please refresh the page or try again shortly."
    action={<><Button variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>
      <Link href="/college/contacts" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Clear filters</Link></>} />
  </>;
}
