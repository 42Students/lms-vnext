import {z} from "zod";
export const collegeSectionLifecycleSchema=z.discriminatedUnion("action",[
  z.strictObject({action:z.literal("ARCHIVE"),expectedUpdatedAt:z.iso.datetime({offset:true}),confirm:z.literal(true)}),
  z.strictObject({action:z.literal("RESTORE"),expectedUpdatedAt:z.iso.datetime({offset:true}),confirm:z.literal(true)}),
]);
export function classLifecyclePrompt(name:string,action:"ARCHIVE"|"RESTORE"){
  return action==="ARCHIVE"
    ? `Archive class ${name}? Enrollment, Faculty, session or course delivery history blocks archival.`
    : `Restore class ${name}? Its cohort, academic period and active class name/code must be available.`;
}
