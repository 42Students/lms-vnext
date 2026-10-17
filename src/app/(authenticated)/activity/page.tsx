import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ActivityCenter,
  type ActivityCenterGroup,
} from "@/components/activity/activity-center";
import { PageHeader } from "@/components/ui/page-header";
import {sanitizeActivityMetadata} from "@/modules/activity/metadata-sanitizer";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import {
  listActivityEvents,
} from "@/modules/activity/service";
import { listColleges } from "@/modules/colleges/service";
import {
  ACTIVITY_IMPORTANCE,
  ACTIVITY_MODULES,
} from "@/modules/activity/taxonomy";


/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

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
  const collegeOptions = isSuperAdmin(context) ? await listColleges(context) : [];
  const istDay=(date:Date)=>new Intl.DateTimeFormat("en-CA",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(date);
  const today=istDay(new Date());
  const ago=(days:number)=>istDay(new Date(currentTimeMs()-days*86400000));
  const range=one(params.range);
  const defaultFrom=!one(params.from)&&!one(params.to)&&range!=="ALL"?ago(29):one(params.from);
  const quick=(from?:string,to?:string,module?:string,importance?:string)=>{
   const q=new URLSearchParams({
    ...(from?{from}:{}),...(to?{to}:{}),
    ...(!from&&!to?{range:"ALL"}:{}),
    ...(module?{module}:{}),...(importance?{importance}:{}),
    ...(one(params.collegeId)?{collegeId:one(params.collegeId)!}:{}),
   });
   return "/activity?"+q.toString();
  };
  const presetLinks=[
   {name:"Important",href:quick(defaultFrom,one(params.to),"","HIGH")},
   {name:"Academic setup",href:quick(defaultFrom,one(params.to),"ACADEMICS")},
   {name:"People & access",href:quick(defaultFrom,one(params.to),"IDENTITY")},
   {name:"Teaching",href:quick(defaultFrom,one(params.to),"COURSES")},
   {name:"Projects",href:quick(defaultFrom,one(params.to),"PROJECTS")},
   {name:"Everything",href:quick(defaultFrom,one(params.to))},
  ];
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
        collegeId: one(params.collegeId),
        actorUserId: one(
          params.actorUserId,
        ),
        eventType: one(
          params.eventType,
        ),
        subjectType: one(
          params.subjectType,
        ),
        subjectId: one(params.subjectId),
        actorName: isSuperAdmin(context) ? one(params.actorName)?.trim() || undefined : undefined,
        q: isSuperAdmin(context) ? one(params.q)?.trim() || undefined : undefined,
        from: defaultFrom,
        to: one(params.to),
        beforeOccurredAt: one(
          params.beforeOccurredAt,
        ),
        beforeId: one(
          params.beforeId,
        ),
        limit: 50,
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
          metadata:sanitizeActivityMetadata(group.latest.event.metadata),
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
    "subjectId",
    "actorName",
    "q",
    "collegeId",
    "from",
    "to",
  ]) {
    const value = one(params[name]);
    if (value) {
      if ((name === "actorName" || name === "q") && !isSuperAdmin(context)) continue;
      nextParams.set(name, value);
    }
  }
  if(defaultFrom)nextParams.set("from",defaultFrom);
  // Export starts from the newest matching activity, without an older-page cursor.
  const exportParams = new URLSearchParams(nextParams);
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
        title="Activity Log"
        description="Meaningful college changes, grouped to reduce noise. Low-value request logs stay out of this workspace."
        actions={isSuperAdmin(context) || hasMembershipRole(context, "COLLEGE_ADMIN") ? (
          <a href={(isSuperAdmin(context) ? "/api/activity/admin-export" : "/api/activity/college-export") +
            (exportParams.size ? "?" + exportParams.toString() : "")}
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
            Export
          </a>
        ) : undefined}
      />

      {isSuperAdmin(context)?<p role="status" aria-label="Activity scope"
        className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-body">
        {one(params.collegeId)? "College: "+(collegeOptions.find(college=>college.id===one(params.collegeId))?.name??"Selected college")
         :context.adminScope?.collegeId?"Activity restricted to the selected college."
         :context.adminScope?.organizationId?"Organization-wide activity."
         :"Platform-wide activity."}
      </p>:null}
      {isSuperAdmin(context) ? <Link href="/tracker/audit-findings"
        className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
        Open audit findings board →
      </Link> : null}
      {isSuperAdmin(context)?<nav aria-label="Activity Log category presets" className="space-y-2">
       <div className="flex flex-wrap gap-2">{presetLinks.map(link=><Link key={link.name} href={link.href}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">{link.name}</Link>)}</div>
       <p className="text-xs text-muted-foreground">Choose a preset, then narrow by college, actor or dates. Important activity shows high-priority events.</p>
       <div className="flex flex-wrap gap-2">{[
        {label:"Today",href:quick(today,today)},
        {label:"7 days",href:quick(ago(6),today)},
        {label:"30 days",href:quick(ago(29),today)},
        {label:"All time",href:quick()},
       ].map(link=><Link key={link.label} href={link.href}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-primary-text">{link.label}</Link>)}</div>
      </nav>:null}
      <form className="grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 xl:grid-cols-4">
        {isSuperAdmin(context) ? (
          <label>
            <span className="mb-1 block text-xs font-semibold text-body">College</span>
            <select name="collegeId" defaultValue={one(params.collegeId) ?? ""} className={inputClass}>
              <option value="">Current admin safety scope</option>
              {collegeOptions.map(college => <option key={college.id} value={college.id}>
                {college.name} ({college.code})
              </option>)}
            </select>
          </label>
        ) : null}
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
            defaultValue={defaultFrom}
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
          <span className="mb-1 block text-xs font-semibold text-body">Subject / entity ID</span>
          <input className={inputClass} name="subjectId" maxLength={500}
            defaultValue={one(params.subjectId)} placeholder="Exact entity ID" />
        </label>
        {isSuperAdmin(context) ? <>
          <label><span className="mb-1 block text-xs font-semibold text-body">Actor name</span>
            <input type="search" className={inputClass} name="actorName" maxLength={100}
              defaultValue={one(params.actorName)} placeholder="Name contains…" /></label>
          <label><span className="mb-1 block text-xs font-semibold text-body">Event / entity search</span>
            <input type="search" className={inputClass} name="q" maxLength={100}
              defaultValue={one(params.q)} placeholder="Summary, event or entity contains…" /></label>
        </> : null}
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
          <Link
            href="/activity"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-foreground"
          >
            Reset
          </Link>
        </div>
      </form>

      <ActivityCenter
        nextRemaining={result.remainingCount}
        groups={groups}
        todayKey={today}
        yesterdayKey={ago(1)}
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
