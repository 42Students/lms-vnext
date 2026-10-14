import { z } from "zod";
export const recruiterDesignationPatchSchema = z.strictObject({
  title:z.string().trim().max(160),
  expectedUpdatedAt:z.iso.datetime(),
});
export type RecruiterDesignationPatch=z.infer<typeof recruiterDesignationPatchSchema>;
export function normalizeRecruiterDesignation(value: string):string|null {
  const clean=value.trim().replace(/\\s+/g," ");
  return clean || null;
}
export function sameRecruiterProfileVersion(actual:Date,expected:string) {
  const value=Date.parse(expected);
  return Number.isFinite(value) &&
    Math.trunc(actual.getTime())===Math.trunc(value);
}
