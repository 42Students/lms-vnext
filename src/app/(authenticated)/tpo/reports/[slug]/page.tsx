import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";

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
      <Alert tone="error">
        <h2 className="text-lg font-semibold text-foreground">Unknown report</h2>
        <p className="mt-2 text-sm text-body">
          We could not find that report. Your existing placement data has not changed.
        </p>
        <Link href="/tpo/reports"
          className="mt-4 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary">
          Back to reports
        </Link>
      </Alert>
    </div>
  );
}
