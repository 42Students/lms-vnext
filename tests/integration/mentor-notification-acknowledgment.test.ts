import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  getMentorPersonalInbox,
} from "@/modules/activity/mentor-notifications-service";
import {
  markAllOwnMentorNotificationsRead, markOwnMentorNotificationRead,
} from "@/modules/activity/mentor-notification-read-service";
import {markAllMentorUnifiedNotificationsRead} from
  "@/modules/projects/mentor-unified-notification-read-all-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL) {
  throw new Error("Mentor notification acknowledgment requires disposable TEST_DATABASE_URL");
}
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const suffix=randomUUID().replaceAll("-","");
const userId=randomUUID();
const membershipId=randomUUID();
const roleId=randomUUID();
const eventIds=[randomUUID(),randomUUID(),randomUUID()];
const notificationIds=[randomUUID(),randomUUID(),randomUUID()];
const actor:RequestContext={
  user:{
    id:userId,identityUid:"chat4-mentor-inbox-"+suffix,
    platformStatus:"ACTIVE",systemRoles:[],
  },
  membership:{
    id:membershipId,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["MENTOR"],
  },
};
async function cleanup() {
  await pool.query("delete from in_app_notifications where id = any($1::uuid[])",[notificationIds]);
  await pool.query(`delete from activity_events
    where actor_user_id=$1 and event_type='identity.mentor_notification.acknowledged'`,[userId]);
  await pool.query("delete from activity_events where id=any($1::uuid[])",[eventIds]);
  await pool.query("delete from membership_roles where id=$1",[roleId]);
  await pool.query("delete from college_memberships where id=$1",[membershipId]);
  await pool.query("delete from users where id=$1",[userId]);
}
afterAll(async()=>{
  try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}
});
async function fixture() {
  await cleanup();
  await pool.query(`insert into users(id,identity_uid,email,display_name,platform_status)
    values ($1,$2,$3,$4,'ACTIVE')`,[
      userId,actor.user.identityUid,
      "chat4-mentor-inbox-"+suffix+"@example.invalid",
      "Chat4 Mentor Inbox "+suffix,
    ]);
  await pool.query(`insert into college_memberships(id,user_id,college_id,status)
    values ($1,$2,$3,'ACTIVE')`,[membershipId,userId,SEED_IDS.collegeA]);
  await pool.query(`insert into membership_roles(id,membership_id,role)
    values ($1,$2,'MENTOR')`,[roleId,membershipId]);
  const collegeB=await pool.query<{organization_id:string}>(
    "select organization_id from colleges where id=$1",[SEED_IDS.collegeB],
  );
  const orgB=collegeB.rows[0]?.organization_id;
  if(!orgB) throw new Error("Seed College B missing");
  for(let i=0;i<3;i++) {
    const college=i===2?SEED_IDS.collegeB:SEED_IDS.collegeA;
    const org=i===2?orgB:SEED_IDS.organization;
    await pool.query(`insert into activity_events
      (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary,metadata)
      values ($1,$2,$3,$4,'ACADEMICS','academics.program.created','test_notification',$5,$6,'{}'::jsonb)`,[
        eventIds[i],org,college,SEED_IDS.collegeAdminUser,
        suffix+"-"+i,"Chat4 unique Mentor notification fixture",
      ]);
    await pool.query(`insert into in_app_notifications
      (id,user_id,event_id,title,body) values ($1,$2,$3,$4,$5)`,[
        notificationIds[i],userId,eventIds[i],
        "Chat4 Mentor notification "+suffix+"-"+i,"Fixture message",
      ]);
  }
}
describe("Mentor inbox persisted same-college acknowledgments",()=>{
  it("marks current-college notifications exactly once and fences foreign/suspended/forged actors",async()=>{
    await fixture();
    const initial=await getMentorPersonalInbox(actor,{view:"unread"});
    expect(initial.page.items.map(row=>row.notification.id))
      .toEqual(expect.arrayContaining(notificationIds.slice(0,2)));
    expect(initial.page.items.some(row=>row.notification.id===notificationIds[2])).toBe(false);
    const first=await markOwnMentorNotificationRead(actor,notificationIds[0]);
    expect(first.id).toBe(notificationIds[0]);
    expect(first.readAt).toBeInstanceOf(Date);
    const repeated=await markOwnMentorNotificationRead(actor,notificationIds[0]);
    expect(repeated.readAt).toBeInstanceOf(Date);
    await expect(markOwnMentorNotificationRead(actor,notificationIds[2]))
      .rejects.toBeDefined();
    const suspended:RequestContext={
      ...actor,membership:{...actor.membership!,status:"SUSPENDED"},
    };
    await expect(markOwnMentorNotificationRead(suspended,notificationIds[1]))
      .rejects.toBeDefined();
    const wrongRole:RequestContext={
      ...actor,membership:{...actor.membership!,roles:["LEARNER"]},
    };
    await expect(markAllOwnMentorNotificationsRead(wrongRole)).rejects.toBeDefined();
    const foreign:RequestContext={
      ...actor,membership:{...actor.membership!,collegeId:SEED_IDS.collegeB},
    };
    await expect(markAllOwnMentorNotificationsRead(foreign)).rejects.toBeDefined();
    const bulk=await markAllOwnMentorNotificationsRead(actor);
    expect(bulk).toEqual({markedRead:1});
    expect(await markAllOwnMentorNotificationsRead(actor)).toEqual({markedRead:0});
    const unread=await getMentorPersonalInbox(actor,{view:"unread"});
    expect(unread.unreadCount).toBe(0);
    expect(unread.page.items).toEqual([]);
    const rows=await pool.query<{id:string;read_at:Date|null}>(`select id,read_at
      from in_app_notifications where id=any($1::uuid[])`,[notificationIds]);
    expect(rows.rows.find(row=>row.id===notificationIds[2])?.read_at).toBeNull();
    const audits=await pool.query<{
      subject_type:string;college_id:string;actor_user_id:string;
      metadata:Record<string,unknown>;
    }>(`select subject_type,college_id,actor_user_id,metadata
      from activity_events where actor_user_id=$1
        and event_type='identity.mentor_notification.acknowledged'`,[userId]);
    expect(audits.rows).toHaveLength(2);
    expect(audits.rows.map(row=>row.subject_type).sort()).toEqual([
      "in_app_notification","mentor_notification_inbox",
    ]);
    for(const row of audits.rows) {
      expect(row.college_id).toBe(SEED_IDS.collegeA);
      expect(row.actor_user_id).toBe(userId);
      expect(row.metadata).toEqual({count:1});
    }
  it("atomically acknowledges all personal messages alongside the unified source scan",async()=>{
    await fixture();
    const result=await markAllMentorUnifiedNotificationsRead(actor);
    expect(result.markedPersonal).toBe(2);
    expect(result.completeForCurrentVisibleSources).toBe(true);
    expect(result.markedSources).toBeGreaterThanOrEqual(0);
    const repeat=await markAllMentorUnifiedNotificationsRead(actor);
    expect(repeat.markedPersonal).toBe(0);
    expect(repeat.markedSources).toBe(0);
    const remaining=await getMentorPersonalInbox(actor,{view:"unread"});
    expect(remaining.unreadCount).toBe(0);
    const other=await pool.query<{read_at:Date|null}>(`
      select read_at from in_app_notifications where id=$1`,[notificationIds[2]]);
    expect(other.rows[0]?.read_at).toBeNull();
    const wrongCollege:RequestContext={...actor,
      membership:{...actor.membership!,collegeId:SEED_IDS.collegeB}};
    await expect(markAllMentorUnifiedNotificationsRead(wrongCollege))
      .rejects.toBeDefined();
  });
  });
});