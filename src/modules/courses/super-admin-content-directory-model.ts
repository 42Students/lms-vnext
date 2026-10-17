import { z } from "zod";
export const ADMIN_CONTENT_PAGE_SIZE = 25;
export const adminContentKindSchema = z.enum(["VIDEOS","RESOURCES","LIVE_CLASSES"]);
export type AdminContentKind = z.infer<typeof adminContentKindSchema>;
export const adminContentQuerySchema = z.strictObject({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","DRAFT","PUBLISHED","ARCHIVED"]).default("ALL"),
 offeringId:z.string().uuid().optional(),
 lessonId:z.string().uuid().optional(),
 deliveryId:z.string().uuid().optional(),
 scope:z.enum(["ALL","SHARED","SECTION"]).default("ALL"),
 page:z.coerce.number().int().min(1).max(1000).default(1),
});
export function contentTypesForKind(kind:AdminContentKind) {
 return kind==="VIDEOS"?["VIDEO","YOUTUBE"] as const:
  kind==="RESOURCES"?["RESOURCE"] as const:["LIVE_CLASS"] as const;
}
export const ADMIN_CONTENT_LABELS:Record<AdminContentKind,string>={
 VIDEOS:"Videos",RESOURCES:"Resources",LIVE_CLASSES:"Live classes",
};
export function adminContentHref(kind:AdminContentKind,raw:unknown) {
 const query=adminContentQuerySchema.parse(raw),p=new URLSearchParams();
 if(query.q)p.set("q",query.q);
 if(query.status!=="ALL")p.set("status",query.status);
 if(query.offeringId)p.set("offeringId",query.offeringId);
 if(query.lessonId)p.set("lessonId",query.lessonId);
 if(query.deliveryId)p.set("deliveryId",query.deliveryId);
 if(query.scope!=="ALL")p.set("scope",query.scope);
 if(query.page>1)p.set("page",String(query.page));
 const base=kind==="VIDEOS"?"/admin/videos":kind==="RESOURCES"?"/admin/resources":"/admin/live-classes";
 return base+(p.size?"?"+p:"");
}
export function adminContentPages(total:number) {
 return Math.max(1,Math.ceil(total/ADMIN_CONTENT_PAGE_SIZE));
}
export function adminContentTypeLabel(type:string) {
 return type==="YOUTUBE"?"YouTube Video":type==="VIDEO"?"Video (Upload)":
  type==="RESOURCE"?"Resource":type==="LIVE_CLASS"?"Live class":"Unknown content";
}
