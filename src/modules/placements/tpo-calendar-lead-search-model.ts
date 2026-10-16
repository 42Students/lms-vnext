export type CalendarSearchLead={id:string;name:string;companyName:string|null;emailNorm:string|null};
/** TPO-calendar-reports-05: search every authorized lead; never truncate to the newest 100. */
export function searchTpoCalendarLeads<T extends CalendarSearchLead>(
 leads:readonly T[],raw:string,limit=30):T[]{
 const query=raw.trim().toLocaleLowerCase("en").slice(0,100);
 if(query.length<2)return [];
 return leads.filter(lead=>[lead.name,lead.companyName,lead.emailNorm].some(
  value=>value?.toLocaleLowerCase("en").includes(query),
 )).slice(0,limit);
}
