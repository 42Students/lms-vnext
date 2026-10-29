import "server-only";
import { asc, and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, courses, departments, collegeMemberships, users, membershipRoles, programs, learnerProgramEnrollments, placementCandidateAcademicEvidence, placementJobs } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { placementTableExists } from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {AuthorizationError} from "@/modules/permissions/policy";
import {TPO_BUILTIN_JOB_TYPES} from "./tpo-builtin-job-types";
import {codingProfileChoices} from "./tpo-coding-profile-model";
import {registrationChoiceOptions,afterCollegeAllOptions,AFTER_COLLEGE_LABELS} from "./tpo-after-college-model";
import {DEFAULT_LEARNER_EDUCATION_CATALOG} from "@/modules/people/learner-education-picker-model";
import {readTpoOutcomeChoiceCatalog} from "./tpo-outcome-label-settings-service";
import { placementTpoBlockedDates as tpoBlockedDates, placementTpoJobTypes as tpoJobTypes, placementTpoPrepReadiness as tpoPrepReadiness } from "@/db/schema/tpo-configuration";

/** Legacy ChoicesController advertised these fields. Only job types and
 * outcome labels have authoritative college-scoped providers here; remaining
 * keys must be provided by their owning modules, never fabricated as empty
 * arrays that look like real tenant choices.
 */
export const TPO_LEGACY_CHOICES_KEYS=[
 "genders","jobTypes","outcomes","outcomeLabels","driveModes",
 "registrationChoices","educationTypes","gradingTypes",
 "codingPlatforms","recruiterLeadSources","branches","passingYears",
] as const;
export async function getTpoJobTypes(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_job_types");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const rows=ready?await tx.select({
   id:tpoJobTypes.id,label:tpoJobTypes.label,active:tpoJobTypes.active,countsAsPlaced:tpoJobTypes.countsAsPlaced,isBuiltin:tpoJobTypes.isBuiltin,updatedAt:tpoJobTypes.updatedAt,sortOrder:tpoJobTypes.sortOrder,
  }).from(tpoJobTypes).where(eq(tpoJobTypes.collegeId,collegeId))
   .orderBy(asc(tpoJobTypes.sortOrder),asc(tpoJobTypes.id)):[];
  const usage=ready?await tx.select({
   label:sql<string>`lower(${placementJobs.jobTypeLabel})`,
   drives:sql<number>`count(*)::integer`,
  }).from(placementJobs)
   .where(and(eq(placementJobs.collegeId,collegeId),isNull(placementJobs.archivedAt)))
   .groupBy(sql`lower(${placementJobs.jobTypeLabel})`):[];
  const countByName=new Map(usage.map(row=>[row.label,row.drives]));
  const fixedNames=new Set(TPO_BUILTIN_JOB_TYPES.map(row=>row.label.toLowerCase()));
  const allRows=[
    ...TPO_BUILTIN_JOB_TYPES.map((fixed,index)=>{
      const saved=rows.find(row=>row.label.toLowerCase()===fixed.label.toLowerCase());
      return {
        id:saved?.id??`builtin:${index}`, label:fixed.label, name:fixed.label,
        builtin:true, isBuiltin:true, active:saved?.active??true,
        hidden:!(saved?.active??true),
        countsAsPlaced:saved?.countsAsPlaced??fixed.countsAsPlaced,
        sortOrder:index, updatedAt:saved?.updatedAt??null,
        drives:countByName.get(fixed.label.toLowerCase())??0,
      };
    }),
    ...rows.filter(row=>!fixedNames.has(row.label.toLowerCase())).map(row=>({
      ...row,name:row.label,builtin:row.isBuiltin,hidden:!row.active,
      drives:countByName.get(row.label.toLowerCase())??0,
    })),
  ];
  return {ready,rows:rows.map(row=>({...row,drives:countByName.get(row.label.toLowerCase())??0})),
   allRows,usage:countByName};
 });
}
export async function getTpoBlockedDates(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_blocked_dates");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const rows=ready?await tx.select({
   id:tpoBlockedDates.id,day:tpoBlockedDates.day,reason:tpoBlockedDates.reason,updatedAt:tpoBlockedDates.updatedAt,
  }).from(tpoBlockedDates).where(eq(tpoBlockedDates.collegeId,collegeId))
   .orderBy(asc(tpoBlockedDates.day)):[];
  return {ready,rows};
 });
}
export async function getTpoPrepReadiness(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_prep_readiness");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [row]=ready?await tx.select({
   config:tpoPrepReadiness.config,updatedAt:tpoPrepReadiness.updatedAt,
  }).from(tpoPrepReadiness).where(eq(tpoPrepReadiness.collegeId,collegeId)).limit(1):[];
  return {ready,config:row?.config??null,updatedAt:row?.updatedAt??null};
 });
}

export async function listTpoPrepCourses(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  // Legacy preparation choices belong to the college's ORGANIZATION, not
  // only its own departments. A sibling college's active course is eligible,
  // but an archived/disabled course or a foreign-organization course is not.
  return tx.select({id:courses.id,name:courses.name,code:courses.code}).from(courses)
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .innerJoin(colleges,eq(colleges.id,departments.collegeId))
   .where(and(eq(colleges.organizationId,college.organizationId),
    eq(colleges.status,"ACTIVE"),isNull(departments.archivedAt),
    eq(courses.status,"ACTIVE"),eq(courses.enabled,true),isNull(courses.deletedAt)))
   .orderBy(asc(courses.name),asc(courses.id));
 });
}

/** Authoritative choices for college members who can read placements.
 * A caller without a college gets only the five safe built-in defaults.
 * Hidden types can be retained on existing drives by the write service,
 * but must not be offered for a new selection.
 */
export async function listPlacementJobTypeChoices(ctx:RequestContext,collegeId:string|null){
 if(!collegeId)return TPO_BUILTIN_JOB_TYPES.map(row=>({
  ...row,builtin:true,hidden:false,drives:0,
 }));
 const ready=await placementTableExists("placement_tpo_job_types");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.read",{
   collegeId,organizationId:college.organizationId,
  });
  const rows=ready?await tx.select({
   label:tpoJobTypes.label,active:tpoJobTypes.active,
   countsAsPlaced:tpoJobTypes.countsAsPlaced,isBuiltin:tpoJobTypes.isBuiltin,
  }).from(tpoJobTypes).where(eq(tpoJobTypes.collegeId,collegeId))
   .orderBy(asc(tpoJobTypes.sortOrder),asc(tpoJobTypes.id)):[];
  // One grouped query accounts for current, non-archived drive usage; never
  // issue a per-option count query or expose another college's placements.
  const usage=ready?await tx.select({
    label:sql<string>`lower(${placementJobs.jobTypeLabel})`,
    drives:sql<number>`count(*)::integer`,
  }).from(placementJobs)
   .where(and(eq(placementJobs.collegeId,collegeId),isNull(placementJobs.archivedAt)))
   .groupBy(sql`lower(${placementJobs.jobTypeLabel})`):[];
  const countByName=new Map(usage.map(row=>[row.label,row.drives]));
  const defaults=TPO_BUILTIN_JOB_TYPES.flatMap(fixed=>{
   const configured=rows.find(row=>row.label.toLowerCase()===fixed.label.toLowerCase());
   return configured?.active===false?[]:[{
    label:fixed.label,countsAsPlaced:configured?.countsAsPlaced??fixed.countsAsPlaced,
    builtin:true,hidden:false,drives:countByName.get(fixed.label.toLowerCase())??0,
   }];
  });
  const fixedNames=new Set(TPO_BUILTIN_JOB_TYPES.map(row=>row.label.toLowerCase()));
  return [...defaults,...rows.filter(row=>row.active&&!row.isBuiltin&&
   !fixedNames.has(row.label.toLowerCase()))
   .map(row=>({
     label:row.label,countsAsPlaced:row.countsAsPlaced??true,
     builtin:false,hidden:false,drives:countByName.get(row.label.toLowerCase())??0,
   }))];
 });
}

/** Historic ChoicesController shape, now based on active students in the selected
 * college and stored academic evidence. Neither draft data nor other tenants
 * can contribute to an option, and all options are sorted deterministically. */
export async function listTpoLearnerChoices(ctx:RequestContext,collegeId:string|null){
 if(!collegeId)return {state:"NO_COLLEGE" as const,
  branches:[] as {value:string;label:string}[],
  passingYears:[] as {value:string;label:string}[]};
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.read",{collegeId,organizationId:college.organizationId});
  const active=and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
   eq(membershipRoles.role,"LEARNER"));
  const [branchRows,yearRows]=await Promise.all([
   tx.selectDistinct({name:sql<string>`btrim(${departments.name})`})
    .from(learnerProgramEnrollments)
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(active,eq(learnerProgramEnrollments.status,"ACTIVE"),
     eq(departments.collegeId,collegeId),isNull(departments.archivedAt),
     sql`btrim(${departments.name}) <> ''`))
    .orderBy(sql`btrim(${departments.name})`),
   tx.selectDistinct({year:placementCandidateAcademicEvidence.passingYear})
    .from(placementCandidateAcademicEvidence)
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementCandidateAcademicEvidence.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
    .where(and(active,sql`${placementCandidateAcademicEvidence.passingYear} between 1950 and 2200`))
    .orderBy(placementCandidateAcademicEvidence.passingYear),
  ]);
  return {state:"READY" as const,
   branches:branchRows.map(row=>({value:row.name,label:row.name})),
   passingYears:yearRows.flatMap(row=>row.year===null?[]:[{
    value:String(row.year),label:String(row.year)}])};
 });
}
/** Legacy consumers previously asked only for branch strings. */
export async function listTpoCollegeBranchOptions(ctx:RequestContext,collegeId:string|null){
 const options=await listTpoLearnerChoices(ctx,collegeId);
 return {state:options.state,branches:options.branches.map(row=>row.value)};
}
export async function listTpoCollegePassingYearOptions(ctx:RequestContext,collegeId:string|null){
 const options=await listTpoLearnerChoices(ctx,collegeId);
 return {state:options.state,passingYears:options.passingYears};
}

/** Single bounded choice snapshot compatible with the original ChoicesController.
 * Fixed choices are intentionally independent of the selected college. Custom
 * job types, outcome labels and academic facets are queried through their own
 * persisted-role-scoped readers and never cached across tenant switches.
 * Do not turn a failed scoped read into a plausible empty options array.
 */
export async function getTpoLegacyChoices(ctx:RequestContext,collegeId:string|null){
 if(ctx.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.read");
 const [jobTypes,learner,outcomeLabels]=await Promise.all([
  listPlacementJobTypeChoices(ctx,collegeId),
  listTpoLearnerChoices(ctx,collegeId),
  readTpoOutcomeChoiceCatalog(ctx,collegeId?"SCOPED":"UNIVERSAL"),
 ]);
 if(!outcomeLabels.ready)throw new Error("TPO_CHOICES_UNAVAILABLE");
 const same=(values:readonly string[])=>values.map(value=>({value,label:value}));
 const leadSources=[
  ["ALUMNI","Alumni"],["REFERRAL","Referral"],["LINKEDIN","LinkedIn"],
  ["JOB_PORTAL","Job portal"],["EVENT","Event or job fair"],
  ["COLD_OUTREACH","Cold outreach"],["COMPANY_REACHED_OUT","Company reached out"],
  ["MANUAL","Added by hand"],["IMPORT","Imported"],
 ] as const;
 return {
  genders:same(["Male","Female","Other","Prefer not to say"]),
  jobTypes:jobTypes.map(row=>({value:row.label,label:row.label,
   countsAsPlaced:row.countsAsPlaced,builtin:row.builtin})),
  outcomes:afterCollegeAllOptions().map(row=>({
   value:row.value==="LOOKING_FOR_JOB"?"SEEKING":
    row.value==="NOT_DECIDED"?"NOT_REGISTERED":row.value,
   label:row.value==="PLACED_ON_CAMPUS"?"Placed (on campus)":
    row.value==="PLACED_OFF_CAMPUS"?"Placed (off campus)":row.label,
   settable:["HIGHER_STUDIES","ENTREPRENEURSHIP","COMPETITIVE_EXAMS","NOT_INTERESTED"].includes(row.value),
  })),
  outcomeLabels:outcomeLabels.labels.map(row=>({
   id:row.id,label:row.label,outcome:row.outcome,
   outcomeName:AFTER_COLLEGE_LABELS[row.outcome],
  })),
  driveModes:[
   {value:"ON_CAMPUS",label:"On campus"},
   {value:"POOL",label:"Pool"},
   {value:"OFF_CAMPUS",label:"Off campus"},
  ],
  registrationChoices:registrationChoiceOptions(),
  educationTypes:same(DEFAULT_LEARNER_EDUCATION_CATALOG.educationTypes),
  gradingTypes:same(DEFAULT_LEARNER_EDUCATION_CATALOG.gradingTypes),
  codingPlatforms:codingProfileChoices,
  recruiterLeadSources:leadSources.map(([value,label],index)=>({
   value,label,pickable:index<7,
  })),
  branches:learner.branches,
  passingYears:learner.passingYears,
 };
}
