import { z } from "zod";
export const learnerAssignmentHttpsLinkSchema = z.string().trim().url().refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
});
export function isLearnerAssignmentHttpsLink(value: string): boolean {
  return learnerAssignmentHttpsLinkSchema.safeParse(value).success;
}
