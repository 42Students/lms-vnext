import { z } from "zod";

export const organizationIdSchema = z.string().uuid();

export const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "Please enter organization name")
  .max(255, "Organization name must be 255 characters or less")
  /** The legacy create form compressed repeated whitespace. Preserve this for
   * both create and rename; do not mutate the UUID in persistence. */
  .transform(name=>name.replace(/\s+/g," "));

export const createOrganizationInputSchema = z.object({
  name: organizationNameSchema,
});

export const renameOrganizationInputSchema = z.object({
  name: organizationNameSchema,
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationInputSchema
>;
export type RenameOrganizationInput = z.infer<
  typeof renameOrganizationInputSchema
>;

/** Never send a raw database uniqueness violation to a user. */
export function organizationNameErrorMessage(code:string):string|null {
  return code==="ORGANIZATION_NAME_CONFLICT"
    ? "Organization name already exists" : null;
}

/** Unmigrated numeric bookmarks must not be treated as array offsets or UUIDs.
 * Callers may pass a verified legacy-ID crosswalk row; unknown mappings fail.
 */
export function resolveLegacyOrganizationId(raw:unknown,
 crosswalk:ReadonlyMap<number,string>):string|null{
 const legacy=typeof raw==="number"?raw:
  typeof raw==="string"&&/^[1-9][0-9]{0,9}$/.test(raw)?Number(raw):NaN;
 if(!Number.isSafeInteger(legacy)||legacy<=0)return null;
 const id=crosswalk.get(legacy);
 return id&&organizationIdSchema.safeParse(id).success?id:null;
}
