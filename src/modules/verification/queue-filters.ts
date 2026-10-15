import {z} from "zod";
export const verificationQueueFilters=z.strictObject({
  tab:z.enum(["WAITING","SENT_BACK","VERIFIED"]).default("WAITING"),
  sectionId:z.string().uuid().optional(),
  kind:z.enum(["EDUCATION","IDENTITY"]).optional(),
  marksheets:z.enum(["ANY","MISSING","PRESENT"]).default("ANY"),
  batchId:z.string().uuid().optional(),
  branchId:z.string().uuid().optional(),
  waitingSince:z.iso.date().optional(),
  page:z.coerce.number().int().min(1).max(10000).default(1),
});
export type VerificationQueueFilters=z.infer<typeof verificationQueueFilters>;
