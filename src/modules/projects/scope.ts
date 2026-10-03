import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges,
  organizations,
} from "@/db/schema";
import { ProjectsServiceError } from "./errors";

export async function loadProjectCollegeScope(
  collegeId: string,
) {
  const [college] = await getDb()
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
    })
    .from(colleges)
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!college) {
    throw new ProjectsServiceError(
      "COLLEGE_NOT_FOUND",
    );
  }

  return college;
}
