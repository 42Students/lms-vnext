"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <section role="alert" className="py-6">
    <PageHeader title={"Unable to load placement preparation"} />
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
