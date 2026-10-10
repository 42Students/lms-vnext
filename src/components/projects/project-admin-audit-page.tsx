import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ActivityCenter,
  type ActivityCenterGroup,
} from "@/components/activity/activity-center";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  listActivityEvents,
} from "@/modules/activity/service";
import {
  ACTIVITY_IMPORTANCE,
} from "@/modules/activity/taxonomy";
import {
  isSuperAdmin,
} from "@/modules/identity/context";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

export async function ProjectAdminAuditPage({
  basePath,
  searchParams,
}: {
  basePath:
    | "/admin/projects"
    | "/college/projects";
  searchParams: SearchParams;
}) {
  const context =
    await getCurrentRequestContext();

  if (
    isSuperAdmin(context) &&
    !context.adminScope?.collegeId
  ) {
    return (
      <div className="space-y-6">
        <ProjectAdminNav
          basePath={basePath}
          active="audit"
        />
        <PageHeader
          eyebrow="Projects"
          title="Project audit"
          description="Who changed what, and when — scoped to the selected college."
        />
        <EmptyState
          title="Select a college to continue"
          description="Project audit is college-scoped. Choose a college in the Super Admin scope control before reviewing project activity."
        />
      </div>
    );
  }

  const eventType =
    one(searchParams.action) ??
    one(searchParams.status) ??
    one(searchParams.eventType);
  const importance =
    one(searchParams.importance);
  const subjectType =
    one(searchParams.subjectType);
  const from = one(searchParams.from);
  const to = one(searchParams.to);

  const result =
    await listActivityEvents(
      context,
      {
        module: "PROJECTS",
        importance:
          importance as
            | (typeof ACTIVITY_IMPORTANCE)[number]
            | undefined,
        eventType,
        subjectType,
        from,
        to,
        beforeOccurredAt:
          one(
            searchParams.beforeOccurredAt,
          ),
        beforeId:
          one(searchParams.beforeId),
        limit: 40,
      },
    );

  const groups: ActivityCenterGroup[] =
    result.groups.map((group) => ({
      key: group.key,
      count: group.count,
      latest: {
        event: {
          id: group.latest.event.id,
          module:
            group.latest.event.module,
          eventType:
            group.latest.event.eventType,
          importance:
            group.latest.event.importance,
          subjectType:
            group.latest.event.subjectType,
          subjectId:
            group.latest.event.subjectId,
          subjectLabel:
            group.latest.event.subjectLabel,
          summary:
            group.latest.event.summary,
          occurredAt:
            group.latest.event.occurredAt.toISOString(),
        },
        actor: group.latest.actor,
      },
      earliest: {
        event: {
          occurredAt:
            group.earliest.event.occurredAt.toISOString(),
        },
      },
    }));

  const nextParams =
    new URLSearchParams();
  if (eventType) {
    nextParams.set("action", eventType);
  }
  if (importance) {
    nextParams.set(
      "importance",
      importance,
    );
  }
  if (subjectType) {
    nextParams.set(
      "subjectType",
      subjectType,
    );
  }
  if (from) {
    nextParams.set("from", from);
  }
  if (to) {
    nextParams.set("to", to);
  }
  if (result.nextCursor) {
    nextParams.set(
      "beforeOccurredAt",
      result.nextCursor.beforeOccurredAt.toISOString(),
    );
    nextParams.set(
      "beforeId",
      result.nextCursor.beforeId,
    );
  }

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="audit"
      />
      <PageHeader
        eyebrow="Projects"
        title="Project audit"
        description="Who changed what, and when — project activity only, inside the current college scope."
      />

      <form
        className="grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 xl:grid-cols-5"
        action={basePath + "/audit"}
      >
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Action
          </span>
          <input
            className={inputClass}
            name="action"
            defaultValue={eventType}
            placeholder="projects.task.submitted"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Importance
          </span>
          <select
            className={inputClass}
            name="importance"
            defaultValue={importance ?? ""}
          >
            <option value="">
              All importance
            </option>
            {ACTIVITY_IMPORTANCE.map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Subject
          </span>
          <input
            className={inputClass}
            name="subjectType"
            defaultValue={subjectType}
            placeholder="project"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            From (IST)
          </span>
          <input
            className={inputClass}
            name="from"
            type="date"
            defaultValue={from}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            To (IST)
          </span>
          <input
            className={inputClass}
            name="to"
            type="date"
            defaultValue={to}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-5">
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Apply filters
          </button>
          <a
            href={basePath + "/audit"}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-foreground"
          >
            Reset
          </a>
        </div>
      </form>

      <ActivityCenter
        groups={groups}
        nextHref={
          result.nextCursor
            ? basePath +
              "/audit?" +
              nextParams.toString()
            : null
        }
      />

      <p className="text-xs leading-5 text-muted-foreground">
        This view reflects persisted vNext Project activity events. Legacy-only audit actions remain tracked as W03 parity work until their producers are implemented against the shared activity taxonomy.
      </p>
    </div>
  );
}
