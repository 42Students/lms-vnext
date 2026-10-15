/** Restore exactly the persisted text draft after an explicit discard. */
export function restoreFacultyTextDraft(snapshot:Readonly<Record<string,string>>):Record<string,string>{
 return {...snapshot};
}

/** Restore skill drafts with fresh object identities after explicit consent. */
export function restoreFacultySkills<T extends {id:string}>(saved:readonly T[]):T[]{
 return saved.map(row=>({...row}));
}
