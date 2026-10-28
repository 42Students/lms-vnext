import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {listOwnPlacementRequests} from "./request-service";
import {
  ownLearnerSupportRequestList,learnerUnifiedHistoryQuerySchema,
  type LearnerUnifiedRequestHistoryItem,
} from "./learner-support-request-model";
import {placementTableExists} from "./staged-tables";

/** Legacy placement-only support list; the unified page uses SQL paging below. */
export async function getOwnLearnerSupportRequests(context:RequestContext,query:unknown) {
  const membership=await requireLearnerPlacementAccess(context);
  requirePermission(context,"placements.read",{collegeId:membership.collegeId,organizationId:membership.organizationId});
  const rows=await listOwnPlacementRequests(context);
  return ownLearnerSupportRequestList(rows,query);
}

type UnifiedDbRow={
  total:number|string;
  id:string|null;
  source:"PLACEMENT"|"GENERAL"|null;
  type:string|null;
  status:string|null;
  reason:string|null;
  requested_at:Date|string|null;
  decision_note:string|null;
  job_title:string|null;
  updated_at:Date|string|null;
};
function asDate(value:Date|string):Date{
  return value instanceof Date?value:new Date(value);
}

/** One statement and one database snapshot for count and page.
 * This replaces the old 100-general-row in-memory merge. Filtering and sorting
 * happen in PostgreSQL over both college/membership-scoped sources; the UI
 * never downloads historical rows outside the requested bounded page.
 * General requests live in an additive staged table, so deployments without
 * it must omit that SQL branch rather than reference a missing relation.
 */
export async function getOwnUnifiedLearnerRequests(context:RequestContext,query:unknown){
  const q=learnerUnifiedHistoryQuerySchema.parse(query);
  const membership=await requireLearnerPlacementAccess(context);
  requirePermission(context,"placements.read",{
    collegeId:membership.collegeId,organizationId:membership.organizationId});
  const generalReady=await placementTableExists("placement_learner_general_requests");

  const generalBranch=generalReady?sql`
    union all
    select g.id,'GENERAL'::text as source,g.kind::text as type,
      g.status::text as status,g.reason,g.requested_at,g.decision_note,
      null::text as job_title,null::timestamptz as updated_at
    from placement_learner_general_requests g
    where g.membership_id=${membership.id}::uuid
      and g.college_id=${membership.collegeId}::uuid
  `:sql.empty();

  const result=await getDb().execute(sql`
    with feed as (
      select r.id,'PLACEMENT'::text as source,r.request_type::text as type,
        r.status::text as status,r.reason,r.requested_at,r.decision_note,
        j.title as job_title,r.updated_at
      from placement_learner_requests r
      inner join placement_applications a on a.id=r.application_id
      inner join placement_jobs j on j.id=a.job_id
      where a.membership_id=${membership.id}::uuid
        and r.learner_membership_id=${membership.id}::uuid
        and j.college_id=${membership.collegeId}::uuid
      ${generalBranch}
    ),
    filtered as (
      select * from feed where
        (${q.status}='ALL' or status=${q.status})
        and (${q.type}='ALL' or type=${q.type})
    ),
    totals as (select count(*)::int as total from filtered)
    select totals.total,list.id,list.source,list.type,list.status,list.reason,
      list.requested_at,list.decision_note,list.job_title,list.updated_at
    from totals left join lateral (
      select * from filtered
      order by requested_at desc,source asc,id asc
      limit ${q.pageSize}
      offset ((least(${q.page},
        greatest(1,ceil(totals.total::numeric / ${q.pageSize})::int))-1)*${q.pageSize})
    ) list on true
    order by list.requested_at desc,list.source asc,list.id asc
  `);
  const rows=result.rows as unknown as UnifiedDbRow[];
  const total=Number(rows[0]?.total??0);
  const totalPages=Math.max(1,Math.ceil(total/q.pageSize));
  const page=Math.min(q.page,totalPages);
  const items:LearnerUnifiedRequestHistoryItem[]=rows.flatMap(row=>
    row.id&&row.source&&row.type&&row.status&&row.reason!==null&&row.requested_at
      ?[{
        id:row.id,source:row.source,type:row.type,status:row.status,
        reason:row.reason,requestedAt:asDate(row.requested_at),
        decisionNote:row.decision_note,jobTitle:row.job_title,
        updatedAt:row.updated_at?asDate(row.updated_at):null,
      }]:[]
  );
  return {items,page,pageSize:q.pageSize,total,totalPages,
    olderPage:page<totalPages?page+1:null,hasPrevious:page>1,
    hasMore:page<totalPages,generalAvailable:generalReady};
}
