/** Never expand scope; only filter notices already returned by the membership-authorized reader. */
export function learnerPlacementNoticeView<T extends { isPinned: boolean }>(rows: readonly T[], pinnedOnly: boolean): T[] {
  return pinnedOnly ? rows.filter(row => row.isPinned) : [...rows];
}

/**
 * Unknown source/receipt state is not zero unread. The count is only meaningful
 * when both membership-scoped reads succeeded and every receipt is known.
 */
export function learnerNoticeUnreadCount(
  notices: readonly { unread: boolean | null }[],
  state: { noticesAvailable: boolean; receiptsAvailable: boolean },
): number | null {
  if (!state.noticesAvailable || !state.receiptsAvailable ||
      notices.some(notice => notice.unread !== true && notice.unread !== false)) {
    return null;
  }
  return notices.filter(notice => notice.unread === true).length;
}
