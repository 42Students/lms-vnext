/** Legacy inbox timestamp buckets in the college's IST timezone. */
export function formatTpoInboxTime(at: Date, now: Date):string {
  const dateKey=(value:Date)=>new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(value);
  const today=dateKey(now);
  const yesterday=dateKey(new Date(now.getTime()-86_400_000));
  const recorded=dateKey(at);
  if(recorded===today)return new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
  }).format(at);
  if(recorded===yesterday)return "Yesterday";
  return new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",day:"numeric",month:"short",
  }).format(at);
}
