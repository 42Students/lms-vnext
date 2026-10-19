"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";export default function Error({reset}:{error:Error;reset:()=>void}){return (
    <ErrorState title={"Verification status unavailable"} description={"Please retry. A load failure does not mean a verification was rejected."}
      action={<div className="flex flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset}>Retry</Button></div>} />
  );
}