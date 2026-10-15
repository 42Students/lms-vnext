import {z} from "zod";
import type {PlatformSettingsSection} from "./model";
export const adminInventoryFilterSchema=z.strictObject({
 q:z.string().trim().max(100).default(""),
 section:z.enum(["ALL","course-progress","attendance","placements","sms","operations"]).default("ALL"),
});
export type AdminInventoryFilter=z.infer<typeof adminInventoryFilterSchema>;
export function filterPlatformInventory(sections:readonly PlatformSettingsSection[],filter:AdminInventoryFilter):PlatformSettingsSection[] {
 const needle=filter.q.toLocaleLowerCase("en-IN");
 return sections.filter(s=>filter.section==="ALL"||s.id===filter.section).map(section=>({
  ...section,
  items:section.items.filter(item=>[item.label,item.source].some(value=>value.toLocaleLowerCase("en-IN").includes(needle))),
  smsTemplates:section.smsTemplates?.filter(t=>[t.key,t.purpose,t.source].some(value=>value.toLocaleLowerCase("en-IN").includes(needle))),
 })).filter(section=>!needle||section.items.length>0||(section.smsTemplates?.length??0)>0);
}
