/** RFC5545 download for one booked candidate interview, no private attendee details. */
function isoUtc(value:Date){return value.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");}
function escapeIcs(value:string){return value.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n")
 .replace(/,/g,"\\,").replace(/;/g,"\\;");}
export function collegeInterviewIcs(input:{
 id:string;title:string;date:string;durationMinutes:number;location:string|null;
}){
 const from=new Date(input.date);
 // TPO-drive-workspace-44: exported calendar helpers can be called outside
 // route-level validation. Never leak RangeError or emit invalid date fields.
 if(!Number.isFinite(from.getTime())||!Number.isSafeInteger(input.durationMinutes)||
    input.durationMinutes<1||input.durationMinutes>1440)
  throw new Error("Invalid interview calendar details");
 const until=new Date(from.getTime()+input.durationMinutes*60000);
 if(!Number.isFinite(until.getTime()))throw new Error("Invalid interview calendar details");
 return [
  "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//42Students//College Interviews//EN",
  "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
  "UID:"+escapeIcs(input.id)+"@42students", "DTSTAMP:"+isoUtc(from),
  "DTSTART:"+isoUtc(from),"DTEND:"+isoUtc(until),
  "SUMMARY:"+escapeIcs(input.title),
  "LOCATION:"+escapeIcs(input.location??""),
  "END:VEVENT","END:VCALENDAR","",
 ].join("\r\n");
}
