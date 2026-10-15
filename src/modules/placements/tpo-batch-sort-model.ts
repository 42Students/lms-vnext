import { z } from "zod";

export const tpoBatchSortSchema = z.enum(["NAME_ASC", "NAME_DESC", "DEADLINE_ASC", "DEADLINE_DESC"]).default("NAME_ASC");

export function sortTpoBatchNames<T extends { id: string; name: string; deadline?: Date | null }>(
  batches: readonly T[],
  sort: z.infer<typeof tpoBatchSortSchema>,
): T[] {
  const direction = sort === "NAME_DESC" ? -1 : 1;
  return [...batches].sort((a, b) => {
    if (sort === "DEADLINE_ASC" || sort === "DEADLINE_DESC") {
      const aDue = a.deadline?.getTime(), bDue = b.deadline?.getTime();
      if (aDue === undefined && bDue !== undefined) return 1;
      if (aDue !== undefined && bDue === undefined) return -1;
      if (aDue !== undefined && bDue !== undefined && aDue !== bDue) {
        return (sort === "DEADLINE_DESC" ? -1 : 1) * (aDue - bDue);
      }
    }
    return direction * (a.name.localeCompare(b.name, "en-IN") || a.id.localeCompare(b.id));
  });
}
