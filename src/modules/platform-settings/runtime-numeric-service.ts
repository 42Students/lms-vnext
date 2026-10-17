import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {platformSettingOverrides} from "@/db/schema/platform-setting-overrides";
import type {LegacyTenantSettingKey} from "./legacy-setting-specs";
import {normalizeRuntimeNumericSetting} from "./runtime-numeric-model";
/** Runtime reads apply GLOBAL overrides only. The typed editor is the sole
 * writer; this reader refuses malformed legacy rows and respects each
 * endpoint's hard upper bound. Never use to bypass authorization. */
export async function readGlobalRuntimeNumber(
 key:LegacyTenantSettingKey,fallback:number,safeMaximum?:number,
):Promise<number>{
 const [row]=await getDb().select({value:platformSettingOverrides.value})
  .from(platformSettingOverrides)
  .where(and(
   eq(platformSettingOverrides.scopeType,"GLOBAL"),
   eq(platformSettingOverrides.scopeId,"GLOBAL"),
   eq(platformSettingOverrides.key,key),
  )).limit(1);
 return normalizeRuntimeNumericSetting(key,row?.value,safeMaximum)??fallback;
}
