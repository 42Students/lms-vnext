/** Calendar month is a date-only value, not a browser-local midnight instant. */
export function parseMonth(value:string):Date {
 const match=/^(20\d{2}|21\d{2})-(0[1-9]|1[0-2])$/.exec(value);
 if(!match)throw new Error("Invalid attendance calendar month");
 return new Date(Date.UTC(Number(match[1]),Number(match[2])-1,1,12));
}
export function monthKey(value:Date):string {
 return `${value.getUTCFullYear()}-${String(value.getUTCMonth()+1).padStart(2,"0")}`;
}
export function shiftMonth(value:Date,delta:number):Date {
 return new Date(Date.UTC(value.getUTCFullYear(),value.getUTCMonth()+Math.trunc(delta),1,12));
}
