import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";

export default async function UnknownTpoReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  await params;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Unknown report"
        description="This report is not available. Check the address or return to the report list."
      />
      <section role="alert" className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Unknown report</h2>
        <p className="mt-2 text-sm text-body">
          We could not find that report. Your existing placement data has not changed.
        </p>
        <Link href="/tpo/reports"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">
          Back to reports
        </Link>
      </section>
    </div>
  );
}
