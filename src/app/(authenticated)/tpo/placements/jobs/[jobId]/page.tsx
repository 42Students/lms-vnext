import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { getPlacementJob } from "@/modules/placements/job-service";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { can } from "@/modules/permissions/policy";
import {tpoDriveTabHref} from "@/modules/placements/tpo-drive-tab-model";
import {ErrorState} from "@/components/ui/error-state";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

export default async function TpoPlacementDrivePage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ publish?: string | string[]; tab?: string | string[]; roundId?: string | string[] }>;
}) {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !can(context, "placements.manage", { collegeId: context.membership.collegeId })
  ) {
    redirect("/dashboard");
  }
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  const openPublish = (Array.isArray(query.publish) ? query.publish[0] : query.publish) === "1";
  // Unknown ids, other colleges' drives and malformed ids all render the same Not Found page.
  let job:Awaited<ReturnType<typeof getPlacementJob>>;
  try {
    job=await getPlacementJob(context, jobId);
  } catch (error) {
    if(error instanceof ZodError||error instanceof AuthorizationError)
      notFound();
    if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")
      return <ErrorState title="This drive doesn't exist"
        description="This drive is not available in your college."
        action={<TextLink href="/tpo/placements/jobs">Go to Drives</TextLink>}/>;
    return <ErrorState title="Could not load drive"
      description="Please retry loading this drive."
      action={<TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)}>Retry</TextLink>}/>;
  }
  const tab=Array.isArray(query.tab)?query.tab[0]:query.tab;
  if(tab&&["applicants","rounds","offers","drive-day","discussion","about","overview"].includes(tab)){
    const roundId=Array.isArray(query.roundId)?query.roundId[0]:query.roundId;
    // Preserve /tpo/drives/:jobId?tab=rounds-style deep links while the
    // vNext tab is a routed page. Only UUID round anchors are accepted.
    const focus=tab==="rounds"&&roundId&&
      /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(roundId)
      ? "#round-"+encodeURIComponent(roundId):"";
    redirect(tpoDriveTabHref(jobId,tab==="overview"?"about":tab)+focus);
  }
  // Legacy opens About for requests and drafts, Applicants for live/closed
  // drives. The explicit publish workflow still stays in this root workspace.
  if(!openPublish){
    redirect(tpoDriveTabHref(jobId,
      job.status==="PUBLISHED"||job.status==="CLOSED"?"applicants":"about"));
  }
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap justify-end gap-2" aria-label="Drive discussions">
        <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/discussion"}>
         Discussion
        </ButtonLink>
      </div>
      <PlacementDriveWorkspace context={context} jobId={jobId} eyebrow="TPO" openPublish={openPublish}/>
      <Disclosure title={<>
          Drive shortcuts <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
        </>} className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center justify-between gap-3">
      <nav aria-label="Drive shortcuts" className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
      <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/discussion"}
        className="w-full sm:w-auto">Discuss →</ButtonLink>
      <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/interview-slots"}
        className="w-full max-w-full sm:w-auto">
        Employer interview slot proposals →
      </ButtonLink>
      </nav>
      </Disclosure>
    </div>
  );
}
