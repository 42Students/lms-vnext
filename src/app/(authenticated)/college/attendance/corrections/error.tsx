"use client";
import { Button } from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegeCorrectionReadError({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <ErrorState title="Attendance correction evidence unavailable"
    description="The college attendance records could not be loaded. A missing result is not assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/>;
}
