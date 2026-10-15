import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {collegeContactsExportSchema,CONTACT_EXPORT_LIMIT,renderCollegeContactCsv,appendUniqueContactExportRows} from "./college-contacts-export-model";
import {COLLEGE_CONTACTS_PAGE_SIZE} from "./college-contacts-model";
import {listCollegeContacts,type CollegeContactRow} from "./college-contacts-service";
export async function exportCollegeContactsCsv(context:RequestContext,raw:unknown){
 const filter=collegeContactsExportSchema.parse(raw),rows:CollegeContactRow[]=[];
 let total=0;
 for(let page=1;page<=Math.ceil(CONTACT_EXPORT_LIMIT/COLLEGE_CONTACTS_PAGE_SIZE);page++){
  const result=await listCollegeContacts(context,{...filter,page});
  if(page===1)total=result.total;
  appendUniqueContactExportRows(rows,result.items);
  if(result.items.length<COLLEGE_CONTACTS_PAGE_SIZE||rows.length>=total)break;
 }
 const truncated=total>CONTACT_EXPORT_LIMIT||rows.length<Math.min(total,CONTACT_EXPORT_LIMIT);
 return {csv:renderCollegeContactCsv(rows,truncated),
  total,exported:rows.length,truncated};
}
