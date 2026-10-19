"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return (
    <ErrorState title={"Unable to load placement preparation"} description={"Your registered information could not be loaded. This does not mean you are ineligible or that your record is empty."}
      action={<div className="flex flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset}>Retry</Button></div>} />
  );
}
