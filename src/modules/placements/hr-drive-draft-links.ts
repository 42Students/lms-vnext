import { z } from "zod";

import { zUuid } from "@/lib/schema-primitives";
const idSchema = zUuid;

export function recruiterDriveDraftHref(input: {
  collegeId: string;
  fromJobId?: string;
}) {
  const collegeId = idSchema.parse(input.collegeId);
  const params = new URLSearchParams({ collegeId });
  if (input.fromJobId) params.set("from", idSchema.parse(input.fromJobId));
  return "/hr/drives/new?" + params.toString();
}
