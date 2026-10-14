/** datetime-local controls represent IST wall time, independent of the device. */
export function authoringLocalDateTime(instant: string | Date | null): string {
  if (!instant) return "";
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 16);
}

export function authoringDueInstant(local: string): string | null {
  if (!local) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) || local.startsWith("0000-"))
    throw new Error("Choose a valid due date in IST.");
  const date = new Date(local + ":00+05:30");
  if (!Number.isFinite(date.getTime()) || authoringLocalDateTime(date) !== local)
    throw new Error("Choose a valid due date in IST.");
  return date.toISOString();
}
export function assignmentActionAvailable(status:string|null,action:"CREATE"|"EDIT"|"PUBLISH"|"ARCHIVE"){
 if(action==="CREATE")return status===null;
 if(status===null||status==="ARCHIVED")return false;
 if(action==="EDIT"||action==="PUBLISH")return status==="DRAFT";
 return status==="DRAFT"||status==="PUBLISHED";
}
