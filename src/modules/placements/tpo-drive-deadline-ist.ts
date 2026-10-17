/** datetime-local is a wall-clock value, not the browser's local timezone. */
export function driveDeadlineIstToIso(value:string):string{
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
 if(!match)throw new Error("Enter a valid application deadline in IST.");
 const [,y,mo,d,h,mi]=match;
 const year=Number(y),month=Number(mo),day=Number(d),hour=Number(h),minute=Number(mi);
 if(year<2000||year>9999)throw new Error("Enter a valid application deadline in IST.");
 const wall=Date.UTC(year,month-1,day,hour,minute);
 const check=new Date(wall);
 if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day||check.getUTCHours()!==hour||check.getUTCMinutes()!==minute)
  throw new Error("Enter a valid application deadline in IST.");
 return new Date(wall-330*60_000).toISOString();
}

/** TPO-drives-45: explicit 11:59 PM IST end-of-day choice, never browser-local. */
export function driveDeadlineIstEndOfDay(value:string):string{
 driveDeadlineIstToIso(value);
 return value.slice(0,10)+"T23:59";
}
