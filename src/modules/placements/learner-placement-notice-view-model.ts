/** Never expand scope; only filter notices already returned by the membership-authorized reader. */
export function learnerPlacementNoticeView<T extends { isPinned: boolean }>(rows: readonly T[], pinnedOnly: boolean): T[] {
  return pinnedOnly ? rows.filter(row => row.isPinned) : [...rows];
}
