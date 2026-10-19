/** Pure selection transitions; keyed by authorized row identifiers, never row index. */
export type GridClickModifiers = { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean };
export type GridSelectionResult = { selected: string[]; anchor: string | null };

export function selectedGridIdsWithin(
  selected: readonly string[],
  allowed: readonly string[],
): string[] {
  const permitted = new Set(allowed);
  return [...new Set(selected)].filter(id => permitted.has(id));
}

export function gridSelectionClick(
  visibleIds: readonly string[],
  previouslySelected: readonly string[],
  rowId: string,
  anchorId: string | null,
  keys: GridClickModifiers = {},
): GridSelectionResult {
  const rowIndex = visibleIds.indexOf(rowId);
  if (rowIndex < 0) return { selected: selectedGridIdsWithin(previouslySelected, visibleIds), anchor: null };
  const prior = selectedGridIdsWithin(previouslySelected, visibleIds);
  const anchorIndex = anchorId === null ? -1 : visibleIds.indexOf(anchorId);
  if (keys.shiftKey && anchorIndex >= 0) {
    const from = Math.min(rowIndex, anchorIndex);
    const to = Math.max(rowIndex, anchorIndex);
    const range = visibleIds.slice(from, to + 1);
    return {
      selected: keys.ctrlKey || keys.metaKey
        ? [...new Set([...prior, ...range])] : range.slice(),
      anchor: anchorId,
    };
  }
  if (keys.ctrlKey || keys.metaKey) {
    return {
      selected: prior.includes(rowId) ? prior.filter(id => id !== rowId) : [...prior, rowId],
      anchor: rowId,
    };
  }
  return { selected: [rowId], anchor: rowId };
}

export function gridSelectionCheckbox(
  visibleIds: readonly string[],
  previouslySelected: readonly string[],
  rowId: string,
  checked: boolean,
  anchorId: string | null,
  shiftKey = false,
): GridSelectionResult {
  const index = visibleIds.indexOf(rowId);
  if (index < 0) return { selected: selectedGridIdsWithin(previouslySelected, visibleIds), anchor: null };
  const anchor = anchorId !== null ? visibleIds.indexOf(anchorId) : -1;
  const range = shiftKey && anchor >= 0
    ? visibleIds.slice(Math.min(index, anchor), Math.max(index, anchor) + 1)
    : [rowId];
  const previous = selectedGridIdsWithin(previouslySelected, visibleIds);
  return {
    selected: checked ? [...new Set([...previous, ...range])] : previous.filter(id => !range.includes(id)),
    anchor: rowId,
  };
}
