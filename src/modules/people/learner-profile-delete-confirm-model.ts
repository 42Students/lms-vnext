/** Stale saved-item IDs cannot start a section overwrite; an existing item
 * requires explicit confirmation before a destructive mutation. */
export function learnerProfileDeletePrompt(section:string,exists:boolean):string|null{
 if(!exists)return null;
 return `Delete this saved ${section} entry? This cannot be undone.`;
}
