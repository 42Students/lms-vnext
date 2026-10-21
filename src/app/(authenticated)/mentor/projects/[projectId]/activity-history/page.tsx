import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {getMentorMeetingChangeHistory} from "@/modules/projects/mentor-meeting-history-service";
import {PROJECT_MEETING_HISTORY_TITLE} from "@/db/schema/project-audit-staged";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  mentorProjectActivityHref,mentorProjectActivityQuerySchema,
  mentorProjectActivityMobileLayout,mentorProjectActivityMobileFilters,
} from "@/modules/projects/mentor-project-activity-model";
import { getMentorProjectActivityHistory } from "@/modules/projects/mentor-project-activity-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";

type Params={importance?:string|string[];view?:string|string[];window?:string|string[];order?:string|string[];page?:string|string[];pageSize?:string|string[];meetingKey?:string|string[];meetingPage?:string|string[]};

export default async function MentorProjectActivityHistoryPage({
  params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Params>}) {
  const [{projectId},raw]=await Promise.all([params,searchParams]);
  const filters=singleValueMentorFilters({
    importance:raw.importance,view:raw.view,window:raw.window,order:raw.order,page:raw.page,pageSize:raw.pageSize,
  });
  const parsed=mentorProjectActivityQuerySchema.safeParse(
    filters ? {projectId,...filters} : null,
  );
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid activity filters" />
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
      Return to projects
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getMentorProjectActivityHistory(context,parsed.data);
  const meetingKey=typeof raw.meetingKey==="string"&&raw.meetingKey.trim().length<=120
    ?raw.meetingKey.trim():"";
  const meetingPage=typeof raw.meetingPage==="string"?raw.meetingPage:"1";
  // Only load typed revisions when the meeting-history view is requested.
  // The service independently checks current mentor membership and project.
  const meetingHistory=data.enabled&&data.query.view==="MEETINGS"
    ?await getMentorMeetingChangeHistory(context,{
      projectId, ...(meetingKey?{meetingKey}:{}), page:meetingPage,
    }).catch(()=>null)
    :null;
  const advancedActive=data.query.window!=="ALL"||data.query.order!=="NEWEST"||data.query.pageSize!==20;
  const filtered=advancedActive||data.query.importance!=="ALL"||data.query.view!=="ALL";
  return <div className={mentorProjectActivityMobileLayout}>
    <PageHeader eyebrow="Mentor · Project Activity" title="Recorded project activity"
      description={data.enabled?data.title+" · Events linked to this assigned project.":"Projects access is disabled. No private project activity was loaded."}
      actions={<Link data-unskin="" href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=activity"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Project activity workspace
      </Link>} />
    {!data.enabled ?
      <section role="status" className="border-b border-border pb-4 text-sm text-body">
        Projects access is disabled. No project activity was loaded.
      </section> : <>
      <FilterBar title="Filters"><form method="get" role="search" aria-label="Recorded project activity filters"
        action={"/mentor/projects/"+encodeURIComponent(projectId)+"/activity-history"}
        className={mentorProjectActivityMobileFilters+" !rounded-none !border-0 !bg-transparent !p-0 max-[767px]:[&_label]:w-full"}>
        <div className="grid min-w-0 w-full items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Event importance
          <Select name="importance" defaultValue={data.query.importance}
            className="min-h-11 md:min-h-9">
            <option value="ALL">All</option><option value="LOW">Low</option>
            <option value="NORMAL">Normal</option><option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Event type
          <Select name="view" defaultValue={data.query.view}
            className="min-h-11 md:min-h-9">
            <option value="ALL">All recorded events</option>
            <option value="PROJECT">Project lifecycle</option>
            <option value="REVIEWS">Review decisions</option><option value="DELIVERIES">Final delivery history</option>
            <option value="MEETINGS">Meeting change history</option>
            <option value="TASKS">Task events</option>
            <option value="EVALUATIONS">Recorded evaluations</option><option value="SPRINTS">Sprint changes</option><option value="ASSIGNMENTS">Mentor assignments</option><option value="RESOURCES">Resources</option><option value="TEAM">Team membership</option>
          </Select>
        </label>
        {meetingKey?<input type="hidden" name="meetingKey" value={meetingKey}/>:null}
        <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">
          Filter
        </Button>
        </div>
        <Disclosure title="More filters" defaultOpen={advancedActive} className="min-w-0 w-full border-y border-border py-2" contentClassName="pt-3">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recorded within
          <Select name="window" defaultValue={data.query.window}
            className="min-h-11 md:min-h-9">
            <option value="ALL">All recorded events</option>
            <option value="LAST_7_DAYS">Past 7×24 hours</option>
            <option value="LAST_30_DAYS">Past 30×24 hours</option>
            <option value="LAST_90_DAYS">Past 90×24 hours</option>
            <option value="OLDER_THAN_30_DAYS">Older than 30×24 hours</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Chronology
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 md:min-h-9">
            <option value="NEWEST">Newest recorded first</option>
            <option value="OLDEST">Oldest recorded first</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
          <Select name="pageSize" defaultValue={String(data.query.pageSize)}
            className="min-h-11 md:min-h-9">
            <option value="20">20 events</option>
            <option value="50">50 events</option>
          </Select>
        </label>
          </div>
        </Disclosure>
        {filtered?<Link href={mentorProjectActivityHref({...data.query,importance:"ALL",view:"ALL",window:"ALL",order:"NEWEST",pageSize:20,page:1})}
          className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">Clear</Link>:null}
      </form></FilterBar>
      <p className="text-sm text-body leading-[22px]">
        {data.total.toLocaleString("en-IN")} matching persisted event{data.total===1?"":"s"}
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link data-unskin="" href={"/api/projects/"+encodeURIComponent(projectId)+
          "/mentor-activity-export"+(data.query.importance==="ALL"&&data.query.view==="ALL"&&data.query.window==="ALL"&&data.query.order==="NEWEST"?"":"?"+
            new URLSearchParams({importance:data.query.importance,view:data.query.view,window:data.query.window,order:data.query.order}).toString())}
          download className="inline-flex min-h-11 items-center break-words text-sm font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Export recorded events CSV (max 200)
        </Link>
        {data.total>200?<span role="status">
          Export omits {data.total-200} additional matching events.
        </span>:null}
      </div>
      {data.items.length===0 ? <EmptyState title="No recorded project activity"
        description="No registered activity events match this project and importance filter. Missing audit producers or pre-migration records cannot be inferred."
        action={filtered?<Link href={mentorProjectActivityHref({...data.query,importance:"ALL",view:"ALL",window:"ALL",order:"NEWEST",pageSize:20,page:1})} className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">Clear</Link>:undefined} />
        : <ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(event=>
          <li key={event.id} className="min-w-0 break-words py-[var(--lms-space-3)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground leading-[22px]">{event.label}</p>
              <span className="text-xs text-body">{event.importance}</span>
            </div>
            <time dateTime={event.occurredAt.toISOString()} className="mt-2 block text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(event.occurredAt)} IST
            </time>
          </li>)}</ol>}
      {data.totalPages>1?<Pagination label="Project activity history pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorProjectActivityHref({...data.query,page})}/>:null}
      {data.query.view==="MEETINGS" ? <section aria-label={PROJECT_MEETING_HISTORY_TITLE}
        className="min-w-0 space-y-4 border-t border-[var(--lms-canvas-border)] pt-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--lms-heading)]">{PROJECT_MEETING_HISTORY_TITLE}</h2>
          <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=meetings"}
            className="min-h-9 text-sm font-semibold text-link underline">Back to meetings</Link>
        </div>
        <p className="text-sm text-body">Recorded meeting revisions, newest first. Details show only allowed fields
          from this project&apos;s persisted history; legacy records may be incomplete.</p>
        <form method="get" action={"/mentor/projects/"+encodeURIComponent(projectId)+"/activity-history"}
          className="flex min-w-0 flex-wrap items-end gap-2" role="search" aria-label="Filter meeting history">
          <input type="hidden" name="view" value="MEETINGS"/>
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-body">
            Meeting key
            <Input name="meetingKey" maxLength={120} defaultValue={meetingKey}
              placeholder="All project meetings"/>
          </label>
          <Button type="submit" variant="secondary">Filter</Button>
          {meetingKey?<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"/activity-history?view=MEETINGS"}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
            Clear</Link>:null}
        </form>
        {!meetingHistory ? <p role="alert" className="text-sm text-error">
          Meeting history could not be loaded. Other activity events are still available.
          <Link href={mentorProjectActivityHref({...data.query,view:"MEETINGS",page:1})}
            className="ml-2 font-semibold underline">Retry</Link>
        </p> : meetingHistory.items.length===0 ?
          <EmptyState title="No meeting changes recorded"
            description="No persisted meeting revisions match this project and meeting key."/> :
          <div className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
            {meetingHistory.items.map(item=><article key={item.id} className="min-w-0 space-y-2 py-3 text-sm">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <strong>{item.actionType.replaceAll("_"," ")} · {item.meetingKey}</strong>
                <time dateTime={item.createdAt} className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
                    timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))} IST
                </time>
              </div>
              <p className="text-xs text-body">By {item.actorName}
                {item.actorUserType?" · "+item.actorUserType:""}</p>
              {item.notes?<p className="whitespace-pre-wrap break-words text-sm text-body">{item.notes}</p>:null}
              <Disclosure title="View before and after" className="border-b border-border"
                contentClassName="space-y-3 pt-3">
                {item.changedFields.length?<p className="text-xs text-muted-foreground">
                  Changed fields: {item.changedFields.join(", ")}</p>:null}
                <div className="grid min-w-0 gap-3 md:grid-cols-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold">Before</h3>
                    <pre className="mt-1 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded border border-border p-3 text-xs">
                      {item.before?JSON.stringify(item.before,null,2):"Not recorded"}
                    </pre>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">After</h3>
                    <pre className="mt-1 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded border border-border p-3 text-xs">
                      {item.after?JSON.stringify(item.after,null,2):"Not recorded"}
                    </pre>
                  </div>
                </div>
              </Disclosure>
            </article>)}
          </div>}
        {meetingHistory&&meetingHistory.pageCount>1?
          <Pagination label="Meeting change history pages" page={meetingHistory.page}
            pageCount={meetingHistory.pageCount}
            hrefForPage={nextPage=>{
              const query=new URLSearchParams({view:"MEETINGS",meetingPage:String(nextPage)});
              if(meetingKey)query.set("meetingKey",meetingKey);
              return "/mentor/projects/"+encodeURIComponent(projectId)+"/activity-history?"+query.toString();
            }}/> :null}
      </section> :null}
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      General activity records show registered event types and timestamps only.
      Typed meeting revisions are separately restricted to the assigned mentor and safely redacted.
      It does not claim to contain every historic action.
    </p>
  </div>;
}
