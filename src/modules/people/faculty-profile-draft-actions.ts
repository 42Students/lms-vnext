/** Restore exactly the persisted text draft after an explicit discard. */
export function restoreFacultyTextDraft(snapshot:Readonly<Record<string,string>>):Record<string,string>{
 return {...snapshot};
}
