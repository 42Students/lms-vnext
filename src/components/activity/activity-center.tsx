import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import {Fragment,type ReactNode} from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

/** The raw forensic view is a different presentation from the readable
 * Activity feed. Historical IP/user-agent fields are not collected by this
 * tenant-safe event store; keep their columns and state "Not retained". */
export const RAW_AUDIT_FORENSIC_HEADERS=[
 "Time","Action","Entity","Org","College","Actor","IP","User Agent",
] as const;
export const RAW_AUDIT_MISSING_TRANSPORT="Not retained";
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

// Historical admin_audit_log keys use ENTITY_VERB[_BULK], whereas the
// normalized event stream uses module.entity_verb. Both are display-only inputs.
const ACTION_WORDS: Readonly<Record<string,string>> = {
 CREATE:"created",ADD:"added",UPDATE:"updated",UPDATED:"updated",EDIT:"edited",DELETE:"deleted",
 REMOVE:"removed",RESTORE:"restored",PROMOTE:"promoted",SUSPEND:"suspended",
 REACTIVATE:"reactivated",IMPERSONATE:"impersonated",ASSIGN:"assigned",UNASSIGN:"unassigned",
 SET:"changed",TOGGLE:"switched",READ:"viewed",VIEW:"viewed",MARK:"marked",
 SYNC:"synced",REORDER:"reordered",PUBLISH:"published",UNPUBLISH:"unpublished",
 ARCHIVE:"archived",APPROVE:"approved",REJECT:"rejected",IMPORT:"imported",
 EXPORT:"exported",MOVE:"moved",RESET:"reset",CLEAR:"cleared",GRADE:"graded",
 UPLOAD:"uploaded",SEND:"sent",INVITE:"invited",CLOSE:"closed",OPEN:"opened",
 COMPLETE:"completed",ROLLBACK:"rolled back",SENT:"sent",CREATED:"created",
 DELETED:"deleted",REJECTED:"rejected",APPROVED:"approved",ARCHIVED:"archived",
};
const ENTITY_WORDS: Readonly<Record<string,string>> = {
 CLASS_SCHEDULE:"a class session",LESSON_CONTENT:"lesson content",LECTURE_HALL:"lecture hall",
 SEMESTER_COURSE:"semester courses",MODULE_ACCESS:"module access for",
 COLLEGE_FEATURE:"a college feature",LEARNER_IDENTITY:"student identity documents of",
 PROJECT_TASK_COMMENT:"a comment on task",PROJECT_TASK:"task",PROJECT:"project",
 BATCH_SEMESTER:"the semester of batch",COURSE_BULK_STATUS:"the status of courses",
 LEARNER:"student",LEARNER_PROFILE:"student profile",
};
const SPECIAL_ACTIONS: Readonly<Record<string,{verb:string;thing:string}>> = {
 LEARNER_PROFILE_WRITE_BY_OTHER:{verb:"edited",thing:"the profile of"},
 PROJECT_ASSIGN_MENTOR:{verb:"assigned",thing:"a mentor to project"},
 PROJECT_ASSIGN_LEARNERS:{verb:"assigned",thing:"students to project"},
 PROJECT_RESOURCE_SYNC:{verb:"updated",thing:"the resources of project"},
 PROJECT_MEETINGS_SYNC:{verb:"updated",thing:"the meetings of project"},
 PROJECT_TASK_REORDER:{verb:"reordered",thing:"tasks in project"},
 CLASS_SCHEDULE_RECURRING_CREATE:{verb:"created",thing:"repeating class sessions"},
 SEMESTER_COURSE_BULK_ADD:{verb:"added",thing:"courses to semester"},
 SEMESTER_COURSE_REMOVE:{verb:"removed",thing:"a course from semester"},
 JOB_UPDATED:{verb:"updated",thing:"drive"},
 PROJECT_TEMPLATE_CREATED:{verb:"created",thing:"project template"},
 PROJECT_TEMPLATE_UPDATED:{verb:"updated",thing:"project template"},
 PROJECT_TEMPLATE_ARCHIVED:{verb:"archived",thing:"project template"},
 PROJECT_TEMPLATE_COLLEGE_REVOKED:{verb:"revoked",thing:"college access to project template"},
 PROJECT_TEMPLATE_UNASSIGNED:{verb:"unassigned",thing:"project template"},
 PROJECT_RELEASE_CREATED:{verb:"created",thing:"project release"},
 PROJECT_RELEASE_PUBLISHED:{verb:"published",thing:"project release"},
};
function actionSentence(code:string,subjectType:string) {
 const tokens=code.replaceAll(".", "_").toUpperCase().split("_").filter(Boolean);
 const key=tokens.join("_");
 const special=SPECIAL_ACTIONS[key]??SPECIAL_ACTIONS[tokens.slice(1).join("_")];
 if(special)return special.verb+" "+special.thing;
 // The normalized module prefix does not belong to the entity name.
 const codeTokens=code.includes(".")?code.split(".").at(-1)!.toUpperCase().split("_"):tokens;
 const verbIndex=codeTokens.findLastIndex(word=>Boolean(ACTION_WORDS[word]));
 const verb=verbIndex>=0?ACTION_WORDS[codeTokens[verbIndex]!]:"changed";
 const rawEntityTokens=verbIndex>=0?codeTokens.slice(0,verbIndex):codeTokens;
 const entityTokens=rawEntityTokens.filter(word=>word!=="BULK"&&word!=="BY"&&word!=="OTHER");
 const canonical=entityTokens.join("_")||subjectType.toUpperCase();
 // Preserve a BULK token for exceptional legacy nouns such as COURSE_BULK_STATUS.
 const thing=ENTITY_WORDS[rawEntityTokens.join("_")]||ENTITY_WORDS[canonical]||
  humanize(entityTokens.join("_")||subjectType)||"an item";
 return verb+" "+thing;
}
export function activityEventSentence(
 event:{eventType:string;subjectType:string;subjectLabel:string|null},
 actor:{displayName:string|null;email:string|null}|null,
){
 const who=actor?.displayName?.trim()||actor?.email?.trim()||"System";
 const action=actionSentence(event.eventType,event.subjectType);
 const label=event.subjectLabel?.trim();
 return [who,action,label&&label.toLowerCase()!==humanize(event.subjectType)?label:null]
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

/** Bound nested legacy payloads to readable, non-executable key/value content. */
function detailValue(value:unknown,depth=0):ReactNode {
 if(value===undefined||value===null||value===""||value==="null")return "—";
 if(typeof value==="string")return <span className="break-all whitespace-pre-wrap">{value.slice(0,2000)}{value.length>2000?"…":""}</span>;
 if(typeof value==="number"||typeof value==="boolean")return String(value);
 if(depth>=6)return <span className="text-muted-foreground">Further nested details not shown</span>;
 if(Array.isArray(value))return <ol className="list-inside list-decimal space-y-1">
  {value.slice(0,30).map((item,i)=><li key={i}>{detailValue(item,depth+1)}</li>)}
  {value.length>30?<li>+{value.length-30} more values</li>:null}
 </ol>;
 if(typeof value==="object")return <dl className="space-y-1">
  {Object.entries(value as Record<string,unknown>).slice(0,30).map(([key,item])=>
   <div key={key} className="min-w-0 break-words">
    <dt className="inline font-semibold">{humanize(key)}: </dt>
    <dd className="inline">{detailValue(item,depth+1)}</dd>
   </div>)}
  {Object.keys(value).length>30?<div className="text-muted-foreground">Further fields not shown</div>:null}
 </dl>;
 return "—";
}

function eventDayName(value:string,todayKey?:string,yesterdayKey?:string){
 const day=activityDay(value);
 return day===todayKey?"Today":day===yesterdayKey?"Yesterday":activityDayHeading(value);
}

export function ActivityCenter({
  groups,
  nextHref,
  nextRemaining,
  todayKey,
  yesterdayKey,
  emptyActionHref = "/activity",
  emptyTitle,
  emptyDescription,
}: {
  groups: readonly ActivityCenterGroup[];
  nextHref: string | null;
  nextRemaining:number;
  todayKey?: string;
  yesterdayKey?: string;
  emptyActionHref?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (groups.length === 0) {
    return <EmptyState
      title={emptyTitle??(emptyActionHref.includes("/projects")?"No activity recorded yet":"Nothing important happened in this period.")}
      description={emptyDescription??"No activity in this period. Try another date, category or search."}
      action={<Link href={emptyActionHref} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Reset</Link>}
    />;
  }

  // The legacy Project audit uses a dense day-grouped table. The default
  // activity centre remains the readable feed; neither view changes the query.
  if (emptyActionHref.includes("/projects")) return (
    <div className="min-w-0 space-y-3">
      <div className="w-full overflow-x-auto rounded-[var(--lms-canvas-radius)] border border-border">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-surface-subtle text-foreground">
            <tr>{["Time (IST)","Who","Action","Item","Details"].map(label=>
              <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>)}</tr>
          </thead>
          <tbody>
            {groups.map((group,index)=>{
              const item=group.latest,day=activityDay(item.event.occurredAt);
              const previous=index?activityDay(groups[index-1].latest.event.occurredAt):null;
              return <Fragment key={group.key+":"+item.event.id}>
                {day!==previous?<tr className="border-t border-border bg-surface-subtle">
                  <th colSpan={5} scope="rowgroup" className="px-3 py-2 text-sm font-semibold">
                    {eventDayName(item.event.occurredAt,todayKey,yesterdayKey)}
                  </th>
                </tr>:null}
                <tr className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-3">{formatWhen(item.event.occurredAt)}</td>
                  <td className="max-w-[180px] break-words px-3 py-3">
                    {item.actor?.displayName??item.actor?.email??"System"}
                  </td>
                  <td className="max-w-[220px] break-words px-3 py-3">
                    {actionSentence(item.event.eventType,item.event.subjectType)}
                    {group.count>1?<span className="block text-xs text-muted-foreground">{group.count} related events</span>:null}
                  </td>
                  <td className="max-w-[200px] break-words px-3 py-3">
                    {item.event.subjectLabel??item.event.subjectType}
                  </td>
                  <td className="px-3 py-3">
                    <Disclosure title="Details" className="min-w-[120px] text-xs">
                      <dl className="space-y-2">
                        <div><dt className="font-semibold">Action key</dt><dd className="break-all">{item.event.eventType}</dd></div>
                        <div><dt className="font-semibold">Entity ID</dt><dd className="break-all">{item.event.subjectId}</dd></div>
                        <div><dt className="font-semibold">Actor ID</dt><dd className="break-all">{item.actor?.id??"System"}</dd></div>
                        {Object.entries(item.event.metadata).map(([name,value])=>
                          <div key={name}><dt className="font-semibold">{humanize(name)}</dt>
                            <dd>{detailValue(value)}</dd></div>)}
                      </dl>
                      <Link href={"/activity/"+encodeURIComponent(item.event.id)}
                        className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
                        View details
                      </Link>
                    </Disclosure>
                  </td>
                </tr>
              </Fragment>;
            })}
          </tbody>
        </table>
      </div>
      {nextHref?<Link href={nextHref}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Load more ({nextRemaining} older)
      </Link>:null}
    </div>
  );

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        {groups.map((group,index) => {
          const item = group.latest;
          const day=activityDay(group.latest.event.occurredAt);
          const previousDay=index>0?activityDay(groups[index-1].latest.event.occurredAt):null;
          return (
            <Fragment key={group.key+":"+item.event.id}>
            {day!==previousDay?<h3 className="mt-[var(--lms-space-6)] text-sm font-semibold text-muted-foreground">{day===todayKey?"Today":day===yesterdayKey?"Yesterday":activityDayHeading(item.event.occurredAt)}</h3>:null}
            <article className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4">
              <div className="flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
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
                        {group.count.toLocaleString("en-IN")} related events
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">
                    {activityEventSentence(item.event,item.actor)}
                  </h2>
                  <p className="mt-1 text-sm text-body leading-[22px]">{item.event.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-5">
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
                <div className="flex shrink-0 flex-col items-start gap-2 min-[768px]:items-end">
                  <span className="max-w-full break-all text-xs text-muted-foreground">
                    {humanize(item.event.eventType)}
                  </span>
                  <Link
                    href={`/activity/${item.event.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-foreground min-[768px]:min-h-9 min-[768px]:w-auto motion-safe:transition-colors hover:border-[var(--lms-teal-deep)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                  >
                    View details
                  </Link>
                </div>
              </div>
              <Disclosure title="Details" className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <dl className="mt-2 grid gap-1 min-[768px]:grid-cols-2">
                  <div><dt>Action</dt><dd>{humanize(item.event.eventType)}</dd></div>
                  <div><dt>Actor</dt><dd className="break-all">{item.actor?.displayName??item.actor?.email??"System"}{item.actor?.id?" · "+item.actor.id:""}</dd></div>
                  <div><dt>Entity</dt><dd className="break-all">{item.event.subjectType}: {item.event.subjectId}</dd></div>
                  <div><dt>Exact time (IST)</dt><dd>{formatWhen(item.event.occurredAt)}</dd></div>
                  <div><dt>Events grouped</dt><dd>{group.count>1?"several at once ("+group.count+")":"1"}</dd></div>
                  {Object.entries(item.event.metadata).map(([name,value])=><div key={name}>
                    <dt>{humanize(name)}</dt><dd className="break-all whitespace-pre-wrap">{detailValue(value)}</dd>
                  </div>)}
                </dl>
              </Disclosure>
            </article>
            </Fragment>
          );
        })}
      </div>

      {nextHref ? (
        <div className="flex justify-center">
          <Link
            href={nextHref}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 md:w-auto text-sm font-semibold text-foreground motion-safe:transition-colors hover:border-[var(--lms-teal-deep)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            Load more ({nextRemaining} older)
          </Link>
        </div>
      ) : null}
    </div>
  );
}
