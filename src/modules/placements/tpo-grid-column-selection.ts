/** Keep the data grid useful even if every checkbox is toggled off. */
export function canToggleTpoGridColumn(selected: readonly string[], checked: boolean): boolean {
  return checked || selected.length > 1;
}
