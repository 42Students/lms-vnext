export type PlacementScheduleRow = {
  applicationId: string;
  roundId: string;
  roundName: string;
  companyName: string;
  roleTitle: string;
  scheduledAt: Date | null;
  exception: { scheduledAt: Date } | null;
};

export function partitionLearnerPlacementSchedule(
  rows: readonly PlacementScheduleRow[], now: Date,
): { ahead: PlacementScheduleRow[]; past: PlacementScheduleRow[]; undated: PlacementScheduleRow[] } {
  const ahead: PlacementScheduleRow[] = [];
  const past: PlacementScheduleRow[] = [];
  const undated: PlacementScheduleRow[] = [];
  for (const row of rows) {
    const date = row.exception?.scheduledAt ?? row.scheduledAt;
    if (!date || !Number.isFinite(date.getTime())) undated.push(row);
    else if (date.getTime() >= now.getTime()) ahead.push(row);
    else past.push(row);
  }
  const byDate=(a:PlacementScheduleRow,b:PlacementScheduleRow)=>
    (a.exception?.scheduledAt??a.scheduledAt)!.getTime()-
    (b.exception?.scheduledAt??b.scheduledAt)!.getTime();
  ahead.sort(byDate);
  past.sort((a,b)=>byDate(b,a));
  return {ahead,past,undated};
}
