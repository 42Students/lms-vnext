"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};
  reset:()=>void;
}) {
  return (
    <ErrorState title={"Attendance calendar could not be loaded"} description={"The read failed; missing or unmarked sessions cannot be inferred from this error."}
      action={<div className="flex flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset}>Retry</Button></div>} />
  );
}
