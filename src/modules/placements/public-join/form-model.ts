import { z } from "zod";
import { publicCollegeJoinCodeSchema, publicCollegeJoinTokenSchema,
  publicRecruiterWorkEmailSchema } from "../public-college-join-model";

export const publicJoinFormSchema = z.strictObject({
  email: publicRecruiterWorkEmailSchema,
  name: z.string().trim().min(1).max(150),
  designation: z.string().trim().max(100),
  phone: z.string().trim().max(20),
  companyName: z.string().trim().max(200),
});

/** Shared public join inputs, no caller-supplied college or company IDs. */
export const publicJoinAcceptSchema = publicJoinFormSchema.extend({
  token: publicCollegeJoinTokenSchema,
  code: publicCollegeJoinCodeSchema,
}).strict();
