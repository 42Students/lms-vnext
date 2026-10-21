import {z} from "zod";
export const replaceCollegeProjectRosterSchema=z.object({
 learnerMembershipIds:z.array(z.string().uuid()).max(500)
  .refine(values=>new Set(values).size===values.length,"Each learner must be selected once."),
 roleLabel:z.string().trim().max(120).optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 mode:z.enum(["ADD","REPLACE"]).default("ADD"),
 confirmRemoval:z.boolean().optional(),
}).strict();

/** The legacy 500-learner cap is on the effective roster, not each batch. */
export const COLLEGE_PROJECT_LEARNER_LIMIT=500;
export function collegeProjectRosterCapacity(
 current:readonly string[],selected:readonly string[],replaceExisting=false,
):{allowed:boolean;total:number;message:string|null}{
 const next=replaceExisting?new Set(selected):new Set([...current,...selected]);
 const total=next.size;
 return {allowed:total<=COLLEGE_PROJECT_LEARNER_LIMIT,total,
  message:total>COLLEGE_PROJECT_LEARNER_LIMIT?
   "This would exceed the 500-learner limit. Remove some learners before continuing.":null};
}
