export type LearnerPlacementNoticeSource = {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isPinned: boolean;
};

export function learnerPlacementNoticeFeed(rows: readonly LearnerPlacementNoticeSource[]) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    isPinned: row.isPinned,
  }));
}
