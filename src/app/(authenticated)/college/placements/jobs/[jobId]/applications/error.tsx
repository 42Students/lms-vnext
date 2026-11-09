"use client";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { ErrorState } from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
export default function ErrorPage({ reset }: {error: Error & {digest?:string};reset:()=>void}) {
  const params = useParams<{ jobId?: string }>();
  const jobId = params?.jobId;
  const driveHref = jobId && /^[0-9a-f-]{36}$/i.test(jobId)
    ? `/college/placements/jobs/${encodeURIComponent(jobId)}/overview`
    : "/college/placements/jobs";
  return <div className="min-w-0 space-y-4"><PageHeader title="Placement applications"/><ErrorState title="Applications unavailable" description="Could not load applicants. No empty or zero count is inferred."
    action={<><Button variant="secondary" type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry applications</Button><TextLink href={driveHref} className="inline-flex min-h-11 items-center md:min-h-9">Drive overview</TextLink></>} /></div>;
}
