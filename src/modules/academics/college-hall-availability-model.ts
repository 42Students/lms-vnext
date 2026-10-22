import { z } from "zod";

const istDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + "T00:00:00+05:30");
  return Number.isFinite(parsed.getTime()) &&
    new Date(parsed.getTime() + 330 * 60_000).toISOString().slice(0, 10) === value;
}, "Use a valid YYYY-MM-DD date");

export const collegeHallAvailabilitySchema = z.strictObject({
  hallId: z.string().uuid(),
  from: istDate,
  to: istDate,
}).superRefine((input, ctx) => {
  const days = (Date.parse(input.to + "T00:00:00+05:30") -
    Date.parse(input.from + "T00:00:00+05:30")) / 86_400_000;
  if (days < 0 || days > 30) ctx.addIssue({
    code: "custom", path: ["to"], message: "Select up to 31 consecutive IST calendar days",
  });
});

export function istWindow(from: string, to: string) {
  return {
    start: new Date(from + "T00:00:00+05:30"),
    endExclusive: new Date(Date.parse(to + "T00:00:00+05:30") + 86_400_000),
  };
}

export type HallScheduledRow = {
  id: string;
  sectionId: string;
  sectionName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  updatedAt?: Date;
  sectionCapacity: number | null;
};

/** A scheduled class is not live occupancy. Overlapping records are flagged,
 * including two classes with identical start times. Null section capacity means
 * capacity usage is unknown, not a count of zero enrolled students. */
export function collegeHallAvailabilityProjection(
  hallCapacity: number, rows: readonly HallScheduledRow[],
) {
  const sorted = [...rows].sort((a, b) =>
    a.startsAt.getTime() - b.startsAt.getTime() || a.id.localeCompare(b.id));
  const overlaps = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      const candidate = sorted[j];
      if (!candidate) continue;
      if (candidate.startsAt.getTime() >= current.endsAt.getTime()) break;
      if (current.startsAt.getTime() < candidate.endsAt.getTime()) {
        overlaps.add(current.id);
        overlaps.add(candidate.id);
      }
    }
  }
  return sorted.map(row => {
    const overConfiguredCapacity = row.sectionCapacity !== null &&
      row.sectionCapacity > hallCapacity;
    const overlapsAnother = overlaps.has(row.id);
    return {
      id: row.id,
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      title: row.title,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      updatedAt: row.updatedAt?.toISOString() ?? null,
      sectionCapacity: row.sectionCapacity,
      overlapsAnother,
      overConfiguredCapacity,
      hasConflict: overlapsAnother || overConfiguredCapacity,
    };
  });
}
