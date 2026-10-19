import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  TPO_TEAM_ROLE_LABELS,
} from "@/modules/placements/tpo-settings-read-model";
import {
  getTpoPlacementTeam,
} from "@/modules/placements/tpo-settings-people-service";

function dutyDate(value: string) {
  // PostgreSQL DATE is rendered without constructing a client clock.
  const [year, month, day] = value.split("-");
  return year && month && day
    ? `${day}-${month}-${year}`
    : value;
}

export default async function TpoPlacementTeamPage() {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const data = await getTpoPlacementTeam(
    context,
    context.membership.collegeId,
  );

  const { members, summary, sources } = data;

  return (
    <div className="space-y-6">
      <TpoSettingsNav active="team" />
      <PageHeader
        eyebrow="TPO · Settings"
        title="Placement Team"
        description="A read-only directory of active TPO memberships, persisted faculty team assignments and dated Drive Day student coordinators in your college."
        actions={
          <Link
            href="/tpo/settings/trusted"
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link"
          >
            Trusted Companies
          </Link>
        }
      />

      {!sources.teamAssignmentsAvailable ? (
        <section
          role="status"
          className="border-t border-border pt-5"
        >
          <h2 className="font-semibold text-foreground">
            Faculty team assignments unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            The dedicated Placement Team assignment table is not
            registered in this database. TPO membership roles are
            still shown, but TPO Admin and Faculty Coordinator
            assignment counts cannot be verified. No faculty
            membership is assumed to be a coordinator merely
            because it has the Faculty role.
          </p>
        </section>
      ) : null}

      {!sources.studentAssignmentsAvailable ? (
        <section
          role="status"
          className="text-sm leading-6 text-body border-t border-border pt-5"
        >
          Drive Day student-coordinator assignments are unavailable
          in the registered database. No zero-assignment conclusion
          should be drawn from this source.
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Distinct active members", String(summary.total)],
          ["TPO memberships", String(summary.tpoMemberships)],
          [
            "TPO Admin assignments",
            sources.teamAssignmentsAvailable
              ? String(summary.tpoAdmins)
              : "Unavailable",
          ],
          [
            "Faculty Coordinators",
            sources.teamAssignmentsAvailable
              ? String(summary.facultyCoordinators)
              : "Unavailable",
          ],
          [
            "Student Coordinators",
            sources.studentAssignmentsAvailable
              ? String(summary.studentCoordinators)
              : "Unavailable",
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border-b border-border px-1 py-4"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="border-t border-border">
        <div className="border-b border-border py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Active team memberships
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Only active college memberships belonging to active
            platform users are displayed. Student coordinator
            entries refer to recorded assignments, not a separate
            permanent membership role.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="py-4 text-sm text-body">
            No matching active TPO or coordinator memberships were
            found in the available sources.
          </div>
        ) : (
          <DataTable
            rows={members}
            getRowKey={member=>member.membershipId}
            caption="Active team memberships"
            empty={<p>No matching active TPO or coordinator memberships were found in the available sources.</p>}
            columns={[
              {key:"member",header:"Member",mobilePriority:"primary",cell:member=>
                <span className="font-semibold text-foreground">{member.displayName}</span>},
              {key:"role",header:"Role / assignment",mobilePriority:"secondary",cell:member=>
                <div className="flex flex-wrap gap-2">{member.roles.map(role=>
                  <StatusBadge key={role} tone={role==="TPO_ADMIN"?"info":"neutral"}>
                    {TPO_TEAM_ROLE_LABELS[role]}
                  </StatusBadge>)}</div>},
              {key:"status",header:"Membership status",mobilePriority:"secondary",cell:member=>
                <StatusBadge tone="success">{member.status}</StatusBadge>},
              {key:"duties",header:"Student duties",mobilePriority:"secondary",cell:member=>
                member.studentDuties.length===0?<span className="text-muted-foreground">—</span>:
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-body">
                    {member.studentDuties.length} recorded{" "}drive/date assignment
                    {member.studentDuties.length===1?"":"s"}
                  </p>
                  {member.studentDuties.map(duty=><p key={duty.jobId+":"+duty.onDate} className="text-xs text-body">
                    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(duty.jobId)}
                      className="font-semibold text-link underline">
                      {duty.jobTitle}
                    </Link>
                    {" · "}{dutyDate(duty.onDate)}
                  </p>)}
                </div>},
            ]}
          />
        )}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        This page does not expose team-member email addresses or
        phone numbers. It does not assign, reassign or remove
        coordinators. The dedicated faculty-team source may
        require a registered migration before its assignments
        are available. Legacy role-management flows and browser
        parity remain unverified.
      </p>
    </div>
  );
}
