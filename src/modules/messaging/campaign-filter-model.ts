import {z} from "zod";
export const campaignFilterSchema=z.object({state:z.enum(["ALL","NEEDS_FOLLOW_UP","UNASSIGNED","QUIET","NOT_CONTACTED"]).default("ALL"),search:z.string().trim().max(100).default(""),page:z.coerce.number().int().min(1).max(10000).default(1)}).strict();
export function campaignFilterHref(raw:unknown){const d=campaignFilterSchema.parse(raw);const p=new URLSearchParams({state:d.state,page:String(d.page)});if(d.search)p.set("q",d.search);return "/tpo/recruiters?"+p.toString();}
