export type CollegeLegacyDriveStatus="DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED";
export function collegeDriveCloseAction(status:CollegeLegacyDriveStatus) {
  return status==="PUBLISHED"
    ? {action:"CLOSE" as const,label:"Close drive",
      confirmation:"Are you sure you want to close this drive?"}
    : null;
}
