/** Keep the data grid useful even if every checkbox is toggled off. */
export function canToggleTpoGridColumn(selected: readonly string[], checked: boolean): boolean {
  return checked || selected.length > 1;
}

/** A preference does not make an export-only or unknown column visible. */
export function countVisibleTpoColumns(available:readonly string[],selected:readonly string[]):number {
 const allowed=new Set(available);
 return new Set(selected.filter(key=>allowed.has(key))).size;
}
