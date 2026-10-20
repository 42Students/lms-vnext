import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
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
  if (!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id) redirect("/dashboard");
  const profile = await getRecruiterSelfProfile(context);
  const overview = await getRecruiterSelfGrantOverview(context);

  return (
    <div className="min-w-0 max-w-full space-y-[16px]">
      <PageHeader
        title="Profile"
        description="Manage your recruiter details."
      />

      <section className="border-b border-border pb-[16px]">
        <h2 className="text-base font-semibold text-foreground">Your details</h2>
        <p className="mt-2 text-sm text-body">These details identify you to the placement cell.</p>
        <dl className="mt-[16px] grid gap-[16px] md:grid-cols-2">
          <RecruiterProfileDetailsEditor key={context.user.id} initialName={profile.displayName}
            initialTitle={profile.title} initialPhone={profile.contactPhoneDigits}
            contactReady={profile.contactReady} userUpdatedAt={profile.userUpdatedAt.toISOString()}
            profileUpdatedAt={profile.profileUpdatedAt.toISOString()} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Work email</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.email ?? "Not provided"}</dd>
            <p className="mt-1 text-xs text-muted-foreground">You sign in with this, so it can&apos;t be changed here. A different company means a new work email and a new account.</p>
          </div>

        </dl>
        <p className="mt-2 text-xs text-muted-foreground">Only for the placement cell to call you. You never sign in with it.</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Edit your name, designation and optional mobile together, then choose Save changes. Your work email remains your sign-in identity.
        </p>
      </section>

      <section className="border-b border-border pb-[16px]">
        <h2 className="text-base font-semibold text-foreground">Account</h2>
        <dl className="mt-[16px] grid gap-[16px] md:grid-cols-2">
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
        className="border-b border-border pb-[16px]"
      >
        <h2
          id="recruiter-account-status"
          className="text-base font-semibold text-foreground"
        >
          Recruiter account status
        </h2>
        <dl className="mt-[16px] grid gap-[16px] md:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profile status
            </dt>
            <dd className="mt-1"><StatusBadge tone={overview.profileStatus==="ACTIVE"?"success":"warning"}>{overview.profileStatus==="ACTIVE"?"Active":overview.profileStatus}</StatusBadge></dd>
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
        className="border-b border-border pb-[16px]"
      >
        <div className="pb-4">
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

        <div className="pt-4">
          <DataTable
            caption="Current college access"
            rows={overview.grants}
            getRowKey={grant => grant.id}
            empty={<EmptyState title="No active grants" description="No active college grants are available."/>}
            columns={[
              { key:"college", header:"College", mobilePriority:"primary",
                cell:(grant)=>grant.collegeName },
              { key:"status", header:"Access status", mobilePriority:"secondary",
                cell:(grant)=><StatusBadge tone={grant.grantStatus==="ACTIVE"?"success":"warning"}>{grant.grantStatus==="ACTIVE"?"Active":grant.grantStatus}</StatusBadge> },
              { key:"relationship", header:"Company relationship", mobilePriority:"secondary",
                cell:(grant)=><StatusBadge tone={grant.relationshipStatus==="ACTIVE"?"success":"warning"}>{grant.relationshipStatus==="ACTIVE"?"Active":grant.relationshipStatus}</StatusBadge> },
              { key:"granted", header:"Granted on (IST)", mobilePriority:"secondary",
                cell:(grant)=><time dateTime={grant.grantedAtIso}>{grant.grantedAtLabel}</time> },
              { key:"validity", header:"Access validity", mobilePriority:"secondary",
                cell:(grant)=>grant.accessUntilIso
                  ? <><span>Access until </span><time dateTime={grant.accessUntilIso}>{grant.accessUntilLabel}</time>
                    <p className="mt-1 text-xs text-muted-foreground">The placement cell can extend it.</p></>
                  : "Access has no end date" },
            ]}
          />
        </div>

        <p className="border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
          This table does not change or revoke access.
          Existing access-management functionality below
          is separate from this read-only overview.
        </p>
      </section>

      <RecruiterProfileAccess
        key={context.user.id+":"+profile.grants.map(grant=>grant.id).join(",")}
        grants={profile.grants.map((grant) => ({
          id: grant.id,
          collegeId: grant.collegeId,
          collegeName: grant.collegeName,
        }))}
      />
    </div>
  );
}
