import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {parseActivityDateBoundary} from "@/modules/activity/date-boundary";
import type {TpoMessagesQuery} from "./tpo-messages-service";
import type {TpoInboxRecord} from "./tpo-messages-model";

type Row={
 id:string;recruiter_name:string|null;job_id:string|null;job_title:string|null;
 created_at:Date;last_message_at:Date|null;last_preview:string|null;
 company_name:string|null;last_sender:string|null;
 message_count:number;unread_count:number;body_match:boolean;
 search_snippet:string|null;access_ended:boolean;status:string;occurred_at:Date;
};
type Counts={total:number;unread:number;read:number;empty:number;reply:number};

/** TPO-inbox-team-12: PostgreSQL does status/search/date filtering, stable
 * ordering, count and LIMIT/OFFSET before sending rows to the application.
 * Only one requested page leaves the database, never the entire college inbox.
 */
export async function getTpoRecruiterThreadSqlPage(collegeId:string,query:TpoMessagesQuery){
 const db=getDb(),q=query.q.trim().length>=2?query.q.trim():"";
 const from=query.from?parseActivityDateBoundary(query.from,"from"):null;
 const to=query.to?parseActivityDateBoundary(query.to,"to"):null;
 const base=sql`
  select t.id,t.created_at, u.display_name as recruiter_name,
   j.id as job_id,j.title as job_title,
   max(m.created_at) as last_message_at,
   count(m.id)::int as message_count,
   count(m.id) filter(where m.sender_type='RECRUITER' and m.read_at is null)::int as unread_count,
   (select z.sender_type from placement_tpo_messages z where z.thread_id=t.id
      order by z.created_at desc,z.id desc limit 1) as last_sender,
   (select left(z.body,160) from placement_tpo_messages z where z.thread_id=t.id
      order by z.created_at desc,z.id desc limit 1) as last_preview,
   (select lead.company_name from placement_tpo_leads lead where lead.college_id=t.college_id
      and lead.recruiter_user_id=t.recruiter_user_id
      order by lead.updated_at desc,lead.id desc limit 1) as company_name,
   (select left(z.body,160) from placement_tpo_messages z where z.thread_id=t.id
      and position(lower(${q}) in lower(z.body))>0
      order by z.created_at desc,z.id desc limit 1) as search_snippet,
   exists(select 1 from placement_tpo_messages z where z.thread_id=t.id
      and position(lower(${q}) in lower(z.body))>0) as body_match,
   not exists(select 1 from placement_recruiter_college_grants grant_row
      inner join placement_company_relationships rel on rel.id=grant_row.company_relationship_id
      inner join placement_recruiter_profiles pr on pr.user_id=grant_row.recruiter_user_id
        and pr.company_id=rel.company_id
      where rel.college_id=t.college_id and rel.status='ACTIVE' and pr.status='ACTIVE'
        and grant_row.recruiter_user_id=t.recruiter_user_id and grant_row.status='ACTIVE'
        and grant_row.verification_status='VERIFIED' and grant_row.valid_until>now()) as access_ended
  from placement_tpo_message_threads t
  join users u on u.id=t.recruiter_user_id
  left join placement_jobs j on j.id=t.job_id and j.college_id=t.college_id
  left join placement_tpo_messages m on m.thread_id=t.id
  where t.college_id=${collegeId}::uuid
  group by t.id,u.display_name,j.id,j.title
 `;
 const projected=sql`select raw.*,
  case when raw.message_count=0 then 'EMPTY' when raw.unread_count>0 then 'UNREAD'
       else 'READ' end as status,
  coalesce(raw.last_message_at,raw.created_at) as occurred_at
  from (${base}) raw`;
 const conditions=[sql`true`];
 if(query.status==="REPLY")conditions.push(sql`f.last_sender='RECRUITER'`);
 else if(query.status!=="ALL")conditions.push(sql`f.status=${query.status}`);
 if(q)conditions.push(sql`(
   position(lower(${q}) in lower(coalesce(f.recruiter_name,'')))>0
   or position(lower(${q}) in lower(coalesce(f.company_name,'')))>0
   or position(lower(${q}) in lower(coalesce(f.job_title,'General recruiter conversation')))>0
   or position(lower(${q}) in lower(coalesce(f.last_preview,'')))>0
   or f.body_match=true)`);
 if(from)conditions.push(sql`f.occurred_at >= ${from}`);
 if(to)conditions.push(sql`f.occurred_at <= ${to}`);
 const where=sql.join(conditions,sql` AND `);
 const filtered=sql`select f.* from (${projected}) f where ${where}`;
 const [[total], [all], page]=await Promise.all([
  db.execute<{count:number}>(sql`select count(*)::int as count from (${filtered}) b`).then(r=>r.rows),
  db.execute<Counts>(sql`select count(*)::int as total,
   count(*) filter(where x.status='UNREAD')::int as unread,
   count(*) filter(where x.status='READ')::int as read,
   count(*) filter(where x.status='EMPTY')::int as empty,
   count(*) filter(where x.last_sender='RECRUITER')::int as reply
   from (${projected}) x`).then(r=>r.rows),
  db.execute<Row>(sql`select * from (${filtered}) f
   order by f.occurred_at desc,f.id asc
   limit ${query.pageSize} offset ${(query.page-1)*query.pageSize}`).then(r=>r.rows),
 ]);
 const rows:TpoInboxRecord[]=page.map(row=>({
  id:row.id,source:"RECRUITER_THREADS",participantName:row.recruiter_name?.trim()||"Unnamed recruiter",
  subject:row.job_title||"General recruiter conversation",
  status:row.status==="EMPTY"?"EMPTY":row.status==="UNREAD"?"UNREAD":"READ",
  occurredAt:new Date(row.occurred_at),jobId:row.job_id,
  messageCount:Number(row.message_count),unreadCount:Number(row.unread_count),
  lastPreview:row.last_preview,waitingForYou:row.last_sender==="RECRUITER",
  companyName:row.company_name,bodySearchMatch:row.body_match,
  searchSnippet:row.search_snippet,accessEnded:row.access_ended,
 }));
 const count=Number(total?.count??0);
 return {
  summary:{total:Number(all?.total??0),reply:Number(all?.reply??0),
   unread:Number(all?.unread??0),read:Number(all?.read??0),empty:Number(all?.empty??0)},
  total:count,page:query.page,pageSize:query.pageSize,
  totalPages:Math.ceil(count/query.pageSize),items:rows,
 };
}
