import {z} from "zod";
export const electiveLifecycleSchema=z.discriminatedUnion("action",[
  z.strictObject({action:z.literal("ARCHIVE"),expectedVersion:z.number().int().nonnegative(),confirm:z.literal(true)}),
  z.strictObject({action:z.literal("RESTORE"),expectedVersion:z.number().int().nonnegative(),confirm:z.literal(true)}),
]);
export function electiveLifecyclePrompt(name:string, action:"ARCHIVE"|"RESTORE") {
  return action==="ARCHIVE"
    ? `Archive elective slot ${name}? Linked active offerings or learner selections block archival.`
    : `Restore elective slot ${name}? Its program and academic period must still be active.`;
}
