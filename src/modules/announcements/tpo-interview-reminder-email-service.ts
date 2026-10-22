import "server-only";
import {createHash} from "node:crypto";

import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {sendZeptoMailTemplate} from "@/modules/notifications/zeptomail-email";
import {tomorrowInIndiaUtcWindow,type ScheduledJobFence}
 from "@/modules/operations/scheduled-job-runner";

type ReminderRow={
 slot_id:string;slot_version:number;user_id:string;
 application_id:string;college_id:string;organization_id:string;
 starts_at:Date;job_title:string;company_name:string;round_name:string;round_description:string|null;
 mode:string|null;room:string;meeting_url:string|null;what_to_bring:string|null;
 recipient_email:string;recipient_name:string;
};
const MAX_SENDS=200;
const dateInIndia=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
}).format(date);
const timeInIndia=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
}).format(date);

function addressOf(row:ReminderRow){
 const room=row.room?.trim()??"";
 const url=row.meeting_url?.trim()??"";
 if(row.mode==="VIRTUAL"&&/^https:\/\//i.test(url))return "Online: "+url;
 if(room)return room.slice(0,240);
 if(/^https:\/\//i.test(url))return "Online: "+url;
 return "Venue to be confirmed";
}

/**
 * 19:00 IST interview reminder EMAIL companion to the existing fenced
 * IN_APP producer. Unlike 08:00 same-day nudges, only tomorrow's interviews
 * get EMAIL, and only verified active enrolled learner+BOOKED slots qualify.
 * The saved slot time/room (fallback round venue) is authoritative. Every
 * reschedule increments the version and creates a distinct reminder key.
 *
 * Email cannot safely share the IN_APP outbox: its recipientSelection is
 * explicitly EXPLICIT_USER, not encrypted email. Until a dedicated encrypted
 * external-channel outbox is migrated, attempts are at-most-once, claiming a
 * durable per-slot/version/user key BEFORE the provider call. A timeout is
 * UNKNOWN, not proof of non-delivery; automatic retry could double-email.
 * Fail closed without dedicated release/provisioning opt-in.
 */
export async function queueFencedInterviewReminderEmails(
 fence:ScheduledJobFence,now=new Date(),
):Promise<{accepted:number;notAccepted:number;reserved:number;hasMore:boolean}>{
 if(fence.lease.jobName!=="tpo.interviewReminders")
  throw new Error("INVALID_TPO_INTERVIEW_EMAIL_LEASE");
 if(!Number.isFinite(now.getTime()))
  throw new Error("INVALID_TPO_INTERVIEW_EMAIL_TIME");
 const localHour=new Date(now.getTime()+330*60_000).getUTCHours();
 if(localHour<19)return {accepted:0,notAccepted:0,reserved:0,hasMore:false};
 if(process.env["TPO_INTERVIEW_EMAIL_READY"]!=="VERIFIED"||
    process.env["DB10_NOTIFICATION_SCHEDULER_READY"]!=="DB10_VERIFIED"||
    process.env["ZEPTOMAIL_LEGACY_KEY_REVOKED"]!=="confirmed")
  throw new Error("INTERVIEW_EMAIL_UNPROVISIONED");
 const {from,to}=tomorrowInIndiaUtcWindow(now);
 await fence.assertCurrent();
 const rows=await getDb().execute<ReminderRow>(sql`
  select s.id as slot_id,s.version as slot_version,
    m.user_id,a.id as application_id,c.id as college_id,c.organization_id,
    s.starts_at,j.title as job_title,company.name as company_name,
    r.name as round_name,s.legacy_round_description as round_description,
    r.mode,coalesce(nullif(s.room,''),r.venue,'') as room,
    r.meeting_url,r.what_to_bring,u.email as recipient_email,
    coalesce(nullif(u.display_name,''),'Learner') as recipient_name
  from placement_round_candidate_slots s
  join placement_job_rounds r on r.id=s.round_id and r.job_id=s.job_id
    and r.kind='INTERVIEW' and r.status='SCHEDULED'
  join placement_jobs j on j.id=s.job_id and j.status in ('PUBLISHED','CLOSED')
  join placement_company_relationships rel on rel.id=j.company_relationship_id
    and rel.college_id=j.college_id and rel.status='ACTIVE'
  join placement_companies company on company.id=rel.company_id
    and company.status='ACTIVE'
  join colleges c on c.id=j.college_id and c.status='ACTIVE'
  join organizations o on o.id=c.organization_id and o.status='ACTIVE'
  join placement_applications a on a.id=s.application_id and a.job_id=j.id
    and a.status='SUBMITTED'
  join college_memberships m on m.id=a.membership_id
    and m.college_id=c.id and m.status='ACTIVE'
  join membership_roles role on role.membership_id=m.id and role.role='LEARNER'
  join users u on u.id=m.user_id and u.platform_status='ACTIVE'
  where s.status='BOOKED' and s.interview_outcome is null
    and s.starts_at >= ${from} and s.starts_at < ${to}
    and s.starts_at > ${now}
    and u.email is not null and length(trim(u.email))>2
    and exists (
      select 1 from activity_events app_event
      join in_app_notifications notice on notice.event_id=app_event.id
      where notice.user_id=m.user_id
        and app_event.dedupe_key =
         'scheduler:interview:TOMORROW:'||s.id::text||':'||
            s.version::text||':'||m.user_id::text
    )
    and not exists (
      select 1 from activity_events email_event
      where email_event.dedupe_key =
       'scheduler:interview-email:TOMORROW:'||s.id::text||':'||
         s.version::text||':'||m.user_id::text
    )
  order by s.starts_at,s.id,m.user_id
  limit 201
 `);
 let reserved=0,accepted=0,notAccepted=0;
 for(const row of rows.rows.slice(0,MAX_SENDS)){
  await fence.assertCurrent();
  const dedupe="scheduler:interview-email:TOMORROW:"+
   row.slot_id+":"+row.slot_version+":"+row.user_id;
  // Atomically prove that this is still the current BOOKED/rescheduled slot
  // and hold the live worker's fence across the reservation. No provider
  // call runs while a database transaction is open.
  const claim=await getDb().transaction(async tx=>{
   const lease=await tx.execute<{job_name:string}>(sql`
    select job_name from scheduled_job_leases
    where job_name=${fence.lease.jobName}
      and locked_by=${fence.lease.holderId}
      and fence=${fence.lease.fence}
      and locked_until>clock_timestamp() for share
   `);
   if(!lease.rows[0])throw new Error("INTERVIEW_EMAIL_LEASE_LOST");
   const live=await tx.execute<{valid:boolean}>(sql`
    select exists(
      select 1 from placement_round_candidate_slots s
      join placement_applications a on a.id=s.application_id
        and a.job_id=s.job_id and a.status='SUBMITTED'
      join college_memberships m on m.id=a.membership_id
        and m.college_id=${row.college_id} and m.status='ACTIVE'
      join membership_roles role on role.membership_id=m.id and role.role='LEARNER'
      join users u on u.id=m.user_id and u.platform_status='ACTIVE'
      join placement_job_rounds r on r.id=s.round_id
        and r.job_id=s.job_id and r.kind='INTERVIEW' and r.status='SCHEDULED'
      join placement_jobs j on j.id=s.job_id and j.status in ('PUBLISHED','CLOSED')
      where s.id=${row.slot_id}::uuid and s.version=${row.slot_version}
        and s.status='BOOKED' and s.interview_outcome is null
        and m.user_id=${row.user_id}::uuid
        and u.email=${row.recipient_email}
        and s.starts_at=${row.starts_at}
        and s.starts_at>${now}
    ) as valid
   `);
   if(!live.rows[0]?.valid)return null;
   const inserted=await tx.execute<{id:string}>(sql`
    insert into activity_events (
      organization_id,college_id,module,event_type,importance,
      subject_type,subject_id,summary,metadata,dedupe_key
    ) values (${row.organization_id}::uuid,${row.college_id}::uuid,
     'PLACEMENTS','INTERVIEW_REMINDER_EMAIL','NORMAL',
     'placement_round_candidate_slot',${row.slot_id},
     'Interview reminder email attempted',
     jsonb_build_object('slotId',${row.slot_id},'applicationId',${row.application_id},
       'slotVersion',${row.slot_version},'channel','EMAIL',
       'providerStatus','UNKNOWN_UNTIL_CONFIRMED'),${dedupe})
    on conflict (dedupe_key) where dedupe_key is not null do nothing
    returning id
   `);
   return inserted.rows[0]?.id??null;
  });
  if(!claim)continue;
  reserved++;
  const location=addressOf(row);
  const outcome=await sendZeptoMailTemplate({
   purpose:{kind:"EVENT",event:"INTERVIEW_REMINDER"},
   toEmail:row.recipient_email,
   recipientName:row.recipient_name,
   idempotencyKey:"tpo-interview:"+createHash("sha256").update(dedupe).digest("hex"),
   mergeInfo:{
    learnerName:row.recipient_name,
    jobTitle:row.job_title.slice(0,200),
    companyName:row.company_name.slice(0,200),
    applicationId:row.application_id,
    interviewDate:dateInIndia(row.starts_at),
    interviewTime:timeInIndia(row.starts_at)+" IST",
    interviewMode:row.mode==="VIRTUAL"?"Virtual":"On campus",
    interviewLocation:location,
    roundDescription:(row.round_description?.trim()||row.round_name).slice(0,200),
    whatToBring:row.what_to_bring?.trim()||"Nothing specific",
   },
  });
  if(outcome.accepted)accepted++;
  else notAccepted++;
  // The event records provider acceptance, never inbox delivery. A timeout
  // stays UNKNOWN and is not automatically replayed.
  await getDb().execute(sql`
   update activity_events
   set metadata=metadata || jsonb_build_object(
    'providerStatus',${outcome.accepted?"ACCEPTED":
     outcome.code==="PROVIDER_UNAVAILABLE"?"UNKNOWN":"NOT_ACCEPTED"},
    'safeFailureCode',${outcome.accepted?null:outcome.code},
    'attemptedAt',clock_timestamp()
   )
   where id=${claim}::uuid and dedupe_key=${dedupe}
  `);
  if(reserved%20===0)await fence.renew();
 }
 return {accepted,notAccepted,reserved,hasMore:rows.rows.length>MAX_SENDS};
}
