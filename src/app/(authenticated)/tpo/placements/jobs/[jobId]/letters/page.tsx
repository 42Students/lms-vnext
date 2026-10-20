import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { getPlacementJob } from "@/modules/placements/job-service";
import { listPlacementJobOffers } from "@/modules/placements/offer-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { placementJobIdSchema } from "@/modules/placements/validation";
import { projectOfferLetterEvidence } from "@/modules/placements/tpo-offer-letter-evidence-model";

export default async function TpoOfferLettersPage({
  params,
}: { params: Promise<{ jobId: string }> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const route = await params;
  const parsed = placementJobIdSchema.safeParse(route.jobId);
  if (!parsed.success) notFound();
  const job = await getPlacementJob(context, parsed.data);
  const offers = await listPlacementJobOffers(context, parsed.data);
  const projected = projectOfferLetterEvidence(offers.map(row => ({
    offerId: row.offer.id, offerStatus: row.offer.status,
    issuedAt: row.offer.issuedAt, respondedAt: row.offer.respondedAt,
  })));
  const evidenceByOfferId=new Map(offers.map((row,index)=>[row.offer.id,projected[index]] as const));
  return <div className="min-w-0 space-y-5">
    <PageHeader title={job.title+" · Offer letter evidence"}
      description="Persisted offer records are listed below. An issued offer is not proof that an offer letter was generated, sent, received or acknowledged."
      actions={<Link href={"/tpo/placements/jobs/" + encodeURIComponent(job.id)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">← Back to drive</Link>} />
    <Alert tone="warning">
      Letter-issued and letter-acknowledged states are unavailable: the registered
      placement offer schema has no letter document, delivery or acknowledgement
      record. Bulk letter-status changes are disabled until their owner-approved
      transition contract and registered persistence exist.
    </Alert>
    <DataTable<(typeof offers)[number]> caption="Offer letter evidence"
      rows={offers} getRowKey={row=>row.offer.id}
      empty={<EmptyState title="No persisted offers exist for this drive."/>}
      columns={[
        {key:"candidate",header:"Candidate",mobilePriority:"primary",cell:row=><strong>{row.candidate.displayName??"Unnamed learner"}</strong>},
        {key:"offer",header:"Offer",mobilePriority:"secondary",cell:row=>row.offer.status},
        {key:"issued",header:"Offer issued",mobilePriority:"secondary",cell:row=>evidenceByOfferId.get(row.offer.id)?.persistedOfferIssuedAt??"Not recorded"},
        {key:"letter",header:"Letter issued",mobilePriority:"secondary",cell:()=>"Unavailable"},
        {key:"ack",header:"Letter acknowledged",mobilePriority:"secondary",cell:()=>"Unavailable"},
      ]}/>

  </div>;
}
