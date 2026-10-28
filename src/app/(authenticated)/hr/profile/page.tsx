import { DataTable } from "@/components/ui/data-table";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { z } from "zod";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterProfileAccess } from "@/components/hr/recruiter-profile-access";
import { RecruiterProfileDetailsEditor } from "@/components/hr/recruiter-profile-details-editor";
import { RecruiterPendingInvitations } from "@/components/hr/recruiter-pending-invitations";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getRecruiterSelfProfile } from "@/modules/placements/recruiter-profile-service";
import { getRecruiterSelfGrantOverview } from "@/modules/placements/recruiter-self-grants-service";

export default async function HrProfilePage({ searchParams }: {
  searchParams?: Promise<{ collegeId?: string | string[] }>;
}) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)
   return <div className="min-w-0 space-y-4"><PageHeader title="Your Profile"/>
    <ErrorState title="Recruiter profile access denied"
      description="Your signed-in account has no active recruiter identity. Choose an authorized workspace or sign in with your recruiter work email."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Choose workspace</Link>}/>
   </div>;
  const search = searchParams ? await searchParams : {};
  const grants = context.recruiter.grants;
  const requestedId = typeof search.collegeId === "string" ? search.collegeId : null;
  if (search.collegeId && (!requestedId ||
    !z.string().uuid().safeParse(requestedId).success ||
    !grants.some(grant => grant.collegeId === requestedId))) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Your Profile"/>
      <ErrorState title="College access unavailable"
        description="Choose an authorized college to view its recruiter grant."
        retryHref="/hr/profile" retryLabel="Choose college"/>
    </div>;
  }
  if (grants.length > 1 && !requestedId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Your Profile" description="Select a college to review the recruiter account and grant for that workspace."/>
    <NeedsDoingChips label="Authorized colleges:" items={grants.map(grant=>({
      key:grant.collegeId,label:grant.collegeName,
      href:"/hr/profile?collegeId="+encodeURIComponent(grant.collegeId),
    }))}/>
  </div>;
  const scopedCollegeId = requestedId ?? grants[0]?.collegeId;
  const retryHref = scopedCollegeId
    ? "/hr/profile?collegeId=" + encodeURIComponent(scopedCollegeId)
    : "/hr/profile";
  const [profileResult,overviewResult]=await Promise.allSettled([
    getRecruiterSelfProfile(context, scopedCollegeId),getRecruiterSelfGrantOverview(context),
  ]);
  if(profileResult.status==="rejected"||overviewResult.status==="rejected")
   return <div className="min-w-0 space-y-4"><PageHeader title="Your Profile"/>
    <ErrorState title="We couldn't load your profile"
      description="Your recruiter profile or college access could not be verified. No other account details have been substituted."
      action={<Link href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
   </div>;
  const profile=profileResult.value;
  const allOverview=overviewResult.value;
  const authorizedGrantIds = new Set(grants.filter(grant => !scopedCollegeId || grant.collegeId === scopedCollegeId).map(grant => grant.id));
  const overview={...allOverview,grants:allOverview.grants.filter(grant=>authorizedGrantIds.has(grant.id))};

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Your Profile"
        description="Manage your recruiter details and review your college access."
      />
      <RecruiterPendingInvitations invitations={allOverview.pendingInvites}
        total={allOverview.pendingTotal} hasMore={allOverview.pendingHasMore}/>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
       <div className="min-w-0">      <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-6">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Your details</h2>
        <p className="mt-2 text-sm text-body">These details identify you to the placement cell.</p>
        <details className="mt-2 min-w-0">
          <summary className="flex min-h-11 cursor-pointer items-center text-xs font-semibold text-primary-text min-[768px]:min-h-9">About these details</summary>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Only for the placement cell to call you. You never sign in with it.</p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">Edit your name, designation and optional mobile together, then choose Save changes. Your work email is how you sign in, so it can&apos;t be changed here.</p>
        </details>
        <div className="mt-3 max-w-3xl">
          <RecruiterProfileDetailsEditor key={context.user.id} initialName={profile.displayName}
            initialFirstName={profile.canonicalFirstName} initialLastName={profile.canonicalLastName}
            initialTitle={profile.title} initialPhone={profile.contactPhoneDigits}
            contactReady={profile.contactReady} userUpdatedAt={profile.userUpdatedAt.toISOString()}
            profileUpdatedAt={profile.profileUpdatedAt.toISOString()} />
        </div>
        <dl className="mt-4 max-w-3xl border-t border-border pt-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Work email</dt>
            <dd className="mt-1 break-all text-sm text-foreground">{profile.email ?? "—"}</dd>
            <p className="mt-1 max-w-2xl break-words text-xs leading-5 text-muted-foreground">Your work email is how you sign in, so it can&apos;t be changed here. A different company means a new work email and a new account.</p>
          </div>

        </dl>
      </section>
       </div>
       <aside aria-label="Recruiter account and college access" className="min-w-0 space-y-4">
         
      <section
        aria-labelledby="recruiter-current-grants"
        className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-6"
      >
        <div className="pb-2">
          <h2
            id="recruiter-current-grants"
            className="text-base font-semibold text-[var(--lms-heading)]"
          >
            College access
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            This is a read-only view of your active
            college grants and employer relationships.
            Granted dates use India Standard Time.
          </p>
        </div>

        <RecruiterProfileAccess
        key={context.user.id+":"+profile.grants.map(grant=>grant.id).join(",")}
        grants={profile.grants.map((grant) => ({
          id: grant.id,
          collegeId: grant.collegeId,
          collegeName: grant.collegeName,
        }))}
        hideHeading
      />
        <details className="min-w-0 border-t border-border pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Current college access</summary>
          <div className="min-w-0 overflow-x-auto pb-4 pt-3">
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
        </details>

        <p className="pt-3 text-xs leading-5 text-muted-foreground">
          This table does not change or revoke access.
          Existing access-management functionality below
          is separate from this read-only overview.
        </p>

      </section>
         
      <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-6">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Account</h2>
        <dl className="mt-4 grid min-w-0 gap-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">College</dt>
            <dd className="mt-1 text-sm text-foreground">{overview.grants.length===1?overview.grants[0]!.collegeName:"—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Company</dt>
            <dd className="mt-1 break-words text-sm text-foreground">{profile.companyName||"—"}</dd>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Your company comes from your work email. Ask your placement cell if its name or logo is wrong.</p>
          </div>
        </dl>
      </section>

         
      <section
        aria-labelledby="recruiter-account-status"
        className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-6"
      >
        <h2
          id="recruiter-account-status"
          className="text-base font-semibold text-[var(--lms-heading)]"
        >
          Recruiter account status
        </h2>
        <dl className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
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

       </aside>
      </div>
    </div>
  );
}
