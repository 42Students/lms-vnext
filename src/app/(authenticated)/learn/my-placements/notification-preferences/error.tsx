"use client";
import { ErrorState } from "@/components/ui/error-state";

import { Button } from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}){
  return (
    <ErrorState title={"Could not load placement notification preferences"} description={"The read failed. No saved-state assumption was made."}
      action={<div className="flex flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset}
      className="mt-4 min-h-11">Retry</Button></div>} />
  );
}
