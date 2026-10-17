import Link from "next/link";
import {Fragment} from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export type ActivityCenterGroup = {
  key: string;
  count: number;
  latest: {
    event: {
      id: string;
      module: string;
      eventType: string;
      importance: string;
      subjectType: string;
      subjectId: string;
      subjectLabel: string | null;
      summary: string;
      metadata: Record<string,unknown>;
      occurredAt: string;
    };
    actor: {
      id: string | null;
      displayName: string | null;
      email: string | null;
    } | null;
  };
  earliest: {
    event: {
      occurredAt: string;
    };
  };
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .join(" ")
    .split(".")
    .join(" ");
}

export function activityEventSentence(
 event:{eventType:string;subjectType:string;subjectLabel:string|null},
 actor:{displayName:string|null;email:string|null}|null,
){
 const who=actor?.displayName?.trim()||actor?.email?.trim()||"System";
 const action=event.eventType.split(".").at(-1)?.replaceAll("_"," ").toLowerCase()||"updated";
 const thing=humanize(event.subjectType);
 const label=event.subjectLabel?.trim();
 return [who,action,thing,label&&label.toLowerCase()!==thing.toLowerCase()?label:null]
  .filter(Boolean).join(" ");
}
function activityDay(value:string){
 return new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date(value));
}
function activityDayHeading(value:string){
 return new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(value));
}
function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function tone(
  importance: string,
):
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error" {
  if (importance === "CRITICAL") {
    return "error";
  }
  if (importance === "HIGH") {
    return "warning";
  }
  if (importance === "LOW") {
    return "neutral";
  }
  return "info";
}

export function ActivityCenter({
  groups,
  nextHref,
  nextRemaining,
  todayKey,
  yesterdayKey,
}: {
  groups: readonly ActivityCenterGroup[];
  nextHref: string | null;
  nextRemaining:number;
  todayKey?: string;
  yesterdayKey?: string;
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="m-0 font-semibold text-foreground">
          No meaningful activity matches these filters.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Technical request noise is intentionally excluded from this center.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {groups.map((group,index) => {
          const item = group.latest;
          const day=activityDay(group.latest.event.occurredAt);
          const previousDay=index>0?activityDay(groups[index-1].latest.event.occurredAt):null;
          return (
            <Fragment key={group.key+":"+item.event.id}>
            {day!==previousDay?<h3 className="mt-5 text-sm font-semibold text-muted-foreground">{day===todayKey?"Today":day===yesterdayKey?"Yesterday":activityDayHeading(item.event.occurredAt)}</h3>:null}
            <article
              key={
                group.key +
                ":" +
                item.event.id
              }
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={tone(
                        item.event
                          .importance,
                      )}
                    >
                      {humanize(
                        item.event
                          .importance,
                      )}
                    </StatusBadge>
                    <StatusBadge>
                      {humanize(
                        item.event.module,
                      )}
                    </StatusBadge>
                    {group.count > 1 ? (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {group.count} related events
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    {activityEventSentence(item.event,item.actor)}
                  </h2>
                  <p className="mt-1 text-sm text-body">{item.event.summary}</p>
                  <p className="mt-1 text-sm text-body">
                    {item.event.subjectLabel ??
                      humanize(
                        item.event
                          .subjectType,
                      )}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.actor
                      ?.displayName ??
                      item.actor?.email ??
                      "System"}{" "}
                    ·{" "}
                    {formatWhen(
                      item.event
                        .occurredAt,
                    )}
                    {group.count > 1
                      ? " · grouped from " +
                        formatWhen(
                          group.earliest
                            .event
                            .occurredAt,
                        )
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span className="max-w-full break-all text-xs text-muted-foreground">
                    {humanize(item.event.eventType)}
                  </span>
                  <Link
                    href={`/activity/${item.event.id}`}
                    className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle"
                  >
                    View details
                  </Link>
                </div>
              </div>
              <details className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-semibold">Details</summary>
                <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                  <div><dt>Action</dt><dd>{humanize(item.event.eventType)}</dd></div>
                  <div><dt>Entity</dt><dd className="break-all">{item.event.subjectType}: {item.event.subjectId}</dd></div>
                  <div><dt>Exact time (IST)</dt><dd>{formatWhen(item.event.occurredAt)}</dd></div>
                  <div><dt>Events grouped</dt><dd>{group.count>1?"several at once ("+group.count+")":"1"}</dd></div>
                  {Object.entries(item.event.metadata).map(([name,value])=><div key={name}>
                    <dt>{humanize(name)}</dt><dd className="break-all">{typeof value==="string"?value:JSON.stringify(value)}</dd>
                  </div>)
                </dl>
              </details>
            </article>
            </Fragment>
          );
        })}
      </div>

      {nextHref ? (
        <div className="flex justify-center">
          <Link
            href={nextHref}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Load more ({nextRemaining} older)
          </Link>
        </div>
      ) : null}
    </div>
  );
}
