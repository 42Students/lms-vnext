import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOwnLearnerApplicationCompany } from "@/modules/placements/learner-application-detail-service";
import { placementApplicationIdSchema } from "@/modules/placements/validation";

export default async function LearnerApplicationCompanyPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  if (!placementApplicationIdSchema.safeParse(applicationId).success) {
    notFound();
  }
  const context = await getCurrentRequestContext();
  const company = await getOwnLearnerApplicationCompany(context, applicationId);
  if (!company) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={"/learn/my-placements/applications?applicationId=" +
          encodeURIComponent(company.applicationId)}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Back to application
      </Link>
      <PageHeader
        eyebrow="My Placements · Employer"
        title={company.companyName}
        description="Read-only company profile from your own placement application."
        actions={
          <StatusBadge tone={company.companyStatus === "ACTIVE" ? "success" : "neutral"}>
            {company.companyStatus.replaceAll("_", " ")}
          </StatusBadge>
        }
      />
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Company and drive</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-muted-foreground">Employer</dt>
            <dd className="mt-1 text-foreground">{company.companyName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Applied role</dt>
            <dd className="mt-1 text-foreground">{company.roleTitle}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Placement drive</dt>
            <dd className="mt-1 text-foreground">{company.driveTitle}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Official website</dt>
            <dd className="mt-1 break-words text-foreground">
              {company.websiteUrl ? (
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center font-semibold text-primary-text underline"
                >
                  Visit employer website ↗
                </a>
              ) : (
                "No verified-safe public website URL is available."
              )}
            </dd>
          </div>
        </dl>
        <div role="status" className="mt-5 rounded-lg border border-border bg-surface-subtle p-4 text-sm text-body">
          What the company sees here is limited to the verified public employer profile
          associated with your own application. This is not a live employer-access audit.
          Your private files, personal contacts and other learners&apos; applications
          are never included in this preview.
        </div>
      </section>
    </div>
  );
}
