import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";

import { ROLE } from "@/modules/identity/roles";
export default async function UnknownTpoReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) {
    redirect("/dashboard");
  }
  const { slug } = await params;
  // Map legacy report names to the current layout while retaining role scoping.
  const aliases: Record<string, string> = {
    summary: "placement-summary", placement: "placement-summary",
    branch: "by-branch", branches: "by-branch",
    company: "by-company", companies: "by-company",
    packages: "ctc", package: "ctc",
    "unplaced-students": "unplaced",
    offers: "offers-acceptance", acceptance: "offers-acceptance",
    joining: "joining-status", outcomes: "after-college",
    reasons: "failure-reasons", failure: "failure-reasons",
    "recruiter-leads": "leads", "recruiter-engagement": "leads",
    "lead-funnel": "leads", naac: "accreditation", nirf: "accreditation",
    aftercollege: "after-college",
  };
  const destination = aliases[slug.trim().toLowerCase()];
  if (destination) {
    const query = await searchParams;
    const safe = new URLSearchParams();
    for (const key of ["seasonId", "jobId", "batchId", "branchId", "companyId"] as const) {
      const value = query[key];
      if (typeof value === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) safe.set(key,value);
    }
    redirect("/tpo/reports/" + destination + (safe.size ? "?" + safe.toString() : ""));
  }
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        title="Unknown report"
        description="This report is not available. Check the address or return to the report list."
        actions={<ButtonLink variant="primary" href="/tpo/reports"
          className="w-full sm:w-auto">
          Back to reports
        </ButtonLink>}
      />
      <Alert tone="error">
        <p className="text-sm leading-6 text-body">
          We could not find that report. Your existing placement data has not changed.
        </p>

      </Alert>
    </div>
  );
}
