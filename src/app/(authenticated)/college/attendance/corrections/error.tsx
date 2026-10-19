"use client";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegeCorrectionReadError({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <ErrorState title="Attendance correction evidence unavailable"
    description="The college attendance records could not be loaded. A missing result is not assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-[var(--lms-control-radius,9px)] border border-border px-4 font-semibold text-primary-text">Retry</button>}/>;
}
