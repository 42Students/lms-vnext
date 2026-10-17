/** Faculty live-session inputs represent IST wall time; never interpret them in the device timezone. */
export const FACULTY_IST_QUARTER_MINUTES = ["00","15","30","45"] as const;
export const FACULTY_IST_NOTE = "Times are in India Standard Time (IST).";

export function facultyIstTimeParts(value:string) {
 const parts=/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
 if(!parts)return {date:"",hour:"",minute:"",period:"AM" as const};
 const hour24=Number(parts[2]);
 if(hour24>23 || Number(parts[3])>59)return {date:"",hour:"",minute:"",period:"AM" as const};
 return {date:parts[1]!,hour:String(hour24%12||12),minute:parts[3]!,
  period:(hour24>=12?"PM":"AM") as "AM"|"PM"};
}
export function facultyIstWallTime(date:string,hour:string,minute:string,period:"AM"|"PM"):string {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([1-9]|1[0-2])$/.test(hour)||
  !(FACULTY_IST_QUARTER_MINUTES as readonly string[]).includes(minute))return "";
 const hours=Number(hour)%12+(period==="PM"?12:0);
 return date+"T"+String(hours).padStart(2,"0")+":"+minute;
}
export function facultyIstQuarterHourIssue(local:string):string|null {
 const parts=facultyIstTimeParts(local);
 if(!parts.date)return "Choose a date and time in IST.";
 if(!(FACULTY_IST_QUARTER_MINUTES as readonly string[]).includes(parts.minute))
  return "Choose a time in 15-minute intervals (00, 15, 30 or 45 minutes).";
 return null;
}
