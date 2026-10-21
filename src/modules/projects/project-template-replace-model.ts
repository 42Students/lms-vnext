import { z } from "zod";

/** Tenant is derived from the locked workspace, never accepted in the body. */
export const replaceProjectTemplateSchema = z.strictObject({
  templateId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  reapplyDefaults: z.boolean(),
});
