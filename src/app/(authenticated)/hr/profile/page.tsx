import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterProfileAccess } from "@/components/hr/recruiter-profile-access";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getRecruiterSelfProfile } from "@/modules/placements/recruiter-profile-service";

export default async function HrProfilePage() {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context)) redirect("/dashboard");
  const profile = await getRecruiterSelfProfile(context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer Recruiter"
        title="Your Profile"
        description="Your recruiter identity, company and college access."
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Your Details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.displayName ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.email ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Designation</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.title ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mobile</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.phoneE164 ?? "Not provided"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Name, email and mobile currently come from your central identity record. Exact legacy First Name / Last Name editing remains blocked until the shared identity contract supports those fields.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Company</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.companyName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active college access</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.grants.length}</dd>
          </div>
        </dl>
      </section>

      <RecruiterProfileAccess
        grants={profile.grants.map((grant) => ({
          id: grant.id,
          collegeId: grant.collegeId,
          collegeName: grant.collegeName,
        }))}
      />
    </div>
  );
}
