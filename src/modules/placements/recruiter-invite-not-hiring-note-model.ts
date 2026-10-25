import {z} from "zod";
/** Token-bound public decision notes must remain short, printable and safe for
 * a TPO's lead timeline. The browser cannot edit any other CRM fields. */
export const recruiterInviteNotHiringNoteSchema=z.string()
 .trim().max(200)
 .refine(value=>!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value),{
  message:"Remove control characters from the note",
 }).default("");
export function recruiterInviteNotHiringReason(raw:unknown):string{
 const note=recruiterInviteNotHiringNoteSchema.parse(raw??"");
 return note?("Not hiring this season: "+note):
  "Said they are not hiring from this college this season";
}
