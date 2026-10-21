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
 return new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(value));
}
function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function activityTime(value:string){
 const date=new Date(value);
 return Number.isFinite(date.getTime())?
 new Intl.DateTimeFormat("en-IN",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"})
  .format(date).toUpperCase():"Not recorded";
}
function activityActorName(item:ActivityCenterGroup["latest"]){
 if(item.actor?.displayName?.trim())return item.actor.displayName.trim();
 const id=item.actor?.id;if(!id)return "System";
 const role=String(item.event.metadata.actorUserType??item.event.metadata.actorRole??"").toUpperCase();
 const kind=role.includes("STUDENT")||role.includes("LEARNER")?"Student":
  role.includes("FACULTY")||role.includes("STAFF")?"Staff":"User";
 return kind+" #"+id.slice(0,16);
}
function activitySubjectName(event:ActivityCenterGroup["latest"]["event"]){
 if(event.subjectLabel?.trim())return event.subjectLabel.trim();
 for(const key of ["targetName","entityName","name","title"]){
  const v=event.metadata[key];
  if(typeof v==="string"&&v.trim())return v.trim().slice(0,160);
 }
 return humanize(event.subjectType)+" #"+event.subjectId.slice(0,16);
}
function activityActionTone(eventType:string,importance:string){
 if(/(delete|remove|revoke|suspend|reject|archive|debar|cancel|block)/i.test(eventType))
  return "warning" as const;
 if(/(approve|verify|publish|restore|resolve|activate)/i.test(eventType))
  return "success" as const;
 return tone(importance);
}
function activitySafeMetadata(metadata:Record<string,unknown>){
 const sensitive=/(token|secret|password|credential|authorization|session|cookie|private.?key|object.?path|phone|email|ip.?address|user.?agent)/i;
 return Object.entries(metadata).filter(([key,v])=>!sensitive.test(key)&&
  v!==null&&v!==undefined&&v!=="").slice(0,14);
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
 if(typeof value==="string")return <span className="break-all whitespace-pre-wrap">{value.slice(0,160)}{value.length>160?"…":""}</span>;
 if(typeof value==="number"||typeof value==="boolean")return String(value);
 if(depth>=3)return <span className="text-muted-foreground">Further nested details not shown</span>;
 if(Array.isArray(value))return <ol className="list-inside list-decimal space-y-1">
  {value.slice(0,14).map((item,i)=><li key={i}>{detailValue(item,depth+1)}</li>)}
  {value.length>14?<li>+{value.length-14} more values</li>:null}
 </ol>;
 if(typeof value==="object")return <dl className="space-y-1">
  {activitySafeMetadata(value as Record<string,unknown>).map(([key,item])=>
   <div key={key} className="min-w-0 break-words">
    <dt className="inline font-semibold">{humanize(key)}: </dt>
    <dd className="inline">{detailValue(item,depth+1)}</dd>
   </div>)}
  {Object.keys(value).length>14?<div className="text-muted-foreground">Further fields not shown</div>:null}
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
                    {activityActorName(item)}
                  </td>
                  <td className="max-w-[220px] break-words px-3 py-3">
                    {actionSentence(item.event.eventType,item.event.subjectType)}
                    {group.count>1?<span className="block text-xs text-muted-foreground">{group.count} related events</span>:null}
                  </td>
                  <td className="max-w-[200px] break-words px-3 py-3">
                    {activitySubjectName(item.event)}
                  </td>
                  <td className="px-3 py-3">
                    <Disclosure title="Details" className="min-w-[120px] text-xs">
                      <dl className="space-y-2">
                        <div><dt className="font-semibold">Action key</dt><dd className="break-all">{item.event.eventType}</dd></div>
                        <div><dt className="font-semibold">Entity ID</dt><dd className="break-all">{item.event.subjectId}</dd></div>
                        <div><dt className="font-semibold">Actor ID</dt><dd className="break-all">{item.actor?.id??"System"}</dd></div>
                        {activitySafeMetadata(item.event.metadata).map(([name,value])=>
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
      <div className="min-w-0" role="list" aria-label="Dated activity timeline">
        {groups.map((group,index) => {
          const item = group.latest;
          const day=activityDay(group.latest.event.occurredAt);
          const previousDay=index>0?activityDay(groups[index-1].latest.event.occurredAt):null;
          return (
            <Fragment key={group.key+":"+item.event.id}>
            {day!==previousDay?<h3 className="mt-[var(--lms-space-6)] text-sm font-semibold text-muted-foreground">{day===todayKey?"Today":day===yesterdayKey?"Yesterday":activityDayHeading(item.event.occurredAt)}</h3>:null}
            <article role="listitem" className={"min-w-0 border-b border-[var(--lms-canvas-border)] py-3 "+
              (/(delete|remove|reject|revoke|suspend|archive|debar)/i.test(item.event.eventType)?"border-l-[3px] border-l-orange-500 pl-3":"")}>
              <div className="flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={activityActionTone(item.event.eventType,item.event.importance)}
                    >
                      {humanize(
                        item.event
                          .importance,
                      )}
                    </StatusBadge>
                    {/(^|[._])BULK($|[._])/i.test(item.event.eventType)||group.count>1?
                     <span className="rounded border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      several at once{group.count>1?" ("+group.count+")":""}
                     </span>:null}
                    {group.count > 1 ? (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {group.count.toLocaleString("en-IN")} recorded operations
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 grid grid-cols-[70px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[84px_minmax(0,1fr)]">
                   <time dateTime={item.event.occurredAt} className="whitespace-nowrap pt-1 text-xs tabular-nums text-muted-foreground">
                    {activityTime(item.event.occurredAt)}
                   </time>
                   <h2 className="min-w-0 break-words text-sm font-medium leading-6 text-[var(--lms-heading)]">
                    {/(delete|remove|reject|revoke|suspend|archive|debar)/i.test(item.event.eventType)?
                     <span role="img" aria-label="Caution" className="mr-2">⚠</span>:null}
                    <strong>{activityActorName(item)}</strong>{" "}
                    {actionSentence(item.event.eventType,item.event.subjectType)}{" "}
                    <strong>{activitySubjectName(item.event)}</strong>
                   </h2>
                  </div>
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
                  <Link
                    href={`/activity/${item.event.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-foreground min-[768px]:min-h-9 min-[768px]:w-auto motion-safe:transition-colors hover:border-[var(--lms-teal-deep)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                  >
                    View details
                  </Link>
                </div>
              </div>
              <details className="group mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <summary className="inline-flex min-h-9 cursor-pointer list-none items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">
                 <span className="group-open:hidden">Details</span><span className="hidden group-open:inline">Hide details</span>
                </summary>
                <dl className="mt-2 grid gap-1 min-[768px]:grid-cols-2">
                  <div><dt>Action</dt><dd>{humanize(item.event.eventType)}</dd></div>
                  <div><dt>Actor</dt><dd className="break-all">{activityActorName(item)}{item.actor?.id?" · "+item.actor.id:""}</dd></div>
                  <div><dt>Entity</dt><dd className="break-all">{item.event.subjectType}: {item.event.subjectId}</dd></div>
                  <div><dt>Exact time (IST)</dt><dd>{formatWhen(item.event.occurredAt)}</dd></div>
                  <div><dt>Events grouped</dt><dd>{group.count>1?"several at once ("+group.count+")":"1"}</dd></div>
                  {activitySafeMetadata(item.event.metadata).map(([name,value])=><div key={name}>
                    <dt>{humanize(name)}</dt><dd className="break-all whitespace-pre-wrap">{detailValue(value)}</dd>
                  </div>)}
                </dl>
              </details>
            </article>
            </Fragment>
          );
        })}
      </div>

      <details className="min-w-0 border-t border-border pt-3">
       <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link">
        Raw forensic table · current page
       </summary>
       <p className="text-xs text-muted-foreground">One representative event appears per activity group. IP and user-agent source values were not retained. Use individual details for full audit records.</p>
       <div className="mt-3 w-full overflow-x-auto"><table className="min-w-[960px] w-full border-collapse text-left text-xs">
        <thead><tr>{RAW_AUDIT_FORENSIC_HEADERS.map(label=>
         <th scope="col" key={label} className="border-b border-border px-3 py-2">{label}</th>)}</tr></thead>
        <tbody>{groups.map(group=>{
         const item=group.latest;
         return <tr key={item.event.id} className="border-b border-border align-top">
          <td className="whitespace-nowrap px-3 py-2">{formatWhen(item.event.occurredAt)}</td>
          <td className="px-3 py-2" title={item.event.eventType}>{actionSentence(item.event.eventType,item.event.subjectType)}</td>
          <td className="px-3 py-2" title={item.event.subjectId}>{activitySubjectName(item.event)}</td>
          <td className="px-3 py-2">{String(item.event.metadata.organizationName??"Not retained")}</td>
          <td className="px-3 py-2">{String(item.event.metadata.collegeName??"Not retained")}</td>
          <td className="px-3 py-2" title={item.actor?.id??undefined}>{activityActorName(item)}</td>
          <td className="px-3 py-2">{RAW_AUDIT_MISSING_TRANSPORT}</td>
          <td className="px-3 py-2">{RAW_AUDIT_MISSING_TRANSPORT}</td>
         </tr>;
        })}</tbody>
       </table></div>
      </details>

      {nextHref ? (
        <div className="flex justify-center">
          <Link
            href={nextHref}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 md:w-auto text-sm font-semibold text-foreground motion-safe:transition-colors hover:border-[var(--lms-teal-deep)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            Load older activity ({nextRemaining} remaining) · next page
          </Link>
        </div>
      ) : null}
    </div>
  );
}
