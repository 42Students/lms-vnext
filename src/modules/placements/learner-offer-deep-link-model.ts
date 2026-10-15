import { z } from "zod";
const offerIdSchema=z.string().uuid();
/** Scoped on the server already; a fragment can only locate an owned rendered offer. */
export function learnerOfferAnchor(offerId:string):string|null{
 const parsed=offerIdSchema.safeParse(offerId);
 return parsed.success?"offer-"+parsed.data.toLowerCase():null;
}
export function learnerOfferHref(offerId:string):string|null{
 const anchor=learnerOfferAnchor(offerId);
 return anchor?"/learn/my-placements/offers#"+anchor:null;
}
