"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";

export default function HrActivityError({reset}:{error:Error & {digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Hiring activity could not load"/>
    <Alert tone="error">
      <p>The authorized employer history is unavailable. A failed read does not mean no events occurred. No applicant information has been loaded.</p>
      <div className="mt-2"><Button type="button" variant="secondary" onClick={reset}>Retry hiring activity</Button></div>
    </Alert>
  </div>;
}
