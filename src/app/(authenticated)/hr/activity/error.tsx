"use client";
import {Button} from "@/components/ui/button";
export default function HrActivityError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}) {
 return <section role="alert" className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
  <h1 className="text-lg font-semibold text-foreground">Hiring activity could not load</h1>
  <p className="mx-auto mt-2 max-w-xl text-sm text-body">
   The authorized employer history is unavailable. A failed read does not mean no events occurred.
   No applicant information has been loaded.
  </p>
  <Button className="mt-5" onClick={reset}>Retry hiring activity</Button>
 </section>;
}
