import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CollegeStudyMemberActions } from "@/components/groups/college-study-member-actions";
import { CollegeGroupDetailWrites } from "@/components/groups/college-group-detail-writes";
import { listCollegePeopleWithRuntime } from "@/modules/people/runtime";
import {
  GroupReadError,
  getCollegeGroupDetail,
} from "@/modules/groups/admin-read-service";

type Detail = Awaited<ReturnType<typeof getCollegeGroupDetail>>;

const STATE_TONE = {
  ACTIVE: "success",
  WAITLISTED: "warning",
  REQUESTED: "info",
  REMOVED: "neutral",
} as const;

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function when(value: Date | null) {
  return value ? value.toLocaleString("en-IN") : "—";
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div>
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default async function CollegeGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { groupId } = await params;

  let detail: Detail;
  try {
    detail = await getCollegeGroupDetail(context, groupId);
  } catch (error) {
    if (
      error instanceof GroupReadError ||
      (error instanceof Error && error.name === "ZodError")
    ) {
      notFound();
    }
    throw error;
  }

  const { group, counts, members, events, rule } = detail;
  const candidatePage = group.kind === "STUDY_GROUP" && context.membership
    ? await listCollegePeopleWithRuntime(context, {
      collegeId: context.membership.collegeId, limit: 100, offset: 0,
    }) : null;
  const available = candidatePage?.items.filter((person) =>
    person.membership.status === "ACTIVE" && person.membership.roles.includes("LEARNER"),
  ).map((person) => ({
    id: person.membership.id,
    label: person.user.displayName || person.user.email || person.membership.id,
  })) ?? [];

  return (
    <div className="min-w-0 overflow-x-clip space-y-6">
      <PageHeader
        eyebrow="Student groups"
        title={group.name}
        description={group.description ?? `${label(group.kind)} in ${detail.collegeName}`}
        actions={
          <Link
            href="/college/groups"
            className="inline-flex min-h-[var(--lms-control-height)] items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-link"
          >
            All groups
          </Link>
        }
      />

      <section className="grid gap-4 - sm:grid-cols-2 lg:grid-cols-5 border-t border-border pt-5">
        <Stat title="Type" value={label(group.kind)} />
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <p className="mt-2">
            <StatusBadge tone={group.status === "ACTIVE" ? "success" : "neutral"}>
              {label(group.status)}
            </StatusBadge>
          </p>
        </div>
        <Stat
          title="Members"
          value={
            group.capacity === null
              ? counts.active
              : `${counts.active} / ${group.capacity}`
          }
        />
        <Stat title="Waitlisted" value={counts.waitlisted} />
        <Stat title="Requested" value={counts.requested} />
      </section>

      {group.selfJoinOpenFrom || rule ? (
        <section className="grid gap-4 - sm:grid-cols-3 border-t border-border pt-5">
          <Stat
            title="Self-join window"
            value={
              group.selfJoinOpenFrom
                ? `${when(group.selfJoinOpenFrom)} → ${when(group.selfJoinOpenUntil)}`
                : "Closed"
            }
          />
          <Stat
            title="Membership rule"
            value={rule ? (rule.autoRefresh ? "Auto-refreshing" : "Manual refresh") : "None"}
          />
          <Stat
            title="Last rule run"
            value={
              rule?.lastRunAt
                ? `${when(rule.lastRunAt)} · ${rule.lastRunMatched ?? 0} matched`
                : "—"
            }
          />
        </section>
      ) : null}

      {rule ? (
        <section className="border-t border-border pt-4">
          <Link href={"/college/groups/" + encodeURIComponent(group.id) + "/rule-preview"}
            className="font-semibold text-link hover:underline">
            Preview persisted membership rule (read-only)
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Counts are a bounded eligibility preview, not automatic enrollment or a promised refresh result.
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Members</h2>
        {members.length === 0 ? (
          <EmptyState title="No members yet" description="Nobody has joined this group." />
        ) : (
          <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
            columns={[
              { key: "name", header: "Name", cell: (row) => row.displayName ?? "—" },
              { key: "type", header: "Role", cell: (row) => label(row.memberType) },
              {
                key: "state",
                header: "State",
                cell: (row) => (
                  <StatusBadge
                    tone={STATE_TONE[row.state as keyof typeof STATE_TONE] ?? "neutral"}
                  >
                    {label(row.state)}
                    {row.waitlistPosition ? ` #${row.waitlistPosition}` : ""}
                  </StatusBadge>
                ),
              },
              { key: "source", header: "Added by", cell: (row) => label(row.source) },
              { key: "locked", header: "Locked", cell: (row) => (row.isLocked ? "Yes" : "—") },
              { key: "joined", header: "Joined", cell: (row) => when(row.joinedAt) },
            ]}
            rows={members}
            getRowKey={(row) => row.membershipId}
          />
        )}
      </section>

      {group.kind === "STUDY_GROUP" ? <section className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Manage members</h2>
        <Link href={"/college/groups/" + encodeURIComponent(group.id) + "/import-preview"}
          className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
          Validate member CSV (dry run)
        </Link>
        <CollegeStudyMemberActions groupId={group.id} name={group.name}
          members={members} available={available} />
      </section> : null}

      {group.kind === "STUDY_GROUP" ? <CollegeGroupDetailWrites
        groupId={group.id} groupName={group.name} groupVersion={group.version}
        groupStatus={group.status} capacity={group.capacity} activeCount={group.activeCount}
        waitlisted={members.filter(m=>m.state==="WAITLISTED").map(m=>({
          membershipId:m.membershipId,displayName:m.displayName,
          version:m.version,isLocked:m.isLocked,waitlistPosition:m.waitlistPosition,
        }))}
        initialRule={JSON.stringify(rule?.criteriaJson??{
          allowedProgramIds:[],allowedCohortIds:[],minCgpa:null,
          maxActiveBacklogs:null,allowedPassingYears:[],
        },null,2)}
        initialAutoRefresh={rule?.autoRefresh??false}
      /> : null}

      <section className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Recent activity</h2>
        {events.length === 0 ? (
          <EmptyState title="No activity yet" description="Membership changes appear here." />
        ) : (
          <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
            columns={[
              { key: "when", header: "When", cell: (row) => when(row.createdAt) },
              { key: "who", header: "Member", cell: (row) => row.displayName ?? "—" },
              {
                key: "change",
                header: "Change",
                cell: (row) =>
                  `${row.fromState ? label(row.fromState) : "New"} → ${label(row.toState)}`,
              },
              {
                key: "by",
                header: "By",
                cell: (row) => `${label(row.actorType)} (${label(row.source)})`,
              },
              { key: "reason", header: "Reason", cell: (row) => row.reason ?? "—" },
            ]}
            rows={events}
            getRowKey={(row) => row.id}
          />
        )}
      </section>
    </div>
  );
}
