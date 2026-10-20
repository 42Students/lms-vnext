"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import {Button} from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};
  reset:()=>void;
}) {
  return <section className="min-w-0 space-y-4 py-4">
    <PageHeader title={"Attendance calendar could not be loaded"} />
    <Alert tone="error">The read failed; missing or unmarked sessions cannot be inferred from this error.</Alert>
    <Button type="button" onClick={reset}
      className="min-h-11 md:min-h-9">
      Retry
    </Button>
  </section>;
}
