import "server-only";
import {and,asc,count,eq,exists,gte,lt,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,cohorts,departments,learnerProgramEnrollments,
 placementApplications,placementApplicationScreenings,placementCompanies,
 placementCompanyRelationships,placementJobs,programs} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {collegeHiringAnalyticsSchema} from "./college-hiring-analytics-model";

const stages=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED",
 "OFFERED","HIRED","REJECTED","WITHDRAWN"] as const;

/** All counts are observed application stage facts in the selected college; never
 * infer a funnel stage solely from the existence of an offer or scheduled round. */
export async function getCollegeHiringFunnel(context:RequestContext,raw:unknown){
 const query=collegeHiringAnalyticsSchema.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(context);
 const db=getDb();
 // Exclusive next-day boundary includes every millisecond of the requested
 // IST date, unlike 23:59:59 which incorrectly drops the final second.
 const toExclusive=query.to
  ?new Date(Date.parse(query.to+"T00:00:00+05:30")+86_400_000):null;
 const [departmentsLookup,programLookup,cohortLookup]=await Promise.allSettled([
  db.select({id:departments.id,name:departments.name}).from(departments)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(departments.name)),
  db.select({id:programs.id,name:programs.name,departmentId:programs.departmentId})
   .from(programs).innerJoin(departments,eq(departments.id,programs.departmentId))
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(programs.name)),
  db.select({id:cohorts.id,name:cohorts.name,programId:cohorts.programId})
   .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(cohorts.name)),
 ]);
 const departmentsList=departmentsLookup.status==="fulfilled"?departmentsLookup.value:[];
 const programList=programLookup.status==="fulfilled"?programLookup.value:[];
 const cohortList=cohortLookup.status==="fulfilled"?cohortLookup.value:[];
 const filterErrors={
  departments:departmentsLookup.status==="rejected"?
   "Departments could not be loaded. Retry this report.":null,
  programs:programLookup.status==="rejected"?
   "Programs could not be loaded. Retry this report.":null,
  cohorts:cohortLookup.status==="rejected"?
   "Batches could not be loaded. Retry this report.":null,
 };
 const academicFilter=query.departmentId||query.programId||query.cohortId;
 const base=db.select({
  applicationId:placementApplications.id,
  previousStage:placementCollegeApplicationStages.previousStage,
  jobId:placementJobs.id,jobTitle:placementJobs.title,
  companyId:placementCompanies.id,companyName:placementCompanies.name,
  status:placementApplications.status,
  stage:sql<string>`case when ${placementApplications.status}='WITHDRAWN' then 'WITHDRAWN'
    else coalesce(${placementCollegeApplicationStages.stage},
     case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
      when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
      else 'APPLIED' end) end`.as("observed_stage"),
  shortlistHours:sql<number|null>`(select extract(epoch from
    (min(h.moved_at)-${placementApplications.submittedAt}))/3600
    from placement_college_application_stage_history h
    inner join placement_college_application_stages s on s.id=h.stage_id
    where s.application_id=${placementApplications.id} and h.to_stage='SHORTLISTED')`
    .as("shortlist_hours"),
 }).from(placementApplications)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,collegeId)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId)))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .leftJoin(placementApplicationScreenings,
   eq(placementApplicationScreenings.applicationId,placementApplications.id))
 .leftJoin(placementCollegeApplicationStages,
   eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
 .where(and(
  query.seasonId?eq(placementJobs.seasonId,query.seasonId):undefined,
  query.jobId?eq(placementJobs.id,query.jobId):undefined,
  query.from?gte(placementApplications.submittedAt,new Date(query.from+"T00:00:00+05:30")):undefined,
  toExclusive?lt(placementApplications.submittedAt,toExclusive):undefined,
  academicFilter?exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
   .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),eq(departments.collegeId,collegeId),
    query.departmentId?eq(departments.id,query.departmentId):undefined,
    query.programId?eq(programs.id,query.programId):undefined,
    query.cohortId?eq(learnerProgramEnrollments.cohortId,query.cohortId):undefined,
   ))):undefined,
 )).as("college_hiring_funnel_base");
 const observedStageCount=(stage:string)=>sql<number>`count(*) filter (
   where ${base.stage}=${stage}
   or ${base.previousStage}=${stage}
   or exists (
    select 1 from placement_college_application_stages stage_fact
    inner join placement_college_application_stage_history stage_event
      on stage_event.stage_id=stage_fact.id
    where stage_fact.application_id=${base.applicationId}
      and (stage_event.to_stage=${stage} or stage_event.from_stage=${stage})
   )
  )::integer`.mapWith(Number);
 // These are actual observed stage transitions, not inferred intermediate
 // stages: they intentionally differ from the one-current-stage KPI snapshot.
 const stageProjections=Object.fromEntries(stages.map(stage=>[
  stage,stage==="APPLIED"?sql<number>`count(*)::integer`.mapWith(Number):
   observedStageCount(stage),
 ]));
 // Company breakdown is an independent optional read. A failure here must
 // not hide the college-level metrics or a successfully loaded funnel.
 const [groupRows,currentStageRows,averages,reachedRows]=await Promise.all([
  db.select({jobId:base.jobId,jobTitle:base.jobTitle,
   companyId:base.companyId,companyName:base.companyName,
   stage:base.stage,total:count()}).from(base)
   .groupBy(base.jobId,base.jobTitle,base.companyId,base.companyName,base.stage)
   .orderBy(asc(base.companyName),asc(base.jobTitle))
   .then(rows=>rows).catch(()=>null),
  db.select({stage:base.stage,total:count()}).from(base).groupBy(base.stage),
  db.select({avgHours:sql<number|null>`avg(${base.shortlistHours})`}).from(base)
   .where(sql`${base.shortlistHours} >= 0`),
  db.select(stageProjections).from(base),
 ]);
 const totals=Object.fromEntries(stages.map(stage=>[stage,0])) as Record<string,number>;
 for(const row of currentStageRows){
  if(row.stage in totals)totals[row.stage]+=row.total;
 }
 const companies=new Map<string,{
  jobId:string;job:string;company:string;total:number;byStage:Record<string,number>
 }>();
 const companySubtotals=new Map<string,{
  companyId:string;company:string;total:number;byStage:Record<string,number>
 }>();
 const normalizedSubtotals=new Map<string,{
  company:string;total:number;byStage:Record<string,number>
 }>();
 for(const row of groupRows??[]){
  const current=companies.get(row.jobId)??{
   jobId:row.jobId,job:row.jobTitle,company:row.companyName,total:0,
   byStage:Object.fromEntries(stages.map(stage=>[stage,0])),
  };
  current.total+=row.total;
  if(row.stage in current.byStage)current.byStage[row.stage]+=row.total;
  companies.set(row.jobId,current);
  const subtotal=companySubtotals.get(row.companyId)??{
   companyId:row.companyId,company:row.companyName,total:0,
   byStage:Object.fromEntries(stages.map(stage=>[stage,0])),
  };
  subtotal.total+=row.total;
  if(row.stage in subtotal.byStage)subtotal.byStage[row.stage]+=row.total;
  companySubtotals.set(row.companyId,subtotal);
  // The old report grouped aliases by a case-insensitive trimmed company
  // display name. Keep stable company-ID subtotals too for vNext drill-downs.
  const normalizedName=row.companyName.trim().replace(/\s+/g," ");
  const normalizedKey=normalizedName.toLocaleLowerCase("en");
  const named=normalizedSubtotals.get(normalizedKey)??{
   company:normalizedName,total:0,
   byStage:Object.fromEntries(stages.map(stage=>[stage,0])),
  };
  named.total+=row.total;
  if(row.stage in named.byStage)named.byStage[row.stage]+=row.total;
  normalizedSubtotals.set(normalizedKey,named);
 }
 const cumulativeTotals=Object.fromEntries(stages.map(stage=>
  [stage,Number(reachedRows[0]?.[stage]??0)])) as Record<(typeof stages)[number],number>;
 return {query,totals,cumulativeTotals,
  funnelBasis:"OBSERVED_TRANSITIONS" as const,
  totalApplications:Object.values(totals).reduce((sum,n)=>sum+n,0),
  companyReportUnavailable:groupRows===null,
  companyRows:[...companies.values()],
  companySubtotals:[...companySubtotals.values()].sort((a,b)=>
   a.company.localeCompare(b.company)||a.companyId.localeCompare(b.companyId)),
  normalizedCompanySubtotals:[...normalizedSubtotals.values()].sort((a,b)=>
   a.company.localeCompare(b.company)),
  companyRowsFirstPage:[...companies.values()].slice(0,10),
  companyRowsPageSize:10,
  averageHoursToShortlist:averages[0]?.avgHours==null?null:Number(averages[0].avgHours),
  availableStages:[...stages],
  filters:{departments:departmentsList,programs:programList,cohorts:cohortList,errors:filterErrors}};
}
