/** Explicit previous calendar-year IST boundaries, not a sliding 365 days. */
export function recruiterPreviousIstCalendarYear(now:Date){
 const fields=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric"})
  .formatToParts(now);
 const current=Number(fields.find(part=>part.type==="year")?.value);
 if(!Number.isInteger(current)||current<2002||current>2101)
  throw new Error("INVALID_REPORT_DATE");
 const year=current-1;
 return {year,start:new Date(year+"-01-01T00:00:00+05:30"),
  end:new Date(current+"-01-01T00:00:00+05:30")};
}
export type RecruiterHistoricalOfferRow={
 id:string;student:string;role:string;status:string;joiningStatus:string|null;
 joiningDate:string|null;
};
export function recruiterHistoricalOfferStatus(value:string){
 return {ISSUED:"Awaiting reply",ACCEPTED:"Accepted",DECLINED:"Declined",
  EXPIRED:"Expired",WITHDRAWN:"Withdrawn"}[value]??"Unavailable";
}
export function recruiterHistoricalJoiningLabel(
 status:string|null,joiningDate:string|null,
){
 if(status==="JOINED")return joiningDate?"Joined "+joiningDate:"Joined";
 if(status==="DEFERRED")return joiningDate?"Deferred to "+joiningDate:"Deferred";
 if(status==="DID_NOT_JOIN")return "Did not join";
 return "Not recorded";
}
