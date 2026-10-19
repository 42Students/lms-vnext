"use client";
import { useEffect } from "react";
import {PageHeader} from "@/components/ui/page-header";
export default function MentorNotificationsError({
  error,reset,
}: {error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error("Unable to load Mentor notifications",error);},[error]);
  return <div className="space-y-6" role="alert">
    <PageHeader eyebrow="Mentor" title="Notifications"/>
    <div className="border-b border-border pb-4">
      <p className="text-sm text-body">We couldn’t load your notifications. Please try again.</p>
      <button type="button" onClick={reset} className="mt-3 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link">
        Retry
      </button>
    </div>
  </div>;
}
