"use client";
import {useRef,useTransition} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {SUPER_ADMIN_TODAY_LABELS,type SuperAdminTodayMetrics} from "@/modules/colleges/admin-today-attention-model";

/** Scope comes exclusively from the parent dashboard's authenticated server
 * read. Refresh re-executes that read; it never accepts a client college ID. */
type Metric={title:string;count:number|null;href:string;icon:number;
 tone:"danger"|"warn"|"info";empty:string;detail:string;
 rows?:readonly {primary:string;secondary:string;href?:string}[];
 moreCount?:number;moreLabel?:string};
function LegacyAttentionIcon({kind}:{kind:number}){
 return <svg aria-hidden="true" width={19} height={19} viewBox="0 0 24 24"
  fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
  strokeWidth={1.8} className="shrink-0">
  {kind===0?<><circle cx={12} cy={12} r={9}/><path d="M12 6v6l4 2"/></>:
   kind===1?<><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 4h.01"/></>:
   kind===2?<><path d="M7 3h10l3 3v15H4V3h3Zm3 6h7m-7 4h7m-7 4h5"/></>:
   kind===3?<><circle cx={8} cy={8} r={3}/><circle cx={17} cy={9} r={2}/><path d="M2 21v-3a6 6 0 0 1 12 0v3m1-6a5 5 0 0 1 7 5v1"/></>:
   kind===4?<><path d="M13 3a6 6 0 0 0 7 8l-9 9a3 3 0 0 1-4-4l9-9A6 6 0 0 0 13 3Z"/></>:
   <><rect x={3} y={5} width={18} height={16} rx={2}/><path d="M7 3v4m10-4v4M3 10h18m-14 4h3m4 0h3"/></>}
 </svg>;
}
function CheckIcon(){return <svg aria-hidden="true" width={16} height={16}
 viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
 strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={12} r={9}/>
 <path d="m8 12 3 3 5-6"/></svg>;}
function AttentionCard({item,loading,failed}:{item:Metric;loading:boolean;failed:boolean}){
 const clear=!loading&&!failed&&item.count===0;
 const tone=failed?"#b42318":clear?"#237804":item.tone==="info"?"#1677ff":
  item.tone==="danger"?"#cf1322":"#d48806";
 return <article aria-busy={loading} className="min-w-0 overflow-hidden rounded-[var(--lms-radius-card)] border border-border bg-surface shadow-none"
  style={{borderTop:"3px solid "+tone}}>
  <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
   <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--lms-heading)]">
    <span className="inline-flex shrink-0" style={{color:tone}}><LegacyAttentionIcon kind={item.icon}/></span>
    {item.title}
   </h3>
   {!loading&&!failed&&item.count!==null?<span aria-label={item.count+" "+item.title}
    className="inline-flex min-w-7 items-center justify-center rounded-full bg-[var(--lms-neutral-100)] px-2 py-1 text-sm font-semibold tabular-nums text-[var(--lms-heading)]">
    {item.count}
   </span>:null}
  </div>
  <div className="min-h-[98px] space-y-3 px-4 py-3">
   {loading?<div role="status" aria-label={"Loading "+item.title} className="space-y-3 animate-pulse">
    <span className="block h-4 w-[70%] rounded bg-[var(--lms-neutral-100)]"/>
    <span className="block h-4 w-[90%] rounded bg-[var(--lms-neutral-100)]"/>
    <span className="block h-4 w-[55%] rounded bg-[var(--lms-neutral-100)]"/>
   </div>:failed?<p role="status" className="text-sm text-muted-foreground">
     Couldn't load this. Refresh to try again.
   </p>:clear?<p className="flex items-start gap-2 text-sm text-[#237804]"><CheckIcon/>{item.empty}</p>:
    <><p className="text-sm text-body leading-5">{item.detail}</p>
      {item.rows?.length?<ul className="divide-y divide-border border-y border-border text-sm" aria-label={item.title+" preview"}>
       {item.rows.map((row,index)=><li key={index} className="min-w-0 py-2">
        {row.href?<Link href={row.href} className="font-semibold text-link underline">
         {row.primary}</Link>:<strong className="text-[var(--lms-heading)]">{row.primary}</strong>}
        <p className="mt-1 text-xs leading-5 text-body">{row.secondary}</p>
       </li>)}
       {(item.moreCount??0)>0?<li className="py-2 text-xs font-semibold">
        <Link href={item.href} className="text-link underline">and {item.moreCount} more{item.moreLabel?" "+item.moreLabel:""}</Link>
       </li>:null}
      </ul>:null}
      <Link href={item.href} className="inline-flex min-h-9 items-center font-semibold text-link underline">
       {item.icon===0?"Open attendance":item.icon===3?"Faculty assignment":
        item.icon===5?"Quizzes":"Review "+item.title.toLowerCase()}
      </Link>
    </>}
  </div>
 </article>;
}
export function SuperAdminTodayBoard({data}:{data:SuperAdminTodayMetrics|null}){
 const router=useRouter();
 const [refreshing,startRefresh]=useTransition();
 const refreshInFlight=useRef(false);
 const pendingRows=data?.attendancePendingRows??[];
 const riskRows=data?.attendanceRiskRows??[];
 const gradingRows=data?.gradingRows??[];
 const unstaffedRows=data?.unstaffedRows??[];
 const quizRows=data?.dueQuizRows??[];
 const setupRows=data?.setupGapRows??[];
 const metrics:Metric[]=[
  {title:SUPER_ADMIN_TODAY_LABELS[0],count:data?.attendanceNotTaken??null,
   href:"/admin/academics",icon:0,tone:"danger",
   empty:"No ended scheduled class in the last 7 days is waiting for an attendance mark.",
   detail:"Last 7 days · ended scheduled classes with no marked attendance session.",
   rows:pendingRows.map(row=>({primary:row.title+" · "+row.section,
    secondary:row.when+" · "+row.faculty})),
   moreCount:Math.max(0,(data?.attendanceNotTaken??0)-pendingRows.length)},
  {title:"Under "+(data?.attendanceThreshold??75)+"% attendance",
   count:data?.attendanceAtRisk??null,href:"/admin/academics",
   icon:1,tone:"danger",empty:"No student is under "+(data?.attendanceThreshold??75)+"% in the last 30 days.",
   detail:"Last 30 days · marked sessions only. The rate includes implicit Present attendance.",
   rows:riskRows.map(row=>({primary:(row.displayName||"Student")+" · "+(row.rollNumber||"No roll number"),
    secondary:row.percent+"% · "+row.className+" · "+row.held+" held · "+row.absent+" absent"})),
   moreCount:Math.max(0,(data?.attendanceAtRisk??0)-riskRows.length)},
  {title:SUPER_ADMIN_TODAY_LABELS[2],count:data?.gradingBacklog??null,href:"/admin/courses",
   icon:2,tone:"warn",empty:"No assignment submission is waiting for a grade.",
   detail:"Submitted assignments awaiting grading, grouped by course.",
   rows:gradingRows.map(row=>({primary:row.course+" ("+row.code+")",
    secondary:row.pending+" ungraded"+(row.oldest?" · Oldest "+row.oldest:"")})),
   moreCount:Math.max(0,(data?.gradingBacklog??0)-
    gradingRows.reduce((total,row)=>total+row.pending,0)),moreLabel:"submissions"},
  {title:SUPER_ADMIN_TODAY_LABELS[3],count:data?.coursesWithoutTeacher??null,
   href:"/admin/courses",icon:3,tone:"warn",
   empty:"Every current-semester course has a teacher for every section.",
   detail:"Active section courses missing a primary faculty assignment.",
   rows:unstaffedRows.map(row=>({primary:row.course,
    secondary:row.section+" · "+row.semester})),
   moreCount:Math.max(0,(data?.coursesWithoutTeacher??0)-unstaffedRows.length)},
  {title:SUPER_ADMIN_TODAY_LABELS[4],count:data?.setupGaps??null,href:"/admin/academics",
   icon:4,tone:"warn",empty:"Batches, sections, students and courses are all connected.",
   detail:"Structure gaps in active batches, sections, learner enrolments and lessons.",
   rows:setupRows.filter(row=>row.count>0).map(row=>({
    primary:row.label,secondary:row.count+" need attention",href:row.href})),
   moreCount:0},
  {title:SUPER_ADMIN_TODAY_LABELS[5],count:data?.quizzesClosingThisWeek??null,
   href:"/admin/courses",icon:5,tone:"info",
   empty:"No quiz closes in the next 7 days.",
   detail:"Published quizzes with deadlines in the next 7 days.",
   rows:quizRows.map(row=>({primary:row.title+" · "+row.course,
    secondary:(row.when??"No deadline")+" · "+row.section})),
   moreCount:Math.max(0,(data?.quizzesClosingThisWeek??0)-quizRows.length)},
 ];
 // Never interpret unknown/null metrics as zero. In particular, an all-clear
 // banner cannot appear while the setup and grading evidence is unavailable.
 const complete=Boolean(data)&&metrics.every(item=>item.count!==null);
 const allClear=complete&&metrics.every(item=>item.count===0);
 function refresh(){
  if(refreshInFlight.current||refreshing)return;
  refreshInFlight.current=true;
  startRefresh(()=>{
   router.refresh();
   refreshInFlight.current=false;
  });
 }
 return <section aria-label="Needs attention" className="min-w-0 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Today</h2>
   <Button type="button" variant="ghost" size="sm" disabled={refreshing}
    onClick={refresh} loading={refreshing}>
    <svg aria-hidden="true" width={15} height={15} viewBox="0 0 24 24"
     fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
     <path d="M20 7v5h-5M4 17v-5h5M5 9a7 7 0 0 1 12-2l3 5M4 12l3 5a7 7 0 0 0 12-2"/>
    </svg>
    Refresh
   </Button>
  </div>
  <div aria-label="Today's classes" className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3 text-sm text-body">
   {data?<><span><strong>{data.classesScheduled}</strong> {data.classesScheduled===1?"class":"classes"} scheduled today</span>
    <span><strong>{data.classesHeld??0}</strong> held so far (attendance started)</span>
    <span className={(data.classesHeld??0)>data.attendanceTaken?"font-semibold text-warning-text":""}>
     <strong>{data.attendanceTaken}</strong> with attendance taken</span></>:
    refreshing?<span role="status">Loading today&apos;s classes…</span>:
     <span role="alert">Today&apos;s classes couldn&apos;t be loaded.</span>}
  </div>
  {!data&&!refreshing?<p role="alert" className="text-sm text-error">
    Couldn't load today's overview. Refresh to try again.
   </p>:null}
  <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
   {metrics.map(item=><AttentionCard key={item.title} item={item}
    loading={refreshing} failed={!data||item.count===null}/>)}
  </div>
  {allClear?<p role="status" className="flex items-center gap-2 rounded-md border border-[#b7eb8f] bg-[#f6ffed] p-3 text-sm text-[#237804]">
   <CheckIcon/> Nothing needs you right now.
  </p>:null}
  <p className="text-xs text-muted-foreground">
   Only classes with started or marked attendance count as held. Unavailable metrics are never counted as zero.
   Refresh keeps the previous rendered overview until the scoped server read completes.
  </p>
 </section>;
}
