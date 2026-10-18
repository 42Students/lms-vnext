import {parseCollegeIstLocal} from "./college-ist-datetime-model";

export type AdminContentTimeZone="Asia/Kolkata"|"UTC";

/** datetime-local values carry no zone. Reject normalized impossible dates
 * rather than allowing the browser's Date parser to move a meeting silently. */
export function parseAdminContentLocalMoment(
 value:string,zone:AdminContentTimeZone,
):string|null{
 if(zone==="Asia/Kolkata")return parseCollegeIstLocal(value);
 if(zone!=="UTC"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(value))return null;
 const year=Number(value.slice(0,4));
 if(year<2000||year>9999)return null;
 const ms=Date.parse(value+":00Z");
 if(!Number.isFinite(ms))return null;
 const normalized=new Date(ms).toISOString();
 return normalized.slice(0,16)===value?normalized:null;
}
