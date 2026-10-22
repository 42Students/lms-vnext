import { z } from "zod";
/** Video/Live source tables default to 10; the old resources table to 15.
 * Keep a bounded size changer rather than loading the entire lesson tree. */
export const ADMIN_CONTENT_PAGE_SIZE = 10;
export const ADMIN_RESOURCE_PAGE_SIZE = 15;
export const ADMIN_CONTENT_PAGE_OPTIONS = [10,15,25,50,100] as const;
export function adminContentDefaultPageSize(kind:AdminContentKind){
 return kind==="RESOURCES"?ADMIN_RESOURCE_PAGE_SIZE:ADMIN_CONTENT_PAGE_SIZE;
}
export const adminContentKindSchema = z.enum(["VIDEOS","RESOURCES","LIVE_CLASSES"]);
export type AdminContentKind = z.infer<typeof adminContentKindSchema>;
export const adminContentQuerySchema = z.strictObject({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","DRAFT","PUBLISHED","ARCHIVED"]).default("ALL"),
 offeringId:z.preprocess(value=>value===""?undefined:value,z.string().uuid().optional()),
 lessonId:z.preprocess(value=>value===""?undefined:value,z.string().uuid().optional()),
 deliveryId:z.preprocess(value=>value===""?undefined:value,z.string().uuid().optional()),
 scope:z.enum(["ALL","SHARED","SECTION"]).default("ALL"),
 page:z.union([
  z.number().int().min(1).max(1000),
  z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(1000)),
 ]).default(1),
 pageSize:z.coerce.number().int().refine(value=>
  (ADMIN_CONTENT_PAGE_OPTIONS as readonly number[]).includes(value),
  "Choose 10, 15, 25, 50 or 100 rows").optional(),
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
 if(query.pageSize!==undefined)p.set("pageSize",String(query.pageSize));
 const base=kind==="VIDEOS"?"/admin/videos":kind==="RESOURCES"?"/admin/resources":"/admin/live-classes";
 return base+(p.size?"?"+p:"");
}
export function adminContentPages(total:number,pageSize:number=ADMIN_CONTENT_PAGE_SIZE) {
 return Math.max(1,Math.ceil(total/pageSize));
}
export function adminContentRange(total:number,page:number,size:number){
 return {start:total===0?0:Math.min(total,(page-1)*size+1),
  end:Math.min(total,page*size)};
}
export function adminContentTypeLabel(type:string) {
 return type==="YOUTUBE"?"YouTube Video":type==="VIDEO"?"Video":
  type==="RESOURCE"?"Resource":type==="LIVE_CLASS"?"Live class":"Unknown content";
}
/** Effective visibility is the entire published ancestry, not just content's flag. */
export function effectiveCourseContentVisibleToStudents(input:{
 status:string;visibleToStudents:boolean;lessonStatus:string;
 learningPathStatus:string;offeringStatus:string;courseStatus:string;
}):boolean{
 return input.status==="PUBLISHED"&&input.visibleToStudents&&
  input.lessonStatus==="ACTIVE"&&input.learningPathStatus==="PUBLISHED"&&
  input.offeringStatus==="ACTIVE"&&input.courseStatus==="ACTIVE";
}

/** Deep-link adapter for the prior unified content workspace.
 * Legacy filtering remains URL-based; no cross-college fallback is inferred.
 */
export function legacySuperAdminLessonContentHref(raw:Record<string,string|string[]|undefined>):string {
 const rawType=typeof raw.type==="string"?raw.type.toLowerCase():"video";
 const kind:AdminContentKind=rawType==="resources"||rawType==="resource"?"RESOURCES":
  rawType==="live-classes"||rawType==="live-class"?"LIVE_CLASSES":"VIDEOS";
 // The old classId=0 means course-wide content, not an unknown class.
 // A positive legacy integer is not a vNext Section delivery UUID and must
 // not be guessed or forwarded without a scoped identity crosswalk.
 const oldClass=typeof raw.classId==="string"?raw.classId:null;
 const oldClassIsDelivery=oldClass!==null&&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(oldClass);
 const scopedDelivery=typeof raw.deliveryId==="string"?raw.deliveryId:
  oldClassIsDelivery?oldClass:undefined;
 const inferredScope=oldClass==="0"?"SHARED":scopedDelivery?"SECTION":"ALL";
 const valid=adminContentQuerySchema.safeParse({
  q:typeof raw.q==="string"?raw.q:undefined,
  status:typeof raw.status==="string"?raw.status:undefined,
  page:typeof raw.page==="string"?raw.page:undefined,
  pageSize:typeof raw.pageSize==="string"?raw.pageSize:undefined,
  offeringId:typeof raw.offeringId==="string"?raw.offeringId:undefined,
  lessonId:typeof raw.lessonId==="string"?raw.lessonId:undefined,
  deliveryId:scopedDelivery,
  scope:typeof raw.scope==="string"?raw.scope:inferredScope,
 });
 return adminContentHref(kind,valid.success?valid.data:{});
}
/** Legacy badge exposed only the item's flag; actual student access must
 * additionally require published parents. Preserve both meanings separately.
 */
export function legacyContentVisibilityBadge(row:{
 visibleToStudents:boolean;status:string;lessonStatus:string;
 learningPathStatus:string;offeringStatus:string;courseStatus:string;
}) {
 const configured=row.visibleToStudents;
 const effective=effectiveCourseContentVisibleToStudents(row);
 return {configured,effective,
  label:!configured?"Hidden":effective?"Visible":"Visible flag on · waiting for publication"};
}

/** Legacy AdminResources initialized active/enabled/visible to true.
 * The actual publish mutation still verifies lesson and offering ancestry. */
export function legacyAdminContentInitialFlags(input:{
 active?:boolean;enabled?:boolean;visible?:boolean;
}={}){
 return {
  publishNow:input.active!==false&&input.enabled!==false,
  visibleToStudents:input.visible!==false&&input.enabled!==false,
 };
}
