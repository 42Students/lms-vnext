/** T-S2-07: time inputs are local India civil time (Asia/Kolkata, UTC+05:30).
 * Never use server-local timezone, Date.parse's forgiving rollover or a
 * caller-supplied UTC offset for persisted announcements.
 */
const LOCAL=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
export function parseTpoIstMinute(raw:string|null|undefined):Date|null{
 if(raw===null||raw===undefined||raw==="")return null;
 const m=LOCAL.exec(raw);
 if(!m)throw new Error("TPO_NOTICE_INVALID_TIME");
 const [year,month,day,hour,minute]=m.slice(1).map(Number);
 if(year!<2000||year!>2100||month!<1||month!>12||day!<1||day!>31||
   hour!<0||hour!>23||minute!<0||minute!>59)throw new Error("TPO_NOTICE_INVALID_TIME");
 const timestamp=Date.UTC(year!,month!-1,day!,hour!,minute!)-330*60_000;
 const value=new Date(timestamp),roundtrip=new Date(timestamp+330*60_000);
 if(!Number.isFinite(timestamp)||roundtrip.getUTCFullYear()!==year||
   roundtrip.getUTCMonth()+1!==month||roundtrip.getUTCDate()!==day||
   roundtrip.getUTCHours()!==hour||roundtrip.getUTCMinutes()!==minute){
  throw new Error("TPO_NOTICE_INVALID_TIME");
 }
 return value;
}
export function parseTpoNoticeSchedule(input:{sendAt?:string|null;showUntil?:string|null},now:Date){
 if(!Number.isFinite(now.getTime()))throw new Error("TPO_NOTICE_INVALID_TIME");
 const scheduledAt=parseTpoIstMinute(input.sendAt),expiresAt=parseTpoIstMinute(input.showUntil);
 if(scheduledAt&&scheduledAt.getTime()<now.getTime()-60_000)
   throw new Error("TPO_NOTICE_INVALID_TIME");
 if(expiresAt&&expiresAt.getTime()<=Math.max(now.getTime(),
   scheduledAt?.getTime()??now.getTime()))throw new Error("TPO_NOTICE_INVALID_TIME");
 return {scheduledAt,expiresAt};
}
