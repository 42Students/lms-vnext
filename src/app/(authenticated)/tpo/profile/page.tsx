import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { getOwnTpoProfile } from "@/modules/placements/tpo-self-profile-service";
import { formatTpoProfileRole } from "@/modules/placements/tpo-utility-model";

export const dynamic = "force-dynamic";

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        {label}
      </dt>
      <dd className="mt-2 break-words text-[14px] font-semibold leading-5 text-foreground">
        {value?.trim() || "Not provided"}
      </dd>
    </div>
  );
}

export default async function TpoProfilePage() {
  const context =
    await getCurrentRequestContext();

  // Pages and layouts can resolve independently.
  // The service also rechecks this authorization.
  if (!hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const profile = await getOwnTpoProfile(context);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="My profile"
        description="Your signed-in college membership and available faculty-backed profile information."
        actions={
          <Link
            href="/tpo/more"
            className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to More
          </Link>
        }
      />

      <section
        aria-label="Your TPO profile"
        className="border-t border-border pt-5 min-[768px]:pt-6"
      >
        <h2 className="text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          Account details
        </h2>

        <dl className="mt-5 grid gap-5 min-[768px]:grid-cols-2">
          <ProfileField
            label="Display name"
            value={profile.displayName}
          />
          <ProfileField
            label="College"
            value={profile.collegeName}
          />
          <ProfileField
            label="College code"
            value={profile.collegeCode}
          />
          <ProfileField
            label="Department"
            value={profile.departmentName}
          />

          <div>
            <dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Membership status
            </dt>
            <dd className="mt-2">
              <StatusBadge
                tone={
                  profile.membershipStatus === "ACTIVE"
                    ? "success"
                    : "warning"
                }
              >
                {profile.membershipStatus}
              </StatusBadge>
            </dd>
          </div>

          <div>
            <dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Roles in this college
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <StatusBadge
                  key={role}
                  tone="info"
                >
                  {formatTpoProfileRole(role)}
                </StatusBadge>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-sm leading-6 text-muted-foreground">
        This page is read-only. Department information
        appears only when your own membership has a
        faculty profile linked to a department in your
        college. Account and membership records are
        administered through your college.
      </p>
    </div>
  );
}
