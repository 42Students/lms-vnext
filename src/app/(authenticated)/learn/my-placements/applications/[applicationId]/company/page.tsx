import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
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
  let company:Awaited<ReturnType<typeof getOwnLearnerApplicationCompany>>;
  try {
    company = await getOwnLearnerApplicationCompany(context, applicationId);
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Company profile" />
      <ErrorState title="Could not load company profile"
        description="The company information for your application is temporarily unavailable."
        action={<Link href={"/learn/my-placements/applications/"+encodeURIComponent(applicationId)+"/company"}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry company profile</Link>} />
    </div>;
  }
  if (!company) notFound();

  return (
    <div className="min-w-0 max-w-full space-y-6">

      <nav aria-label="Application navigation" className="flex min-w-0 flex-wrap items-center gap-2">
        <Link href={"/learn/my-placements/applications?applicationId=" + encodeURIComponent(company.applicationId)}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">← Back to application</Link>
      </nav>
      <PageHeader title={company.companyName} description="Read-only company profile from your own placement application." />
      <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={company.companyStatus === "ACTIVE" ? "success" : "neutral"}>
            {company.companyStatus.replaceAll("_", " ")}
          </StatusBadge></div>
      <section aria-label="What the company sees" className="border-b border-border py-4 md:py-6">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">What the company sees</h2>
        <p className="mt-2 text-sm text-body">
          {company.companySharePreview.currentlyShared
            ?"Your submitted, shortlisted application is currently included in an active employer share."
            :"Your application is not currently visible through an active employer share. It must be shortlisted and included in a live, unrevoked share first."}
        </p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div><dt className="font-semibold">Application ID</dt><dd className="break-all">{company.companySharePreview.applicationId}</dd></div>
          <div className="min-w-0"><dt className="font-semibold">Learner</dt><dd className="break-words">{company.companySharePreview.learnerName}</dd></div>
          <div><dt className="font-semibold">Email</dt><dd className="break-all">{company.companySharePreview.email??"No email recorded"}</dd></div>
        </dl>
        <p className="mt-4 max-w-3xl border-l-2 border-border pl-3 text-xs leading-5 text-body">
          This is the current selected-applicant share projection, not proof that a recruiter opened your record.
          Short-lived or revoked employer links cannot reveal your application. Phone numbers, private documents,
          attendance and other learners are not included.
        </p>
      </section>
      <section className="border-b border-border py-4 md:py-6">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Company and drive</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-semibold text-muted-foreground">Employer</dt>
            <dd className="mt-1 break-words text-foreground">{company.companyName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Applied role</dt>
            <dd className="mt-1 break-words text-foreground">{company.roleTitle}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Placement drive</dt>
            <dd className="mt-1 break-words text-foreground">{company.driveTitle}</dd>
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
        <details className="mt-4 border-t border-border pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Employer access privacy details</summary>
          <Banner tone="info" className="mt-3">
          What the company sees here is limited to the verified public employer profile
          associated with your own application. This is not a live employer-access audit.
          Your private files, personal contacts and other learners&apos; applications
          are never included in this preview.
          </Banner>
        </details>
      </section>
    </div>
  );
}
