import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessStaffActivity } from "@/modules/identity/role-portal-policy";
import {
  ActivityCenter,
  type ActivityCenterGroup,
  RAW_AUDIT_FORENSIC_HEADERS,
  RAW_AUDIT_MISSING_TRANSPORT,
} from "@/components/activity/activity-center";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {sanitizeActivityMetadata} from "@/modules/activity/metadata-sanitizer";
import { activityQuickHref } from "@/modules/activity/ux-query";
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
import { Table } from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { istIsoDateFormatter, istDateTimeFormatter } from "@/lib/format-date";


import { ROLE } from "@/modules/identity/roles";
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

const inputClass = "w-full min-w-0";

/** Export only authorized displayed rows and neutralize spreadsheet formulas. */
function activityPageCsvCell(input: string | null | undefined) {
  const value = input ?? "";
  const safe = /^\s*[=+@-]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const context =
    await getCurrentRequestContext();

  if (!canAccessStaffActivity(context)) {
    redirect("/dashboard");
  }

  const rawParams = await searchParams;
  // Migration crosswalk for the legacy raw audit query parameters
  // (SuperAdminAuditService.searchAuditLogs): actionKey -> eventType,
  // entityType/type -> subjectType, entityId -> subjectId, since/until -> from/to.
  // Current names always win; legacy names only fill gaps. Legacy datetimes
  // (YYYY-MM-DDTHH:mm:ss) are reduced to the date part used by the date filters.
  const legacyAlias: Record<string, string> = {
    actionKey: "eventType", entityType: "subjectType", type: "subjectType",
    entityId: "subjectId", since: "from", until: "to",
  };
  const params: Record<string, string | string[] | undefined> = { ...rawParams };
  for (const [legacyName, currentName] of Object.entries(legacyAlias)) {
    const legacyValue = one(rawParams[legacyName]);
    if (legacyValue && !one(params[currentName])) {
      params[currentName] = currentName === "from" || currentName === "to"
        ? legacyValue.slice(0, 10) : legacyValue;
    }
  }
  const moduleValue = one(
    params["module"],
  );
  const importanceValue = one(
    params["importance"],
  );
  const preset = one(params["view"]);
  const presetNames = ["important","setup","people","teaching","projects","all"] as const;
  type PresetName = typeof presetNames[number];
  const validPreset = presetNames.find(name=>name===preset);
  const explicitFilter = Boolean(moduleValue || importanceValue ||
    one(params["eventType"]) || one(params["subjectType"]) ||
    one(params["subjectId"]) || one(params["actorUserId"]) ||
    one(params["actorName"]) || one(params["q"]));
  const selectedPreset:PresetName = validPreset ??
    (explicitFilter ? "all" : "important");
  // The Important tab is an OR over HIGH + CRITICAL, not HIGH alone.
  const importantOnly = selectedPreset==="important" && !importanceValue;
  // The old categories span subjects and event types across several modules.
  // Restricting them to one module silently hid valid academic/people events.
  // The activity service applies the legacy event taxonomy in scoped SQL
  // before counts, cursor pagination and grouping.
  const effectiveModule=moduleValue;
  const selectedCollegeId=isSuperAdmin(context)?context.adminScope?.collegeId??null:null;
  const selectedOrganizationId=isSuperAdmin(context)?context.adminScope?.organizationId??null:null;
  // A college-filter directory failure is recoverable: it must not turn a
  // successfully scoped activity read into a route-level 500 error.
  let collegeOptions: Awaited<ReturnType<typeof listColleges>> = [];
  let collegeOptionsFailed = false;
  if (isSuperAdmin(context) && !selectedCollegeId) {
    try {
      collegeOptions = (await listColleges(context)).filter(college=>
        !selectedOrganizationId || college.organizationId===selectedOrganizationId);
    } catch {
      collegeOptionsFailed = true;
    }
  }
  const istDay=(date:Date)=>istIsoDateFormatter.format(date);
  const today=istDay(new Date());
  const ago=(days:number)=>istDay(new Date(currentTimeMs()-days*86400000));
  const range=one(params["range"]);
  const rawMode=one(params["mode"])==="raw" && isSuperAdmin(context);
  const rawSize=one(params["size"]);
  const pageSize=rawMode && (rawSize==="50"||rawSize==="100")?Number(rawSize):25;
  // Raw forensic lookups default to all-time, as in legacy Audit Logs.
  // The Important activity feed still defaults to the last 30 IST days.
  const forensicLookup=selectedPreset==="all" && Boolean(
    one(params["actorUserId"])||one(params["actorName"])||one(params["eventType"])||
    one(params["subjectType"])||one(params["subjectId"])||one(params["q"]));
  const selectedRange=range==="today"||range==="7d"||range==="30d"?range:
    range==="ALL"?"all":one(params["from"])||one(params["to"])?"custom":
    forensicLookup?"all":"30d";
  const defaultFrom=one(params["from"])??(!one(params["to"])&&!forensicLookup?
    range==="ALL"?undefined:
    range==="today"?today:range==="7d"?ago(6):ago(29):undefined);
  const requestedCollegeId = one(params["collegeId"]);
  const quick=(from?:string,to?:string,view:PresetName=selectedPreset,
    rangeKey:string|undefined=range)=>activityQuickHref({
      params, view, from, to, range:rangeKey, rawMode,
      superAdmin:isSuperAdmin(context), pinnedCollegeId:selectedCollegeId,
    });
  // Keep the default rolling window highlighted after switching categories;
  // explicit date inputs remain a custom range until a preset is chosen.
  const categoryRange = range ?? (!one(params["from"]) && !one(params["to"]) && !forensicLookup ? "30d" : undefined);
  const presetLinks=[
   {id:"important" as const,name:"Important",href:quick(defaultFrom,one(params["to"]),"important",categoryRange)},
   {id:"setup" as const,name:"Academic setup",href:quick(defaultFrom,one(params["to"]),"setup",categoryRange)},
   {id:"people" as const,name:"People & access",href:quick(defaultFrom,one(params["to"]),"people",categoryRange)},
   {id:"teaching" as const,name:"Teaching",href:quick(defaultFrom,one(params["to"]),"teaching",categoryRange)},
   {id:"projects" as const,name:"Projects",href:quick(defaultFrom,one(params["to"]),"projects",categoryRange)},
   {id:"all" as const,name:"Everything",href:quick(defaultFrom,one(params["to"]),"all",categoryRange)},
  ];
  const resetQuery = new URLSearchParams({view:"important"});
  if (rawMode) resetQuery.set("mode","raw");
  if (requestedCollegeId && !selectedCollegeId && isSuperAdmin(context)) {
    resetQuery.set("collegeId",requestedCollegeId);
  }
  const resetHref = "/activity?" + resetQuery.toString();
  const retryQuery=new URLSearchParams();
  for(const [key,value] of Object.entries(params)){
    if(typeof value==="string" && value.length<=500)retryQuery.set(key,value);
  }
  const retryHref="/activity"+(retryQuery.size?"?"+retryQuery.toString():"");
  let result: Awaited<ReturnType<typeof listActivityEvents>>;
  try {
    result = await listActivityEvents(
      context,
      {
        module: effectiveModule as
          | (typeof ACTIVITY_MODULES)[number]
          | undefined,
        importance: importanceValue as
          | (typeof ACTIVITY_IMPORTANCE)[number]
          | undefined,
        importantOnly,
        legacyCategory:selectedPreset==="all"?undefined:selectedPreset,
        collegeId: selectedCollegeId??one(params["collegeId"]),
        organizationId: selectedCollegeId?undefined:selectedOrganizationId??undefined,
        actorUserId: one(params["actorUserId"]),
        eventType: one(params["eventType"]),
        subjectType: one(params["subjectType"]),
        subjectId: one(params["subjectId"]),
        actorName: isSuperAdmin(context) ? one(params["actorName"])?.trim() || undefined : undefined,
        q: isSuperAdmin(context) ? one(params["q"])?.trim() || undefined : undefined,
        from: defaultFrom,
        to: one(params["to"]),
        beforeOccurredAt: one(params["beforeOccurredAt"]),
        beforeId: one(params["beforeId"]),
        limit: pageSize,
      },
    );
  } catch {
    // Do not show an empty-event state for an unsuccessful service fetch.
    // The same query/scope is kept intact for a deliberate retry.
    return <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Activity Log" />
      <ErrorState title="Couldn't load activity."
        description="Your filters have been preserved. Please try again."
        action={<TextLink href={retryHref}
          className="inline-flex min-h-11 items-center md:min-h-9">
          Retry
        </TextLink>} />
    </div>;
  }

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
    "view",
    "module",
    "importance",
    "actorUserId",
    "eventType",
    "subjectType",
    "subjectId",
    "actorName",
    "q",
    "mode",
    "size",
    "collegeId",
    "from",
    "to",
  ]) {
    const value = name==="view"?selectedPreset:one(params[name]);
    if (value) {
      if ((name === "actorName" || name === "q") && !isSuperAdmin(context)) continue;
      nextParams.set(name, value);
    }
  }
  if(defaultFrom)nextParams.set("from",defaultFrom);
  if(selectedCollegeId)nextParams.delete("collegeId");
  // Export starts from the newest matching activity, without an older-page cursor.
  const exportParams = new URLSearchParams(nextParams);
  // The current CSV export API has no HIGH-or-CRITICAL category contract.
  // Never mislabel a broader "everything" export as an Important-only export.
  exportParams.delete("view");
  exportParams.delete("mode");
  exportParams.delete("size");
  if(effectiveModule && !moduleValue)exportParams.set("module",effectiveModule);
  // An explicit all-time list must stay all-time when the user loads older events.
  // Keep this UI-only flag out of the strict CSV export query contract.
  if (range === "ALL" && !defaultFrom && !one(params["to"])) nextParams.set("range", "ALL");
  // Unlike the all-matching export endpoint, this matches the legacy Audit
  // Logs page export exactly: only the currently loaded, authorized rows.
  const pageCsv = [
    RAW_AUDIT_FORENSIC_HEADERS.map(value => activityPageCsvCell(value)).join(","),
    ...result.items.map(({event, actor}) => [
      istDateTimeFormatter.format(event.occurredAt),
      event.eventType,
      event.subjectType + " · " + (event.subjectLabel ?? event.subjectId),
      event.organizationId ?? "—",
      event.collegeId ?? "—",
      actor?.displayName ?? actor?.email ?? "System",
      RAW_AUDIT_MISSING_TRANSPORT,
      RAW_AUDIT_MISSING_TRANSPORT,
    ].map(activityPageCsvCell).join(",")),
  ].join("\r\n");
  const pageCsvHref = "data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + pageCsv);

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
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Activity Log"
        description="Meaningful college changes, grouped to reduce noise. Low-value request logs stay out of this workspace."
        actions={isSuperAdmin(context) || hasMembershipRole(context, ROLE.COLLEGE_ADMIN) ? (
          <div className="flex w-full min-w-0 flex-col items-stretch gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
          {result.items.length===0?<span aria-disabled="true" className="inline-flex min-h-11 items-center text-sm text-muted-foreground md:min-h-9">
            Export unavailable (no matching activity)
          </span>:<>
            <TextLink href={pageCsvHref} download="activity-current-page.csv"
              className="inline-flex min-h-11 w-full items-center justify-center px-2 text-sm md:w-auto md:min-h-9">
              Export current page (8 columns)
            </TextLink>
            {importantOnly ? <span className="flex min-h-11 items-center text-xs text-muted-foreground md:min-h-9">
              All-matching Important-only export requires the category-aware export API.
            </span> : <TextLink href={(isSuperAdmin(context) ? "/api/activity/admin-export" : "/api/activity/college-export") +
              (exportParams.size ? "?" + exportParams.toString() : "")}
              className="inline-flex min-h-11 w-full items-center justify-center px-2 text-sm md:w-auto md:min-h-9">
              Export all matching CSV
            </TextLink>}
          </>}
          <TextLink href={retryHref}
            className="inline-flex min-h-11 w-full items-center justify-center px-2 text-sm md:min-h-9 md:w-auto">
            Refresh
          </TextLink>
          {isSuperAdmin(context) ? <TextLink href="/tracker/audit-findings"
            className="inline-flex min-h-11 w-full items-center justify-center px-2 text-sm md:min-h-9">
            Open audit findings board →
          </TextLink> : null}
          </div>
        ) : undefined}
      />

      {isSuperAdmin(context)?<section role="status" aria-label="Activity scope"
        className="flex min-w-0 gap-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] p-3 text-sm text-body">
        <span aria-hidden="true" className="shrink-0 font-bold text-primary-text">ⓘ</span>
        <div className="space-y-1">
          <p className="font-semibold">{selectedCollegeId||one(params["collegeId"])?"Showing this college":
            selectedOrganizationId?"Showing this organization":"Platform-wide activity"}</p>
          <p>{selectedCollegeId||one(params["collegeId"])?
            "Activity is pinned to the selected college. Change the header scope to inspect another college, or clear it for platform-wide activity.":
            selectedOrganizationId?
            "Activity is pinned to the selected organization. Choose a college for a narrower operational view, or clear scope for platform-wide activity.":
            "Important changes across all organizations and colleges are shown first. Use the header scope when you need to investigate one tenant."}</p>
        </div>
      </section>:null}
      {collegeOptionsFailed ? (
        <div role="status" className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-sm text-body">
          <span>College filter options could not load. Your activity results are still scoped to the current administrator access.</span>
          <TextLink href={retryHref} className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>
        </div>
      ) : null}
      {isSuperAdmin(context)?<nav aria-label="Activity Log filters" className="space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
          <div role="group" aria-label="Activity category" className="inline-flex max-w-full flex-wrap gap-1 rounded-[var(--lms-control-radius)] bg-muted p-1">
            {presetLinks.map(link=><TextLink variant="bare" key={link.id} href={link.href}
              aria-current={selectedPreset===link.id?"page":undefined}
              className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-xs font-semibold focus-ring md:min-h-9 "+
                (selectedPreset===link.id?"bg-surface text-primary-text shadow-sm":"text-body hover:bg-surface")}>
              {link.name}</TextLink>)}
          </div>
          <div role="group" aria-label="Activity date range" className="inline-flex flex-wrap gap-1 rounded-[var(--lms-control-radius)] bg-muted p-1">
            {([
              {key:"today",label:"Today",href:quick(today,today,selectedPreset,"today")},
              {key:"7d",label:"7 days",href:quick(ago(6),today,selectedPreset,"7d")},
              {key:"30d",label:"30 days",href:quick(ago(29),today,selectedPreset,"30d")},
              {key:"all",label:"All time",href:quick(undefined,undefined,selectedPreset,"ALL")},
            ] as const).map(item=><TextLink variant="bare" key={item.key} href={item.href}
              aria-current={selectedRange===item.key?"page":undefined}
              className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-xs font-semibold focus-ring md:min-h-9 "+
                (selectedRange===item.key?"bg-surface text-primary-text shadow-sm":"text-body hover:bg-surface")}>{item.label}</TextLink>)}
          </div>
          <TextLink href={retryHref} className="inline-flex min-h-11 items-center md:min-h-9">Refresh</TextLink>
          <span role="status" className="text-xs tabular-nums text-muted-foreground">{result.items.length} raw events loaded{result.nextCursor ? ` · ${result.remainingCount} older` : ""}</span>
        </div>
        {selectedPreset==="important"?<p className="text-xs text-muted-foreground">Deletions and restores, promotions, suspensions, impersonation, module access and feature changes, and identity views.</p>:null}
        <div role="group" aria-label="Activity display" className="flex flex-wrap gap-3 text-sm">
          <TextLink href={"/activity?"+new URLSearchParams({...Object.fromEntries(retryQuery),mode:"grouped"}).toString()}
            aria-current={!rawMode?"page":undefined} className="inline-flex min-h-11 items-center md:min-h-9">Activity feed</TextLink>
          <TextLink href={"/activity?"+new URLSearchParams({...Object.fromEntries(retryQuery),mode:"raw"}).toString()}
            aria-current={rawMode?"page":undefined} className="inline-flex min-h-11 items-center md:min-h-9">Raw Audit Logs</TextLink>
        </div>
      </nav>:null}
      <Disclosure title={<>
          {rawMode?"Audit Logs — advanced search":"More filters"}
        </>} defaultOpen={explicitFilter||Boolean(one(params["collegeId"]))||rawMode} className="min-w-0">
      <form aria-label="Filter activity log" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-y border-border py-4 md:grid-cols-2 xl:grid-cols-4">
        <input type="hidden" name="view" value={selectedPreset} />
        {rawMode?<input type="hidden" name="mode" value="raw"/>:null}
        {rawMode?<Label>Rows per page
          <Select name="size" defaultValue={String(pageSize)}>
            <option value="25">25</option><option value="50">50</option><option value="100">100</option>
          </Select>
        </Label>:null}
        {collegeOptionsFailed && one(params["collegeId"]) ? (
          <input type="hidden" name="collegeId" value={one(params["collegeId"])} />
        ) : null}
        {isSuperAdmin(context) && !selectedCollegeId && !collegeOptionsFailed ? (
          <Label>
            <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">College</span>
            <Select name="collegeId" defaultValue={one(params["collegeId"]) ?? ""} className={inputClass}>
              <option value="">Current admin safety scope</option>
              {collegeOptions.map(college => <option key={college.id} value={college.id}>
                {college.name} ({college.code})
              </option>)}
            </Select>
          </Label>
        ) : null}
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">
            Module
          </span>
          <Select
            className={inputClass}
            name="module"
            defaultValue={
              effectiveModule ?? ""
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
          </Select>
        </Label>
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">
            Importance
          </span>
          <Select
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
          </Select>
        </Label>
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">
            From (IST)
          </span>
          <DateInput mode="date"
            className={inputClass}
            name="from"
            defaultValue={defaultFrom}
          />
        </Label>
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">
            To (IST)
          </span>
          <DateInput mode="date"
            className={inputClass}
            name="to"
            defaultValue={one(params["to"])}
          />
        </Label>
        <Disclosure title={<>More filters<span aria-hidden="true">⌄</span></>} defaultOpen={Boolean(one(params["eventType"])||one(params["subjectType"])||one(params["subjectId"])||one(params["actorName"])||one(params["q"])||one(params["actorUserId"])) || undefined} className="min-w-0 md:col-span-2 xl:col-span-4" preserveSummary summaryClassName="flex min-h-11 items-center justify-between">
          <div className="grid min-w-0 gap-[var(--lms-space-3)] pb-[var(--lms-space-4)] md:grid-cols-2 xl:grid-cols-4">
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">
            Event type
          </span>
          <Input
            className={inputClass}
            name="eventType"
            defaultValue={one(
              params["eventType"],
            )}
            placeholder="placements.offer.issued"
          />
        </Label>
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">
            Subject type
          </span>
          <Input
            className={inputClass}
            name="subjectType"
            defaultValue={one(
              params["subjectType"],
            )}
            placeholder="placement_offer"
          />
        </Label>
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">Subject / entity ID</span>
          <Input className={inputClass} name="subjectId" maxLength={500}
            defaultValue={one(params["subjectId"])} placeholder="Exact entity ID" />
        </Label>
        {isSuperAdmin(context) ? <>
          <Label><span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">Actor name</span>
            <Input type="search" className={inputClass} name="actorName" maxLength={100}
              defaultValue={one(params["actorName"])} placeholder="Name contains…" /></Label>
          <Label><span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">Event / entity search</span>
            <Input type="search" className={inputClass} name="q" maxLength={100}
              defaultValue={one(params["q"])} placeholder="Summary, event or entity contains…" /></Label>
        </> : null}
        <Label>
          <span className="mb-[6px] block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-body">
            Actor user ID
          </span>
          <Input
            className={inputClass}
            name="actorUserId"
            defaultValue={one(
              params["actorUserId"],
            )}
            placeholder="Optional UUID"
          />
        </Label>
          </div>
        </Disclosure>
        <div className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-2)] md:col-span-2 xl:col-span-4">
          <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
          <TextLink
            href={resetHref}
            className="inline-flex min-h-11 w-full items-center justify-center px-3 text-sm md:w-auto md:min-h-9"
          >
            Reset
          </TextLink>
        </div>
      </form>
      </Disclosure>

      {rawMode ? (
        <section aria-labelledby="raw-audit-log" className="min-w-0 space-y-3">
          <Heading level={2} size="lg" id="raw-audit-log" className="text-[var(--lms-heading)]">Raw Audit Logs</Heading>
          <p className="text-sm text-muted-foreground">
            Raw events in newest-first order. IP addresses are not retained in vNext;
            the audit record uses privacy-safe provenance instead.
          </p>
          {result.items.length ? (
            <ol aria-label="Audit log events" className="space-y-3 sm:hidden">
              {result.items.map(({event,actor})=>(
                <li key={event.id} className="min-w-0 space-y-3 rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
                  <time dateTime={event.occurredAt.toISOString()} className="block text-xs text-muted-foreground">
                    {istDateTimeFormatter.format(event.occurredAt)} IST
                  </time>
                  <p className="break-all font-semibold text-foreground">{event.eventType}</p>
                  <dl className="grid min-w-0 gap-2 text-sm">
                    <div><dt className="font-semibold text-muted-foreground">Entity</dt>
                      <dd className="min-w-0 break-words">{event.subjectType} · {event.subjectLabel??event.subjectId}</dd></div>
                    <div><dt className="font-semibold text-muted-foreground">Actor</dt>
                      <dd className="min-w-0 break-words">{actor?.displayName??actor?.email??"System"}</dd></div>
                    <div><dt className="font-semibold text-muted-foreground">College</dt>
                      <dd className="min-w-0 break-all">{event.collegeId??"—"}</dd></div>
                    <div><dt className="font-semibold text-muted-foreground">Organization</dt>
                      <dd className="min-w-0 break-all">{event.organizationId??"—"}</dd></div>
                  </dl>
                  <TextLink href={"/activity/"+encodeURIComponent(event.id)}
                    className="inline-flex min-h-11 items-center">View event details</TextLink>
                </li>
              ))}
            </ol>
          ) : (
            <p role="status" className="text-sm text-muted-foreground sm:hidden">
              No audit logs match these filters. <TextLink href={resetHref}>Clear filters</TextLink>
            </p>
          )}
          <div className="hidden w-full min-w-0 overflow-x-auto rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] sm:block">
            <Table className="min-w-[1120px]">
              <thead className="bg-[var(--lms-neutral-100)] text-[var(--lms-heading)]">
                <tr>{RAW_AUDIT_FORENSIC_HEADERS.map(label=>(
                  <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>
                ))}</tr>
              </thead>
              <tbody>
                {result.items.map(({event,actor})=>(
                  <tr key={event.id} className="border-t border-[var(--lms-canvas-border)] align-top">
                    <td className="whitespace-nowrap px-3 py-3">{istDateTimeFormatter.format(event.occurredAt)}</td>
                    <td className="max-w-[240px] break-all px-3 py-3">
                      {event.eventType}
                      <TextLink href={"/activity/"+encodeURIComponent(event.id)}
                        className="mt-1 block min-h-11 py-2">View event details</TextLink>
                    </td>
                    <td className="max-w-[220px] break-words px-3 py-3">
                      <span className="block text-xs text-muted-foreground">{event.subjectType}</span>
                      <span>{event.subjectLabel??event.subjectId}</span>
                    </td>
                    <td className="break-all px-3 py-3">{event.organizationId??"—"}</td>
                    <td className="break-all px-3 py-3">{event.collegeId??"—"}</td>
                    <td className="max-w-[180px] break-words px-3 py-3">{actor?.displayName??actor?.email??"System"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{RAW_AUDIT_MISSING_TRANSPORT}</td>
                    <td className="px-3 py-3 text-muted-foreground">{RAW_AUDIT_MISSING_TRANSPORT}</td>
                  </tr>
                ))}
                {result.items.length===0?<tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No audit logs match these filters.</td></tr>:null}
              </tbody>
            </Table>
          </div>
          {result.nextCursor ? <TextLink href={"/activity?"+nextParams.toString()}
            className="inline-flex min-h-11 items-center md:min-h-9">
            Load older events ({result.remainingCount} remaining)
          </TextLink> : null}
        </section>
      ) : <ActivityCenter
        nextRemaining={result.remainingCount}
        groups={groups}
        todayKey={today}
        yesterdayKey={ago(1)}
        nextHref={result.nextCursor ? "/activity?"+nextParams.toString() : null}
        emptyActionHref={resetHref}
      />}
    </div>
  );
}
