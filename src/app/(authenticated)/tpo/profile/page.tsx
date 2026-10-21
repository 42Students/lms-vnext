import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { TpoProfileRefresh } from "@/components/placements/tpo-profile-refresh";
import { hasMembershipRole } from "@/modules/identity/context";
import { getOwnTpoProfile } from "@/modules/placements/tpo-self-profile-service";
import { formatTpoProfileRole } from "@/modules/placements/tpo-utility-model";

export const dynamic = "force-dynamic";

function ProfileField({label,value,empty="Not set"}:{
  label:string;value:string|null|undefined;empty?:string;
}) {
  return <div className="grid min-w-0 grid-cols-1 gap-2 border-b border-[#edf0f0] py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
    <dt className="text-[13px] font-medium text-[var(--lms-neutral-400)]">{label}</dt>
    <dd className="m-0 break-words text-sm font-medium leading-5 text-[var(--lms-heading)]">{value?.trim()||<span className="font-normal text-muted-foreground">{empty}</span>}</dd>
  </div>;
}

export default async function TpoProfilePage() {
  const context = await getCurrentRequestContext();
  // Legacy TPO-only view; the membership-scoped service independently checks
  // live authorization and cannot reveal another college's staff details.
  if (!hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const profile = await getOwnTpoProfile(context);
  const displayName = profile.displayName?.trim() || "";
  const initials = displayName.split(/\s+/).slice(0,2).map(part=>part.charAt(0).toUpperCase()).join("") || "T";

  return <div className="min-w-0 space-y-6" aria-label="Profile overview">
    <PageHeader title="Profile"
      description="How students and recruiters see you in the placement workspace"
      actions={<Link href="/tpo/more"
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
        Back to More
      </Link>} />

    <div className="max-w-[860px] space-y-4">
      <TpoProfileRefresh />

      <section data-testid="tpo.profile.card" aria-labelledby="tpo-profile-card-heading"
        className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface">
        <div className="flex min-w-0 flex-col gap-4 border-b border-[var(--lms-canvas-border)] px-4 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-[#d2e7e7] bg-[#e9f6f5] text-[34px] font-semibold text-[#1a6872]"
            role="img" aria-label={displayName ? displayName + "'s profile photo is unavailable" : "Profile photo is unavailable"}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-[var(--lms-heading)]">{displayName || "-"}</p>
            <p className="mt-1 text-sm text-[var(--lms-body-text)]">Placement officer</p>
            <p className="mt-2 text-xs text-muted-foreground">Profile photos require a verified storage upload. Unverified image links are not accepted.</p>
          </div>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <h2 id="tpo-profile-card-heading" className="text-lg font-semibold leading-6 text-[var(--lms-heading)]">
            How students and recruiters see you
          </h2>
          <dl className="mt-4 min-w-0">
            <ProfileField label="Name" value={profile.displayName} empty="-" />
            <ProfileField label="Role" value="Placement officer" />
            <ProfileField label="Department" value={profile.departmentName} />
            <ProfileField label="Phone" value={profile.phone} />
            <ProfileField label="Email" value={profile.email} />
          </dl>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your phone and email are how you log in, so your college admin changes them.
          </p>
        </div>
      </section>

      <details className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 sm:p-6">
        <summary className="min-h-11 cursor-pointer font-semibold leading-10 text-[var(--lms-heading)]">
          College membership details
        </summary>
        <dl className="mt-3 min-w-0">
          <ProfileField label="College" value={profile.collegeName} />
          <ProfileField label="College code" value={profile.collegeCode} />
          <div className="grid grid-cols-1 gap-2 border-b border-[#edf0f0] py-3 sm:grid-cols-[160px_minmax(0,1fr)]">
            <dt className="text-[13px] font-medium text-[var(--lms-neutral-400)]">Membership status</dt>
            <dd className="m-0"><StatusBadge tone={profile.membershipStatus === "ACTIVE" ? "success" : "warning"}>{profile.membershipStatus}</StatusBadge></dd>
          </div>
          <div className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[160px_minmax(0,1fr)]">
            <dt className="text-[13px] font-medium text-[var(--lms-neutral-400)]">Roles in this college</dt>
            <dd className="m-0 flex flex-wrap gap-2">{profile.roles.map(role=>
              <Badge key={role} tone="neutral">{formatTpoProfileRole(role)}</Badge>)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Your department appears only when your current college membership has a faculty department record.
          Account and membership records are managed by your college.
        </p>
      </details>
    </div>
  </div>;
}
