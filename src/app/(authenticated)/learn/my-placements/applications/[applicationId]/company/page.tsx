import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
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
        className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline"
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
      <section aria-label="What the company sees" className="border-b border-border py-4 sm:py-6">
        <h2 className="text-base font-semibold text-foreground">What the company sees</h2>
        <p className="mt-2 text-sm text-body">
          {company.companySharePreview.currentlyShared
            ?"Your submitted, shortlisted application is currently included in an active employer share."
            :"Your application is not currently visible through an active employer share. It must be shortlisted and included in a live, unrevoked share first."}
        </p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div><dt className="font-semibold">Application ID</dt><dd className="break-all">{company.companySharePreview.applicationId}</dd></div>
          <div><dt className="font-semibold">Learner</dt><dd>{company.companySharePreview.learnerName}</dd></div>
          <div><dt className="font-semibold">Email</dt><dd className="break-all">{company.companySharePreview.email??"No email recorded"}</dd></div>
        </dl>
        <p className="mt-4 rounded-[var(--lms-control-radius)] bg-surface-subtle p-3 text-xs text-body">
          This is the current selected-applicant share projection, not proof that a recruiter opened your record.
          Short-lived or revoked employer links cannot reveal your application. Phone numbers, private documents,
          attendance and other learners are not included.
        </p>
      </section>
      <section className="border-b border-border py-4 sm:py-6">
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
                <ThirdPartyLink href={company.websiteUrl} label="Visit employer website ↗" />
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
