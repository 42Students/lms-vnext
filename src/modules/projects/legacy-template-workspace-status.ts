/** A safe migration crosswalk, not an implicit change to modern project states.
 * Never seed a workspace in ARCHIVED state or silently downgrade an unknown
 * legacy status to PLANNED. Review flags preserve legacy meaning for operators.
 */
export type LegacyWorkspaceSeedStatus =
  "ACTIVE" | "IN_PROGRESS" | "READY" | "BLOCKED" | "ARCHIVED";

export type LegacyWorkspaceStatusCrosswalk =
  | {ok:true; legacyStatus:Exclude<LegacyWorkspaceSeedStatus,"ARCHIVED">;
     initialStatus:"ACTIVE"|"PLANNED";requiresReview:boolean}
  | {ok:false;legacyStatus:string;reason:"ARCHIVED_NOT_ALLOWED"|"UNKNOWN_LEGACY_STATUS"};

export function crosswalkLegacyWorkspaceSeedStatus(
  value:unknown,
):LegacyWorkspaceStatusCrosswalk {
  const normalized = typeof value==="string"
    ? value.trim().toUpperCase().replace(/[\s-]+/g,"_") : "";
  // Legacy blank selection defaulted to ACTIVE, not ARCHIVED.
  const legacyStatus=normalized||"ACTIVE";
  if(legacyStatus==="ARCHIVED")
    return {ok:false,legacyStatus,reason:"ARCHIVED_NOT_ALLOWED"};
  if(legacyStatus==="ACTIVE")
    return {ok:true,legacyStatus,initialStatus:"ACTIVE",requiresReview:false};
  if(legacyStatus==="IN_PROGRESS"||legacyStatus==="READY")
    return {ok:true,legacyStatus,initialStatus:"ACTIVE",requiresReview:true};
  if(legacyStatus==="BLOCKED")
    return {ok:true,legacyStatus,initialStatus:"PLANNED",requiresReview:true};
  return {ok:false,legacyStatus,reason:"UNKNOWN_LEGACY_STATUS"};
}
