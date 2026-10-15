import { z } from "zod";
export const learnerAssignmentHttpsLinkSchema = z.string().trim().url().refine(value => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
});
export function isLearnerAssignmentHttpsLink(value: string): boolean {
  return learnerAssignmentHttpsLinkSchema.safeParse(value).success;
}
