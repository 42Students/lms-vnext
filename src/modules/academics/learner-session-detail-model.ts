/** Show only authored schedule details: blanks are not meaningful session information. */
export function learnerClassSessionNotes(value:string|null):string|null {
  const trimmed=value?.trim()??"";
  return trimmed.length>0?trimmed:null;
}
