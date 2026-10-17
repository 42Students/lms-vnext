import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterProfileAccess } from "@/components/hr/recruiter-profile-access";
import { RecruiterProfileDetailsEditor } from "@/components/hr/recruiter-profile-details-editor";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getRecruiterSelfProfile } from "@/modules/placements/recruiter-profile-service";
import { getRecruiterSelfGrantOverview } from "@/modules/placements/recruiter-self-grants-service";

export default async function HrProfilePage() {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context)) redirect("/dashboard");
  const profile = await getRecruiterSelfProfile(context);
  const overview = await getRecruiterSelfGrantOverview(context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Recruiter"
        title="Profile"
        description="Manage your recruiter details."
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Your details</h2>
        <p className="mt-2 text-sm text-body">These details identify you to the placement cell.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <RecruiterProfileDetailsEditor initialName={profile.displayName}
            initialTitle={profile.title} initialPhone={profile.contactPhoneDigits}
            contactReady={profile.contactReady} userUpdatedAt={profile.userUpdatedAt.toISOString()}
            profileUpdatedAt={profile.profileUpdatedAt.toISOString()} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Work email</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.email ?? "Not provided"}</dd>
            <p className="mt-1 text-xs text-muted-foreground">You sign in with this, so it can&apos;t be changed here. A different company means a new work email and a new account.</p>
          </div>

        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Edit your name, designation and optional mobile together, then choose Save changes. Your work email remains your sign-in identity.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Company</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.companyName}</dd>
            <p className="mt-1 text-xs text-muted-foreground">Your company comes from your work email. Ask 42 if its name or logo is wrong.</p>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active college access</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.grants.length}</dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="recruiter-account-status"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h2
          id="recruiter-account-status"
          className="text-base font-semibold text-foreground"
        >
          Recruiter account status
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profile status
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {overview.profileStatus === "ACTIVE"
                ? "Active"
                : overview.profileStatus}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Currently active college grants
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {overview.grants.length}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Status is checked against your current
          recruiter profile. Only your own active
          college grants are shown below.
        </p>
      </section>

      <section
        aria-labelledby="recruiter-current-grants"
        className="rounded-xl border border-border bg-surface"
      >
        <div className="border-b border-border px-5 py-4">
          <h2
            id="recruiter-current-grants"
            className="text-base font-semibold text-foreground"
          >
            College access
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            This is a read-only view of your active
            college grants and employer relationships.
            Granted dates use India Standard Time.
          </p>
        </div>

        {overview.grants.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No active college grants are available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[35rem] text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-foreground"
                  >
                    College
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-foreground"
                  >
                    Access status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-foreground"
                  >
                    Company relationship
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-foreground"
                  >
                    Granted on (IST)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-foreground">Access validity</th>
                </tr>
              </thead>
              <tbody>
                {overview.grants.map((grant) => (
                  <tr
                    key={grant.id}
                    className="border-t border-border"
                  >
                    <th
                      scope="row"
                      className="px-4 py-4 font-semibold text-foreground"
                    >
                      {grant.collegeName}
                    </th>
                    <td className="px-4 py-4 text-body">
                      {grant.grantStatus === "ACTIVE"
                        ? "Active"
                        : grant.grantStatus}
                    </td>
                    <td className="px-4 py-4 text-body">
                      {grant.relationshipStatus === "ACTIVE"
                        ? "Active"
                        : grant.relationshipStatus}
                    </td>
                    <td className="px-4 py-4 text-body">
                      <time dateTime={grant.grantedAtIso}>
                        {grant.grantedAtLabel}
                      </time>
                    </td>
                    <td className="px-4 py-4 text-body">
                      {grant.accessUntilIso
                        ? <><span>Access until </span><time dateTime={grant.accessUntilIso}>{grant.accessUntilLabel}</time>
                          <p className="mt-1 text-xs text-muted-foreground">The placement cell can extend it.</p></>
                        : "Access has no end date"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-border px-5 py-3 text-xs leading-5 text-muted-foreground">
          This table does not change or revoke access.
          Existing access-management functionality below
          is separate from this read-only overview.
        </p>
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
