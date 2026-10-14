import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoDueFollowupWorkspace } from "@/components/tpo/tpo-due-followup-workspace";
import { getTpoDueFollowupQueue } from "@/modules/placements/tpo-followup-queue-service";

export const dynamic = "force-dynamic";

export default async function TpoFollowupQueuePage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const ready = process.env.DB09_TPO_API_READY === "DB09_VERIFIED";
  const data = ready ? await getTpoDueFollowupQueue(context) : null;
  return (
    <div className="space-y-6">
      <Link href="/tpo/recruiters"
        className="text-sm font-semibold text-primary-text hover:underline">
        ← Back to recruiter leads
      </Link>
      <PageHeader eyebrow="TPO · Recruiter relationships" title="Follow-ups due"
        description="Schedule recruiter follow-ups and log completed outcomes using registered CRM data." />
      {data ? <TpoDueFollowupWorkspace data={data} /> : (
        <section role="status" className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-semibold text-foreground">Recruiter follow-ups unavailable</h2>
          <p className="mt-2 text-sm text-body">
            DB09 must be verified before recruiter follow-ups can be loaded or changed.
            Unavailable records are not counted as zero.
          </p>
        </section>
      )}
    </div>
  );
}
