/** Invalid timestamps must never crash the authorized Course-card grid. */
export function learnerCourseCardDate(value:string|null|undefined):string|null{
 if(!value)return null;
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return null;
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(date);
}
