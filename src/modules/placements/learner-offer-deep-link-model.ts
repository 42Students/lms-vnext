import { z } from "zod";
const offerIdSchema=z.string().uuid();
/** Old LMS offer IDs are signed 32-bit positive integers. Resolve them only
 * against the already authorized own-offer result, never by unscoped numeric
 * DB lookup or coercion to a UUID. */
export function legacyNumericOfferId(raw:unknown):number|null{
 if(typeof raw!=="string"||!/^[1-9][0-9]{0,9}$/.test(raw))return null;
 const id=Number(raw);
 return Number.isSafeInteger(id)&&id<=2147483647?id:null;
}
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
export function resolveLearnerOfferFocus<T extends {offer:{id:string;legacyOfferId?:number|null}}>(
 rows:readonly T[],requestedPage:number,focus:unknown,pageSize=15
):{page:number;found:boolean}{
 if(!Number.isSafeInteger(pageSize)||pageSize<1)throw new Error("INVALID_OFFER_PAGE_SIZE");
 const uuid=typeof focus==="string"?offerIdSchema.safeParse(focus):null;
 const legacy=legacyNumericOfferId(focus);
 if(!uuid?.success&&legacy===null)return {page:requestedPage,found:false};
 const index=rows.findIndex(row=>uuid?.success?
   row.offer.id.toLowerCase()===uuid.data.toLowerCase():
   row.offer.legacyOfferId===legacy);
 return {page:index<0?requestedPage:Math.floor(index/pageSize)+1,found:index>=0};
}

/** Message depends on a syntactically valid focus request, never an unscoped lookup. */
export function learnerOfferFocusMissing(focus:unknown,found:boolean):boolean{
 return typeof focus==="string"&&
   (offerIdSchema.safeParse(focus).success||legacyNumericOfferId(focus)!==null)&&!found;
}

/** When filters hide a deep-linked offer, keep the id through an own-only
 * unfiltered lookup; never assert that the offer exists for this learner. */
export function learnerOfferRecoveryHref(focus:unknown):string{
 const parsed=typeof focus==="string"?offerIdSchema.safeParse(focus):null;
 const legacy=legacyNumericOfferId(focus);
 if(!parsed?.success&&legacy===null)return "/learn/my-placements/offers";
 return "/learn/my-placements/offers?focus="+encodeURIComponent(parsed?.success?parsed.data:String(legacy));
}
