import {z} from "zod";
const idSchema=z.string().uuid();
/** Only previously authorized, membership-visible announcements can be focused. */
export function learnerNoticeAnchor(value:string):string|null{
 const parsed=idSchema.safeParse(value);
 return parsed.success?"notice-"+parsed.data.toLowerCase():null;
}
export function learnerNoticeHref(value:string):string|null{
 const anchor=learnerNoticeAnchor(value);
 return anchor?"/learn/my-placements/announcements?focus="+encodeURIComponent(value)+"#"+anchor:null;
}
export function learnerNoticeFocusPage<T extends {id:string}>(
 authorized:readonly T[],requestedPage:number,focus:string|null,pageSize=15
):{page:number;found:boolean}{
 if(!focus||!idSchema.safeParse(focus).success)return {page:requestedPage,found:false};
 const index=authorized.findIndex(row=>row.id===focus);
 return index>=0?{page:Math.floor(index/pageSize)+1,found:true}:{page:requestedPage,found:false};
}

/** An inaccessible UUID is never looked up outside authorized results. */
export function learnerNoticeMissing(focus:string|null,found:boolean):boolean{
 return focus!==null&&!found;
}

/** Re-run lookup only against the reader's own authorized, unfiltered notices. */
export function learnerNoticeRecoveryHref(focus:unknown):string{
 const valid=typeof focus==="string"?idSchema.safeParse(focus):null;
 return valid?.success?
  "/learn/my-placements/announcements?focus="+encodeURIComponent(valid.data):
  "/learn/my-placements/announcements";
}
