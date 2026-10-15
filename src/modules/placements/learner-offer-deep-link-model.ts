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
 if(!Number.isSafeInteger(pageSize)||pageSize<1)throw new Error("INVALID_OFFER_PAGE_SIZE");
 const index=rows.findIndex(row=>row.offer.id.toLowerCase()===id.data.toLowerCase());
 return {page:index<0?requestedPage:Math.floor(index/pageSize)+1,found:index>=0};
}

/** Message depends on a syntactically valid focus request, never an unscoped lookup. */
export function learnerOfferFocusMissing(focus:unknown,found:boolean):boolean{
 return typeof focus==="string"&&offerIdSchema.safeParse(focus).success&&!found;
}

/** When filters hide a deep-linked offer, keep the id through an own-only
 * unfiltered lookup; never assert that the offer exists for this learner. */
export function learnerOfferRecoveryHref(focus:unknown):string{
 const parsed=typeof focus==="string"?offerIdSchema.safeParse(focus):null;
 if(!parsed?.success)return "/learn/my-placements/offers";
 return "/learn/my-placements/offers?focus="+encodeURIComponent(parsed.data);
}
