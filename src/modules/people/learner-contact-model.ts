import { z } from "zod";
import { learnerProfileDocumentSchema } from "./profile-validation";

export const learnerContactEditSchema = z.object({
  confirmed: z.literal(true),
  contacts: z.object({
    alternatePhone: z.string().trim().max(32),
    contactEmail: z.string().trim().max(320),
  }).strict(),
}).strict().superRefine((value, ctx) => {
  const checked = learnerProfileDocumentSchema.safeParse({
    contacts: value.contacts,
  });
  if (!checked.success) {
    for (const issue of checked.error.issues) {
      ctx.addIssue({
        code: "custom",
        path: issue.path,
        message: issue.message,
      });
    }
  }
});

