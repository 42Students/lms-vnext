"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import {PageHeader} from "@/components/ui/page-header";
export default function MentorNotificationsError({
  error,reset,
}: {error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error("Unable to load Mentor notifications",error);},[error]);
  return <div className="min-w-0 max-w-full space-y-4" role="alert">
    <PageHeader eyebrow="Mentor" title="Notifications"/>
    <div className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <p className="text-sm text-body">We couldn’t load your notifications. Please try again.</p>
      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>
        Retry
      </Button>
    </div>
  </div>;
}
