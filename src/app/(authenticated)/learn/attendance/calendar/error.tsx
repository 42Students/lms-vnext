"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};
  reset:()=>void;
}) {
  return <section role="alert" className="py-6">
    <PageHeader title={"Attendance calendar could not be loaded"} />
    <p className="mt-2 text-sm text-body">
      The read failed; missing or unmarked sessions cannot be inferred from this error.
    </p>
    <Button type="button" onClick={reset}
      className="mt-4">
      Retry
    </Button>
  </section>;
}
