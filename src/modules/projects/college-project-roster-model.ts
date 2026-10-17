import {z} from "zod";
export const replaceCollegeProjectRosterSchema=z.object({
 learnerMembershipIds:z.array(z.string().uuid()).max(100)
  .refine(values=>new Set(values).size===values.length,"Each learner must be selected once."),
 roleLabel:z.string().trim().max(120).optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();
