export function teachingAssignmentRevisionMatches(persisted: Date, expected: string): boolean {
  const saved = persisted.getTime();
  const submitted = Date.parse(expected);
  return Number.isFinite(saved) && Number.isFinite(submitted) && saved === submitted;
}

export function nextTeachingAssignmentRevision(previous: Date, now: Date = new Date()): Date {
  if (!Number.isFinite(previous.getTime()) || !Number.isFinite(now.getTime())) {
    throw new Error("Invalid teaching assignment revision");
  }
  return new Date(Math.max(previous.getTime() + 1, now.getTime()));
}
