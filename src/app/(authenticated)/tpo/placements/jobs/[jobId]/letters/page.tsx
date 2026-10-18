import Link from "next/link";
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
  return <div className="min-w-0 space-y-5">
    <Link href={"/tpo/placements/jobs/" + encodeURIComponent(job.id)}
      className="text-sm font-semibold text-[var(--lms-teal-deep)]">← Back to drive</Link>
    <header>
      <h1 className="text-2xl font-bold text-foreground">{job.title} · Offer letter evidence</h1>
      <p className="mt-2 text-sm text-body">
        Persisted offer records are listed below. An issued offer is not proof
        that an offer letter was generated, sent, received or acknowledged.
      </p>
    </header>
    <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      Letter-issued and letter-acknowledged states are unavailable: the registered
      placement offer schema has no letter document, delivery or acknowledgement
      record. Bulk letter-status changes are disabled until their owner-approved
      transition contract and registered persistence exist.
    </p>
    {offers.length === 0 ?
      <p role="status" className="rounded-xl border border-border p-6 text-sm text-body">
        No persisted offers exist for this drive.
      </p> :
      <div className="overflow-auto rounded-xl border border-border bg-surface">
        <table className="min-w-[42rem] w-full text-left text-sm">
          <thead className="bg-surface-subtle">
            <tr>{["Candidate", "Offer", "Offer issued", "Letter issued", "Letter acknowledged"].map(x =>
              <th key={x} scope="col" className="px-4 py-3">{x}</th>)}</tr>
          </thead>
          <tbody>
            {offers.map((row, index) => {
              const evidence = projected[index];
              return <tr key={row.offer.id} className="border-t border-border">
                <td className="px-4 py-3">{row.candidate.displayName ?? "Unnamed learner"}</td>
                <td className="px-4 py-3">{row.offer.status}</td>
                <td className="px-4 py-3">
                  {evidence?.persistedOfferIssuedAt ?? "Not recorded"}
                </td>
                <td className="px-4 py-3">Unavailable</td>
                <td className="px-4 py-3">Unavailable</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>}
  </div>;
}
