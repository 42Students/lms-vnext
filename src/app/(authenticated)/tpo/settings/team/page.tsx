import { Disclosure } from "@/components/ui/disclosure";
import { TpoSettingsTeamManage, TpoSettingsTeamRemove } from "@/components/tpo/tpo-settings-team-manage";
import { listTpoTeamAssignableStaff } from "@/modules/placements/tpo-settings-team-actions-service";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
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
  const candidates = sources.teamAssignmentsAvailable
    ? await listTpoTeamAssignableStaff(context)
    : [];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Placement team"
        description="Manage faculty coordinators and review active TPO memberships and dated Drive Day student coordinators in your college."
        actions={
          <Link
            href="/tpo/settings/trusted"
            className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-[14px] font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            Trusted Companies
          </Link>
        }
      />
      <TpoSettingsNav active="team" compact />

      {!sources.teamAssignmentsAvailable ? (
        <Alert tone="warning">
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
        </Alert>
      ) : null}

      {!sources.studentAssignmentsAvailable ? (
        <Alert tone="warning">
          Drive Day student-coordinator assignments are unavailable
          in the registered database. No zero-assignment conclusion
          should be drawn from this source.
        </Alert>
      ) : null}

      <Disclosure title="Team totals" className="min-w-0" contentClassName="pt-3">
      <section aria-label="Placement team summary" className="grid min-w-0 grid-cols-1 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] min-[768px]:grid-cols-2 min-[992px]:grid-cols-5">
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
            className="min-w-0 border-b border-[var(--lms-canvas-border)] px-4 py-4 last:border-b-0 min-[768px]:odd:border-r min-[768px]:odd:border-r-[var(--lms-canvas-border)] min-[768px]:last:border-r-0 min-[992px]:border-b-0 min-[992px]:border-r min-[992px]:border-r-[var(--lms-canvas-border)] min-[992px]:last:border-r-0"
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
      </Disclosure>

      <TpoSettingsTeamManage candidates={candidates} activeIds={members.map(member=>member.membershipId)} available={sources.teamAssignmentsAvailable}/>

      <section className="border-t border-border">
        <div className="border-b border-border py-4">
          <h2 className="text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
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
          <EmptyState title="No matching active TPO or coordinator memberships were found in the available sources." />
        ) : (
          <DataTable
            rows={members}
            getRowKey={member=>member.membershipId}
            caption="Active team memberships"
            empty={<EmptyState title="No matching active TPO or coordinator memberships were found in the available sources."/>}
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
              {key:"manage",header:"Team access",cell:member=><TpoSettingsTeamRemove
                membershipId={member.membershipId} displayName={member.displayName}
                removable={sources.teamAssignmentsAvailable && (member.roles.includes("TPO_ADMIN") || member.roles.includes("FACULTY_COORDINATOR"))}
                isSelf={member.membershipId===context.membership.id}
                permanentRole={member.roles.includes("TPO") || member.roles.includes("COLLEGE_ADMIN")}/>},
              {key:"duties",header:"Student duties",mobilePriority:"secondary",cell:member=>
                member.studentDuties.length===0?<span className="text-muted-foreground">—</span>:
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-semibold text-body">
                    {member.studentDuties.length} recorded{" "}drive/date assignment
                    {member.studentDuties.length===1?"":"s"}
                  </p>
                  <Disclosure title="View duty dates" className="min-w-0" contentClassName="pt-2">
                  {member.studentDuties.map(duty=><p key={duty.jobId+":"+duty.onDate} className="text-xs text-body">
                    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(duty.jobId)}
                      className="font-semibold text-link underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                      {duty.jobTitle}
                    </Link>
                    {" · "}{dutyDate(duty.onDate)}
                  </p>)}
                  </Disclosure>
                </div>},
            ]}
          />
        )}
      </section>

      <Disclosure title="About placement team records" className="min-w-0" contentClassName="pt-2">
      <p className="text-xs leading-5 text-muted-foreground">
        Faculty coordinator assignments are scoped to your selected college.
        Changing an assignment does not change the permanent TPO or College Admin
        membership roles. Removing a team assignment cannot delete or hand over
        other work automatically. Review the confirmation before removing someone.
      </p>
      </Disclosure>
    </div>
  );
}
