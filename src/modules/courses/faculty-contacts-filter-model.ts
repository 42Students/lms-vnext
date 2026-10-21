import {z} from "zod";

export const FACULTY_CONTACTS_SEARCH_PLACEHOLDER="Search contacts...";

const schema=z.object({
 q:z.string().trim().max(200).default(""),
 page:z.string().regex(/^[1-9]\d{0,4}$/).transform(Number).prefault("1"),
 pageSize:z.enum(["10","20","50"]).transform(Number).prefault("10"),
}).strict();

/** No duplicate query selectors or forged college/role filters. */
export function parseFacultyContactsQuery(raw:unknown){
 const result=schema.safeParse(raw);
 return result.success?{
  search:result.data.q,page:result.data.page,pageSize:result.data.pageSize,
 }:null;
}
