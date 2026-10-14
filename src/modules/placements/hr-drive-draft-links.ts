import { z } from "zod";

const idSchema = z.string().uuid();

export function recruiterDriveDraftHref(input: {
  collegeId: string;
  fromJobId?: string;
}) {
  const collegeId = idSchema.parse(input.collegeId);
  const params = new URLSearchParams({ collegeId });
  if (input.fromJobId) params.set("from", idSchema.parse(input.fromJobId));
  return "/hr/drives/new?" + params.toString();
}
