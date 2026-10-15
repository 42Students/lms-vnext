/** T-S2-07: retract the initial college notice publication within 30 s.
 * Calendar/scheduling UI does not extend the author-only undo deadline.
 */
export const TPO_NOTICE_UNDO_MS=30_000 as const;
export function canUndoTpoAnnouncementSend(createdAt:Date,now:Date):boolean {
 const created=createdAt.getTime(),current=now.getTime();
 return Number.isFinite(created)&&Number.isFinite(current)&&
   current>=created&&current-created<TPO_NOTICE_UNDO_MS;
}
