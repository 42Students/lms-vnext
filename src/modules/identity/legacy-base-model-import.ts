/** Legacy BaseModel timestamps have no zone; source organization policy is IST. */
export function parseLegacyLocalIstTimestamp(source: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/.exec(source.trim());
  if (!match) return null;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]??"0");
  const ms=Number((match[7]??"").padEnd(3,"0").slice(0,3) || 0);
  if(year<1900||year>9998||hour>23||minute>59||second>59)return null;
  const dayCheck=new Date(Date.UTC(year,month-1,day));
  if(dayCheck.getUTCFullYear()!==year||dayCheck.getUTCMonth()!==month-1||dayCheck.getUTCDate()!==day)return null;
  // Legacy LocalDateTime is Asia/Kolkata wall clock, so subtract +05:30.
  return new Date(Date.UTC(year,month-1,day,hour,minute,second,ms)-330*60000);
}
/** null source deletion means active in the old DepartmentRepository. */
export function normalizeLegacySoftDelete(value: boolean|null|undefined): {archived:boolean} {
  return {archived:value===true};
}
export function sameCreatedAtOnUpdate<T extends {createdAt:Date}>(original:T, patch:Partial<T>): Partial<T> {
  const {createdAt: _ignored,...rest}=patch;
  return rest as Partial<T>;
}
