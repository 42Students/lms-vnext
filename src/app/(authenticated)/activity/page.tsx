import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ActivityCenter,
  type ActivityCenterGroup,
} from "@/components/activity/activity-center";
import { PageHeader } from "@/components/ui/page-header";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import {
  listActivityEvents,
} from "@/modules/activity/service";
import {
  ACTIVITY_IMPORTANCE,
  ACTIVITY_MODULES,
} from "@/modules/activity/taxonomy";

type SearchParams = Promise<
  Record<
    string,
    string | string[] | undefined
  >
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

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const context =
    await getCurrentRequestContext();

  if (
    !isSuperAdmin(context) &&
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    )
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const moduleValue = one(
    params.module,
  );
  const importanceValue = one(
    params.importance,
  );
  const result =
    await listActivityEvents(
      context,
      {
        module: moduleValue as
          | (typeof ACTIVITY_MODULES)[number]
          | undefined,
        importance: importanceValue as
          | (typeof ACTIVITY_IMPORTANCE)[number]
          | undefined,
        actorUserId: one(
          params.actorUserId,
        ),
        eventType: one(
          params.eventType,
        ),
        subjectType: one(
          params.subjectType,
        ),
        from: one(params.from),
        to: one(params.to),
        beforeOccurredAt: one(
          params.beforeOccurredAt,
        ),
        beforeId: one(
          params.beforeId,
        ),
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
            group.latest.event
              .importance,
          subjectType:
            group.latest.event
              .subjectType,
          subjectId:
            group.latest.event
              .subjectId,
          subjectLabel:
            group.latest.event
              .subjectLabel,
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
  for (const name of [
    "module",
    "importance",
    "actorUserId",
    "eventType",
    "subjectType",
    "from",
    "to",
  ]) {
    const value = one(params[name]);
    if (value) {
      nextParams.set(name, value);
    }
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
      <PageHeader
        eyebrow="Operations"
        title="Activity Center"
        description="Meaningful college changes, grouped to reduce noise. Low-value request logs stay out of this workspace."
      />

      <form className="grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Module
          </span>
          <select
            className={inputClass}
            name="module"
            defaultValue={
              moduleValue ?? ""
            }
          >
            <option value="">
              All modules
            </option>
            {ACTIVITY_MODULES.map(
              (module) => (
                <option
                  key={module}
                  value={module}
                >
                  {module}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Importance
          </span>
          <select
            className={inputClass}
            name="importance"
            defaultValue={
              importanceValue ?? ""
            }
          >
            <option value="">
              All importance
            </option>
            {ACTIVITY_IMPORTANCE.map(
              (importance) => (
                <option
                  key={importance}
                  value={importance}
                >
                  {importance}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            From (IST)
          </span>
          <input
            className={inputClass}
            name="from"
            type="date"
            defaultValue={one(params.from)}
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
            defaultValue={one(params.to)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Event type
          </span>
          <input
            className={inputClass}
            name="eventType"
            defaultValue={one(
              params.eventType,
            )}
            placeholder="placements.offer.issued"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Subject type
          </span>
          <input
            className={inputClass}
            name="subjectType"
            defaultValue={one(
              params.subjectType,
            )}
            placeholder="placement_offer"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-body">
            Actor user ID
          </span>
          <input
            className={inputClass}
            name="actorUserId"
            defaultValue={one(
              params.actorUserId,
            )}
            placeholder="Optional UUID"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Apply filters
          </button>
          <a
            href="/activity"
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
            ? "/activity?" +
              nextParams.toString()
            : null
        }
      />
    </div>
  );
}
