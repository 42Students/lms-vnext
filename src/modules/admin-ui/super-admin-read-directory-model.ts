import { z } from "zod";
export const SUPER_ADMIN_READ_PAGE_SIZE = 25;
export const superAdminReadQuerySchema = z.strictObject({
 q: z.string().trim().max(100).default(""),
 status: z.enum(["ALL","ACTIVE","INACTIVE","PLANNED","COMPLETED","ARCHIVED","ENDED","SUSPENDED","SUBMITTED","WITHDRAWN"]).default("ALL"),
 page: z.coerce.number().int().min(1).max(1000).default(1),
});
export type SuperAdminReadQuery = z.infer<typeof superAdminReadQuerySchema>;
export type SuperAdminReadRow = {
 id:string; title:string; subtitle:string; details:readonly string[];
 status:string; href?:string;
};
export type SuperAdminReadResult = {
 query:SuperAdminReadQuery; total:number; totalPages:number; items:SuperAdminReadRow[];
};
export function superAdminReadPages(total:number) {
 return Math.max(1,Math.ceil(total/SUPER_ADMIN_READ_PAGE_SIZE));
}
export function superAdminReadHref(path:string,query:SuperAdminReadQuery) {
 const params=new URLSearchParams();
 if(query.q)params.set("q",query.q);
 if(query.status!=="ALL")params.set("status",query.status);
 if(query.page>1)params.set("page",String(query.page));
 return path+(params.size?"?"+params:"");
}
export function readAdminQuery(raw:Record<string,string|string[]|undefined>) {
 return superAdminReadQuerySchema.safeParse({q:raw.q,status:raw.status,page:raw.page});
}
export function scopedSearchLike(q:string) {
 return "%"+q.replace(/[\\%_]/g,"\\$&")+"%";
}
