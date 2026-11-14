import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
const id=zUuid;
/** The destination enforces active learner ownership independently of the offer card. */
export function learnerOfferApplicationHref(raw:string):string|null{
 const parsed=id.safeParse(raw);
 return parsed.success?"/learn/my-placements/applications/"+encodeURIComponent(parsed.data):null;
}
