/** GR-75, TPO-inbox-team-28/63: unread counters are confirmed nonnegative integers,
 * never inferred from rejected API payloads or a failed request. */
export type TpoShellCounters={requests:number;messages:number;notifications:number;team:number|null};
export function safeTpoShellCounters(value:unknown):TpoShellCounters|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const row=value as Record<string,unknown>;
 const valid=(num:unknown):num is number=>typeof num==="number"&&Number.isSafeInteger(num)&&num>=0;
 if(!valid(row["requests"])||!valid(row["messages"])||!valid(row["notifications"])||
    (row["team"]!==null&&!valid(row["team"])))return null;
 return {requests:row["requests"],messages:row["messages"],notifications:row["notifications"],team:row["team"]};
}
export function shellUnreadBadge(count:number|null):string|null{
 return count===null||!Number.isSafeInteger(count)||count<=0?null:count>99?"99+":String(count);
}
