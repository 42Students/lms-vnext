import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges } from "@/db/schema";

/** Display name shown on a college host's sign-in page. */
export async function getCollegeSignInName(collegeId: string) {
  const [row] = await getDb()
    .select({ name: colleges.name })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  return row?.name ?? null;
}
