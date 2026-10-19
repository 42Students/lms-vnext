"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
export default function HrActivityError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}) {
 return <section role="alert" className="space-y-4">
  <PageHeader title={"Hiring activity could not load"} />
  <p className="mt-2 max-w-xl text-sm text-body">
   The authorized employer history is unavailable. A failed read does not mean no events occurred.
   No applicant information has been loaded.
  </p>
  <Button className="mt-5" onClick={reset}>Retry hiring activity</Button>
 </section>;
}
