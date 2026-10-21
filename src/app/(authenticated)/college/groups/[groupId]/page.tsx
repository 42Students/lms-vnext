import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
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
  return value ? new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value)+" IST" : "—";
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
  // Legacy student-group bookmarks never loaded a group. Preserve the
  // history-replacing People redirect instead of treating numeric IDs as UUIDs.
  if (process.env.COLLEGE_STUDY_GROUPS_RELEASED !== "true" ||
      !z.uuid().safeParse(groupId).success) redirect("/college/people");

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
    <div className="min-w-0 max-w-full space-y-[16px]">
      <PageHeader
        title={group.name}
        description={group.description ?? `${label(group.kind)} in ${detail.collegeName}`}
        actions={<PageBackLink href="/college/groups" label="All groups" />}
      />

      <section className="grid min-w-0 grid-cols-2 gap-[16px] border-b border-border pb-4 md:grid-cols-3 min-[992px]:grid-cols-5">
        <Stat title="Type" value={label(group.kind)} />
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <p className="mt-2">
            <StatusBadge tone={group.status === "ACTIVE" ? "success" : group.status === "CLOSED" ? "warning" : "neutral"}>
              {label(group.status)}
            </StatusBadge>
          </p>
        </div>
        <Stat
          title="Members"
          value={
            group.capacity === null
              ? group.activeCount
              : `${group.activeCount} / ${group.capacity}`
          }
        />
        <Stat title="Waitlisted" value={counts.waitlisted} />
        <Stat title="Requested" value={counts.requested} />
      </section>

      <p className="text-xs text-muted-foreground">
        Group ID: <code className="select-all break-all">{group.id}</code>
        {" · "}Stored active member count: {group.activeCount}. Member edits and count
        reconciliation are different operations; reconciliation requires a
        separately authorized support action and is not offered here.
      </p>

      {group.selfJoinOpenFrom || rule ? (
        <details className="min-w-0 border-b border-border pb-3">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Membership rule</summary>
          <section className="grid min-w-0 gap-[16px] pt-3 md:grid-cols-3">
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
        </details>
      ) : null}

      {rule ? (
        <section className="border-t border-border pt-4">
          <Link href={"/college/groups/" + encodeURIComponent(group.id) + "/rule-preview"}
            className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Preview persisted membership rule (read-only)
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Counts are a bounded eligibility preview, not automatic enrollment or a promised refresh result.
          </p>
        </section>
      ) : null}

      <section className="min-w-0 space-y-3 border-b border-border pb-4">
        <h2 className="m-0 text-base font-semibold leading-6 text-[var(--lms-heading)]">Members</h2>
        {members.length === 0 ? (
          <EmptyState title="No members yet" description="Nobody has joined this group." />
        ) : (
          <DataTable empty={<EmptyState title="No records to show" description="No records to show."/>}
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

      {group.kind === "STUDY_GROUP" ? <section className="min-w-0 space-y-3">
        <details className="min-w-0 border-b border-border pb-4">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-[var(--lms-heading)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Manage members</summary>
          <div className="min-w-0 space-y-3 pt-3">
        <Link href={"/college/groups/" + encodeURIComponent(group.id) + "/import-preview"}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Validate member CSV (dry run)
        </Link>
        <CollegeStudyMemberActions groupId={group.id} name={group.name}
          members={members} available={available} />
          </div>
        </details>
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

      <section className="min-w-0 space-y-3">
        <details className="min-w-0 border-b border-border pb-3">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-[var(--lms-heading)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Recent activity</summary>
        {events.length === 0 ? (
          <EmptyState title="No activity yet" description="Membership changes appear here." />
        ) : (
          <DataTable empty={<EmptyState title="No records to show" description="No records to show."/>}
            columns={[
              { key: "when", header: "When", cell: (row) => when(row.createdAt) },
              { key: "who", header: "Member", cell: (row) => row.displayName ?? "—" },
              {
                key: "change",
                header: "Change",
                cell: (row) => <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">{row.fromState ? label(row.fromState) : "New"}</span>
                  <span aria-hidden="true" className="text-muted-foreground">→</span>
                  <StatusBadge tone={STATE_TONE[row.toState as keyof typeof STATE_TONE] ?? "neutral"}>
                    {label(row.toState)}
                  </StatusBadge>
                </div>,
              },
              {
                key: "by",
                header: "By",
                cell: (row) => <span title={label(row.source)}>
                  {label(row.actorType)} <span className="text-muted-foreground">({label(row.source)})</span>
                </span>,
              },
              { key: "reason", header: "Reason", cell: (row) => row.reason ?? "—" },
            ]}
            rows={events}
            getRowKey={(row) => row.id}
          />
        )}
        </details>
      </section>
    </div>
  );
}
