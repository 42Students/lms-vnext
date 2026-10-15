import {z} from "zod";
const id=z.string().uuid();
/** The destination enforces active learner ownership independently of the offer card. */
export function learnerOfferApplicationHref(raw:string):string|null{
 const parsed=id.safeParse(raw);
 return parsed.success?"/learn/my-placements/applications/"+encodeURIComponent(parsed.data):null;
}
