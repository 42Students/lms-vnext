import {z} from "zod";
const sectionSchema=z.string().uuid().or(z.literal("")).catch("");
/** Restricts already learner-authorized schedule events; never requests foreign sections. */
export function filterLearnerScheduleSections<T extends {sectionId:string}>(
  events:readonly T[],selectedInput:unknown,
):T[] {
  const selected=sectionSchema.parse(selectedInput);
  return selected ? events.filter(row=>row.sectionId===selected) : [...events];
}
