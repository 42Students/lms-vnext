import {LEGACY_TENANT_SETTING_MAP,type LegacyTenantSettingKey} from "./legacy-setting-specs";
/** Reject malformed historical overrides rather than widening service guards.
 * Values above an endpoint's safe ceiling are clamped, not used as limits.
 */
export function normalizeRuntimeNumericSetting(
 key:LegacyTenantSettingKey,value:unknown,safeMaximum?:number,
):number|null{
 const spec=LEGACY_TENANT_SETTING_MAP.get(key);
 if(!spec||spec.scope!=="GLOBAL"||spec.type!=="int"&&spec.type!=="decimal"||
  typeof value!=="string"||!/^\d+(?:\.\d+)?$/.test(value))return null;
 const number=Number(value);
 if(!Number.isFinite(number)||(spec.type==="int"&&!Number.isSafeInteger(number))||
  "min" in spec&&spec.min!==undefined&&number<spec.min||
  "max" in spec&&spec.max!==undefined&&number>spec.max)return null;
 return safeMaximum===undefined?number:Math.min(number,safeMaximum);
}
