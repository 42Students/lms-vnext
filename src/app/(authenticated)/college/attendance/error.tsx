"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function CollegeAttendanceError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Couldn't load attendance"
    description="Attendance oversight failed to load. No student status is inferred from this failure."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/>;
}
