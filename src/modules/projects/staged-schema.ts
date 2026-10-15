/**
 * PR-S2-03 (0082) and PR-S2-08 (0083) are now registered in
 * src/db/schema/projects.ts. Remaining staged declarations live below.
 */
import { pgTable } from "drizzle-orm/pg-core";
import {varchar} from "drizzle-orm/pg-core";

/** PR-S2-11 resource visibility staged until schema is registered. */
export const projectResourceVisibilityStage=pgTable("project_resources",{
  visibility:varchar("visibility",{length:16}),
});
