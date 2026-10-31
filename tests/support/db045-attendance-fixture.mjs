/**
 * DB045 disposable-PG17 test fixture only. Never use from product modules.
 * Real tests must insert the current row AND its immutable MARK event together.
 * Scoped cleanup temporarily disables append-only triggers only on a disposable
 * postgres connection, then restores them before deleting any parent rows.
 */
import { assertDb018DisposableTarget } from "./db018-test-target.mjs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireDisposable() {
  assertDb018DisposableTarget(process.env, { serviceBound: true });
}

export async function insertDisposableAttendanceMark(pool, args) {
  requireDisposable();
  const fields = [
    args.scheduleEventId,args.deliveryId,args.membershipId,
    args.collegeId,args.actorUserId,
  ];
  if (!fields.every(value=>typeof value==="string"&&uuid.test(value)) ||
      (args.actorMembershipId!==null &&
       (typeof args.actorMembershipId!=="string"||!uuid.test(args.actorMembershipId))) ||
      !["FACULTY","COLLEGE_ADMIN","SUPER_ADMIN"].includes(args.actorRole) ||
      !["PRESENT","ABSENT","EXCUSED","MEDICAL","LATE"].includes(args.status) ||
      (args.actorRole==="SUPER_ADMIN")!==(args.actorMembershipId===null) ||
      (args.note!==undefined && args.note!==null &&
       (typeof args.note!=="string"||args.note.length>1000))) {
    throw new Error("DB045 disposable attendance fixture rejected unreviewed identity/status");
  }
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const {rows:[record]}=await client.query(
      `INSERT INTO attendance_records
       (schedule_event_id,membership_id,status,note,marked_by_user_id)
       VALUES($1,$2,$3,$4,$5)
       RETURNING id,marked_at,version,note`,
      [args.scheduleEventId,args.membershipId,args.status,args.note??null,args.actorUserId],
    );
    await client.query(
      `INSERT INTO attendance_record_events (
        attendance_record_id,schedule_event_id,delivery_id,membership_id,
        college_id,actor_user_id,actor_membership_id,actor_role,action,
        previous_status,new_status,previous_note,new_note,
        previous_marked_by_user_id,new_marked_by_user_id,
        previous_marked_at,new_marked_at,
        record_version_before,record_version_after
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'MARK',
         NULL,$9,NULL,$10,NULL,$6,NULL,
         (SELECT marked_at FROM attendance_records WHERE id=$1::uuid),NULL,$11)`,
      [record.id,args.scheduleEventId,args.deliveryId,args.membershipId,
       args.collegeId,args.actorUserId,args.actorMembershipId,args.actorRole,
       args.status,record.note,record.version],
    );
    await client.query("COMMIT");
    return record;
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>{});
    throw error;
  } finally { client.release(); }
}

export async function deleteDisposableAttendanceEvents(pool, scheduleEventIds) {
  requireDisposable();
  if (!Array.isArray(scheduleEventIds) || scheduleEventIds.length>200 ||
      !scheduleEventIds.every(id=>typeof id==="string"&&uuid.test(id))) {
    throw new Error("DB045 fixture teardown refuses unbounded history deletion");
  }
  if (scheduleEventIds.length===0)return;
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL session_replication_role = replica");
    await client.query(
      "DELETE FROM attendance_record_events WHERE schedule_event_id = ANY($1::uuid[])",
      [scheduleEventIds],
    );
    await client.query("SET LOCAL session_replication_role = origin");
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>{});
    throw error;
  } finally { client.release(); }
}
