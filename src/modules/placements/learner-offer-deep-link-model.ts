import { z } from "zod";
const offerIdSchema=z.string().uuid();
/** Scoped on the server already; a fragment can only locate an owned rendered offer. */
export function learnerOfferAnchor(offerId:string):string|null{
 const parsed=offerIdSchema.safeParse(offerId);
 return parsed.success?"offer-"+parsed.data.toLowerCase():null;
}
export function learnerOfferHref(offerId:string):string|null{
 const anchor=learnerOfferAnchor(offerId);
 return anchor?"/learn/my-placements/offers?focus="+encodeURIComponent(offerId)+"#"+anchor:null;
}

/** Focus changes the display page only after the server has loaded and scoped
 * the complete own-offer collection. Foreign or missing ids are never echoed. */
export function resolveLearnerOfferFocus<T extends {offer:{id:string}}>(
 rows:readonly T[],requestedPage:number,focus:unknown,pageSize=15
):{page:number;found:boolean}{
 const id=typeof focus==="string"?offerIdSchema.safeParse(focus):null;
 if(!id?.success)return {page:requestedPage,found:false};
 const index=rows.findIndex(row=>row.offer.id===id.data);
 return {page:index<0?requestedPage:Math.floor(index/pageSize)+1,found:index>=0};
}
