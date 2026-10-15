import {z} from "zod";
export const learnerOfferKindSchema=z.enum(["all","offer","loi"]);
export type LearnerOfferKind=z.infer<typeof learnerOfferKindSchema>;
/** Kind is a stored official document discriminator, not an offer outcome. */
export function filterOwnOffersByKind<T extends {offer:{kind:string}}>(rows:readonly T[],kind:LearnerOfferKind):T[]{
 if(kind==="all")return [...rows];
 return rows.filter(row=>row.offer.kind===(kind==="loi"?"LOI":"OFFER"));
}
