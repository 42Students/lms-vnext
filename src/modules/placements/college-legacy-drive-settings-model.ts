export type CollegeLegacyDriveStatus="DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED";
export function collegeDriveCloseAction(status:CollegeLegacyDriveStatus) {
  return status==="PUBLISHED"
    ? {action:"CLOSE" as const,label:"Close drive",
      confirmation:"Are you sure you want to close this drive?"}
    : null;
}

export function collegeDriveReopenAction(status:CollegeLegacyDriveStatus){
 return status==="CLOSED"
  ? {action:"REOPEN" as const,label:"Open drive",
    confirmation:"Reopen this drive? Previously withdrawn offers will not be restored."}
  : null;
}

/** The legacy API stored isDraft and isActive booleans, with mutual exclusion
 * enforced by the job writer. vNext stores a single canonical lifecycle
 * status; this adapter preserves the old response's two flags without
 * pretending CLOSED/ARCHIVED can become draft by toggling a boolean. */
export type LegacyDriveFlags={isDraft:boolean;isActive:boolean};
export function legacyFlagsForCollegeDrive(status:CollegeLegacyDriveStatus):LegacyDriveFlags{
 return {isDraft:status==="DRAFT",isActive:status==="PUBLISHED"};
}
export function collegeDriveStatusFromLegacyFlags(flags:LegacyDriveFlags,
 current:CollegeLegacyDriveStatus):CollegeLegacyDriveStatus|null{
 if(flags.isActive&&flags.isDraft)return null;
 if(current==="ARCHIVED")return null;
 if(flags.isDraft){
  // Closing an advertised drive is not the same as taking it back to draft.
  return current==="DRAFT"?"DRAFT":null;
 }
 if(flags.isActive){
  // Reopening a closed job follows a guarded, audited REOPEN operation.
  return current==="DRAFT"||current==="CLOSED"||current==="PUBLISHED"?"PUBLISHED":null;
 }
 if(current==="PUBLISHED")return "CLOSED";
 return current==="CLOSED"?"CLOSED":null;
}
/** Translate an old boolean update into the only safe vNext lifecycle action.
 * In particular, draft publishing requires the full publish preflight, not
 * an update to the status column. */
export function collegeDriveLegacyTransition(
 current:CollegeLegacyDriveStatus,next:LegacyDriveFlags,
):"PUBLISH"|"CLOSE"|"REOPEN"|"NO_CHANGE"|null {
 const target=collegeDriveStatusFromLegacyFlags(next,current);
 if(target===null)return null;
 if(target===current)return "NO_CHANGE";
 if(current==="DRAFT"&&target==="PUBLISHED")return "PUBLISH";
 if(current==="PUBLISHED"&&target==="CLOSED")return "CLOSE";
 if(current==="CLOSED"&&target==="PUBLISHED")return "REOPEN";
 return null;
}
