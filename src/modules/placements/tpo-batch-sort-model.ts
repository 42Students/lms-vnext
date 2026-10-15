import { z } from "zod";

export const tpoBatchSortSchema = z.enum(["NAME_ASC", "NAME_DESC"]).default("NAME_ASC");

export function sortTpoBatchNames<T extends { id: string; name: string }>(
  batches: readonly T[],
  sort: z.infer<typeof tpoBatchSortSchema>,
): T[] {
  const direction = sort === "NAME_DESC" ? -1 : 1;
  return [...batches].sort((a, b) =>
    direction * (a.name.localeCompare(b.name, "en-IN") || a.id.localeCompare(b.id))
  );
}
