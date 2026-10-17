/** Course discussions are college-local conversations; show an unambiguous IST
 * timestamp and avoid raw, untrusted strings in time labels. */
export function learnerDiscussionTimeLabel(value: string): string {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric",
    minute: "2-digit", timeZone: "Asia/Kolkata", timeZoneName: "short",
  }).format(instant);
}

/** Relative chat time; preserve full IST timestamp as the hover title. */
export function learnerDiscussionRelativeTimeLabel(value:string,nowMs:number):string{
 const elapsed=nowMs-Date.parse(value);
 if(!Number.isFinite(elapsed)||elapsed<0)return learnerDiscussionTimeLabel(value);
 const minutes=Math.floor(elapsed/60_000);
 if(minutes<1)return "Just now";
 if(minutes<60)return minutes+"m ago";
 const hours=Math.floor(minutes/60);
 if(hours<24)return hours+"h ago";
 const days=Math.floor(hours/24);
 if(days<7)return days+"d ago";
 return learnerDiscussionTimeLabel(value);
}
