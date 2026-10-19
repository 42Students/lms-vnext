"use client";
import {Button} from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <section role="alert" className="py-6">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Unable to load placement preparation</h1>
    <p className="mt-2 text-sm text-body">
      Your registered information could not be loaded. This does not mean you
      are ineligible or that your record is empty.
    </p>
    <Button type="button" onClick={reset}
      className="mt-4">
      Retry
    </Button>
  </section>;
}
