import { z } from "zod";

import { zUuid } from "@/lib/schema-primitives";
/** Tenant is derived from the locked workspace, never accepted in the body. */
export const replaceProjectTemplateSchema = z.strictObject({
  templateId: zUuid,
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  reapplyDefaults: z.boolean(),
});
