import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {getTpoActorAudit} from "@/modules/placements/tpo-actor-audit-service";
import {tpoActorAuditCsv} from "@/modules/placements/tpo-actor-audit-model";
import {randomUUID} from "node:crypto";
import {createTpoNotice} from "@/modules/announcements/tpo-placement-write-service";
import {editTpoNotice} from "@/modules/announcements/tpo-placement-edit-service";
import {mutateTpoNotice} from "@/modules/announcements/tpo-placement-notice-lifecycle";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB10_ISOLATED_TEST_DATABASE==="1"&&
  Boolean(process.env.TEST_DATABASE_URL)&&
  process.env.DATABASE_URL===process.env.TEST_DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const alphaSubject="ux-g098-ci-alpha-event";
const betaSubject="ux-g098-ci-beta-event";
const entityType="ux_g098_evidence";

type Actor={userId:string;membershipId:string;collegeId:string;organizationId:string};
let alpha:Actor,beta:Actor;
function context(actor:Actor):RequestContext{
  return {
    user:{id:actor.userId,identityUid:"ux-g098-audit-test",platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:actor.membershipId,collegeId:actor.collegeId,
      organizationId:actor.organizationId,status:"ACTIVE",roles:["TPO"]},
  };
}
async function actorFor(email:string):Promise<Actor>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  const result=await pool.query<Actor>(`
    SELECT u.id AS "userId",m.id AS "membershipId",
           m.college_id AS "collegeId",c.organization_id AS "organizationId"
      FROM users u
      JOIN college_memberships m ON m.user_id=u.id
      JOIN colleges c ON c.id=m.college_id
      JOIN membership_roles mr ON mr.membership_id=m.id AND mr.role='TPO'
     WHERE lower(u.email)=lower($1)
     LIMIT 1`,[email]);
  if(!result.rows[0])throw new Error("Missing persisted TPO fixture membership: "+email);
  return result.rows[0];
}
describe.skipIf(!enabled)("G098 persisted actor audit and college isolation",()=>{
  beforeAll(async()=>{
    if(!pool)throw new Error("Disposable PostgreSQL required");
    alpha=await actorFor("tpo.a@vnext.test");
    beta=await actorFor("tpo.b@vnext.test");
    expect(alpha.collegeId).not.toBe(beta.collegeId);
    for(const [actor,subject] of [[alpha,alphaSubject],[beta,betaSubject]] as const){
      await pool.query(`
        INSERT INTO activity_events
          (organization_id,college_id,actor_user_id,actor_membership_id,
           module,event_type,subject_type,subject_id,summary)
        VALUES ($1,$2,$3,$4,'PLACEMENTS','placements.ux_g098.acceptance',
                $5,$6,'Verified G098 audit acceptance event')`,
        [actor.organizationId,actor.collegeId,actor.userId,
         actor.membershipId,entityType,subject]);
    }
  });
  it("reads a real stored event only in its owning college and builds a scoped CSV",async()=>{
    const own=await getTpoActorAudit(context(alpha),{entityType,entityId:alphaSubject});
    expect(own.total).toBe(1);
    expect(own.rows).toHaveLength(1);
    expect(own.rows[0]?.entityId).toBe(alphaSubject);
    const csv=tpoActorAuditCsv(own.rows);
    expect(csv).toContain(alphaSubject);
    expect(csv).not.toContain(betaSubject);
    expect((await getTpoActorAudit(context(alpha),{entityType,entityId:betaSubject})).total).toBe(0);
    expect((await getTpoActorAudit(context(beta),{entityType,entityId:alphaSubject})).total).toBe(0);
    const other=await getTpoActorAudit(context(beta),{entityType,entityId:betaSubject});
    expect(other.total).toBe(1);
    expect(other.rows[0]?.entityId).toBe(betaSubject);
  });
  it("refuses forged tenant selectors and role claims even against persisted rows",async()=>{
    await expect(getTpoActorAudit(context(alpha),{entityType,collegeId:beta.collegeId}))
      .rejects.toBeDefined();
    await expect(getTpoActorAudit({
      ...context(alpha),membership:{...context(alpha).membership!,roles:["LEARNER"]},
    },{entityType,entityId:alphaSubject})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("fails closed rather than pretending an unverified notice scheduler can send",async()=>{
    const oldStatus=process.env.TPO_NOTICE_DELIVERY_VERIFIED;
    const oldSecret=process.env.TPO_NOTICE_SCHEDULER_SECRET;
    try {
      delete process.env.TPO_NOTICE_DELIVERY_VERIFIED;
      delete process.env.TPO_NOTICE_SCHEDULER_SECRET;
      await expect(createTpoNotice(context(alpha),{
        title:"G098 unverified send "+randomUUID(),message:"Must not be stored",
        audience:"COLLEGE",
      })).rejects.toThrow("TPO_NOTICE_DELIVERY_UNVERIFIED");
    } finally {
      if(oldStatus===undefined)delete process.env.TPO_NOTICE_DELIVERY_VERIFIED;
      else process.env.TPO_NOTICE_DELIVERY_VERIFIED=oldStatus;
      if(oldSecret===undefined)delete process.env.TPO_NOTICE_SCHEDULER_SECRET;
      else process.env.TPO_NOTICE_SCHEDULER_SECRET=oldSecret;
    }
  });
  it("persists a scoped announcement lifecycle, rejects stale versions and cross-college mutations",async()=>{
    if(!pool)throw new Error("Disposable PostgreSQL required");
    const oldStatus=process.env.TPO_NOTICE_DELIVERY_VERIFIED;
    const oldSecret=process.env.TPO_NOTICE_SCHEDULER_SECRET;
    // Simulates operator readiness in this disposable test process only.
    // No scheduler executes; the test does not assert recipient delivery.
    process.env.TPO_NOTICE_DELIVERY_VERIFIED="VERIFIED";
    process.env.TPO_NOTICE_SCHEDULER_SECRET=randomUUID()+randomUUID();
    try {
      const created=await createTpoNotice(context(alpha),{
        title:"G098 persisted college notice",message:"Initial notice body",
        audience:"COLLEGE",pinned:false,
      });
      const inserted=await pool.query<{college_id:string;title:string;version:number}>(
        "SELECT college_id,title,version FROM announcements WHERE id=$1",[created.id]);
      expect(inserted.rows[0]).toMatchObject({
        college_id:alpha.collegeId,title:"G098 persisted college notice",version:created.version,
      });
      const edited=await editTpoNotice(context(alpha),{
        noticeId:created.id,expectedVersion:created.version,
        title:"G098 updated college notice",message:"Persisted updated body",pinned:true,
      });
      expect(edited.version).toBe(created.version+1);
      await expect(editTpoNotice(context(alpha),{
        noticeId:created.id,expectedVersion:created.version,
        title:"Stale overwrite",message:"Must never persist",pinned:false,
      })).rejects.toThrow("ANNOUNCEMENT_STALE");
      await expect(mutateTpoNotice(context(beta),{
        noticeId:created.id,expectedVersion:edited.version,action:"DELETE",
      })).rejects.toThrow("ANNOUNCEMENT_NOT_FOUND");
      const deleted=await mutateTpoNotice(context(alpha),{
        noticeId:created.id,expectedVersion:edited.version,action:"DELETE",
      });
      expect(deleted.version).toBe(edited.version+1);
      const withdrawn=await pool.query<{deleted_at:Date|null}>(
        "SELECT deleted_at FROM announcements WHERE id=$1",[created.id]);
      expect(withdrawn.rows[0]?.deleted_at).toBeInstanceOf(Date);
      const restored=await mutateTpoNotice(context(alpha),{
        noticeId:created.id,expectedVersion:deleted.version,action:"RESTORE",
      });
      expect(restored.version).toBe(deleted.version+1);
      const final=await pool.query<{deleted_at:Date|null;message:string;title:string;is_pinned:boolean}>(
        "SELECT deleted_at,message,title,is_pinned FROM announcements WHERE id=$1",[created.id]);
      expect(final.rows[0]).toMatchObject({
        deleted_at:null,message:"Persisted updated body",
        title:"G098 updated college notice",is_pinned:true,
      });
      const other=await pool.query<{id:string}>(
        "SELECT id FROM announcements WHERE id=$1 AND college_id=$2",
        [created.id,beta.collegeId]);
      expect(other.rowCount).toBe(0);
    } finally {
      if(oldStatus===undefined)delete process.env.TPO_NOTICE_DELIVERY_VERIFIED;
      else process.env.TPO_NOTICE_DELIVERY_VERIFIED=oldStatus;
      if(oldSecret===undefined)delete process.env.TPO_NOTICE_SCHEDULER_SECRET;
      else process.env.TPO_NOTICE_SCHEDULER_SECRET=oldSecret;
    }
  });

});
afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
