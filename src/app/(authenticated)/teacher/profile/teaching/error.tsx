"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <section role="alert" className="border-b border-border bg-transparent py-6">
    <PageHeader title={"Unable to load Faculty teaching profile"} />
    <p className="mt-2 text-sm text-body">
      The read failed; an error is not evidence that no records exist.
    </p>
    <Button variant="secondary" type="button" onClick={reset}
      className="mt-4">
      Retry
    </Button>
  </section>;
}
