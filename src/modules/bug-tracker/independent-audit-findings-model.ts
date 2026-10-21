import {z} from "zod";
export const FINDING_STATUSES=["NEW","CONFIRMED","IN_PROGRESS","FIXED_DEV","RELEASED_PROD","VERIFIED","DUPLICATE","WONT_FIX","NEEDS_INFO","CANT_REPRODUCE"] as const;
export const FINDING_SEVERITIES=["CRITICAL","HIGH","MEDIUM","LOW"] as const;
export const FINDING_KINDS=["BUG","SECURITY","DATA","UX","COPY","PERFORMANCE","ACCESSIBILITY"] as const;
const values=<T extends string>(x:string|string[]|undefined):T[]=>x===undefined?[]:(Array.isArray(x)?x:[x]).flatMap(value=>value.split(",")).map(value=>value.trim()).filter(Boolean) as T[];
const filter=z.strictObject({
 q:z.string().trim().max(120).default(""),
 view:z.enum(["OPEN","RELEASE","ALL"]).default("OPEN"),
 statuses:z.array(z.enum(FINDING_STATUSES)).max(10),
 severities:z.array(z.enum(FINDING_SEVERITIES)).max(4),
 kinds:z.array(z.enum(FINDING_KINDS)).max(7),
 area:z.string().trim().max(80).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
});
export type FindingFilters=z.infer<typeof filter>;
export function parseIndependentFindingFilters(raw:Record<string,string|string[]|undefined>){
 if(Object.keys(raw).some(k=>!["q","view","status","severity","kind","area","page"].includes(k)))return null;
 if(["q","view","area","page"].some(k=>Array.isArray(raw[k])))return null;
 const parsed=filter.safeParse({q:raw.q,view:raw.view,area:raw.area,page:raw.page,
  statuses:values(raw.status),severities:values(raw.severity),kinds:values(raw.kind)});
 return parsed.success?parsed.data:null;
}
export function independentFindingHref(input:FindingFilters,page=input.page){
 const params=new URLSearchParams();
 if(input.q)params.set("q",input.q);
 if(input.view!=="OPEN")params.set("view",input.view);
 for(const status of input.statuses)params.append("status",status);
 for(const severity of input.severities)params.append("severity",severity);
 for(const kind of input.kinds)params.append("kind",kind);
 if(input.area)params.set("area",input.area);
 if(page>1)params.set("page",String(page));
 return "/tracker/audit-findings"+(params.size?"?"+params:"");
}
export const INDEPENDENT_AUDIT_PAGE_SIZE=50;
export const ACTIVE_FINDING_STATUSES=["NEW","CONFIRMED","IN_PROGRESS","FIXED_DEV","RELEASED_PROD","NEEDS_INFO"] as const;

/** Release blockers stop at production release; open work intentionally still
 * includes RELEASED_PROD until human verification.
 */
export const RELEASE_BLOCKER_FINDING_STATUSES=[
 "NEW","CONFIRMED","IN_PROGRESS","FIXED_DEV","NEEDS_INFO",
] as const;
