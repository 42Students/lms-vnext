/** Browser-layout serialization is data-free. No row values are persisted. */
export type GridColumnLayout = {
  key: string;
  width: number;
  pinned: boolean;
  hidden: boolean;
};
export const GRID_LAYOUT_SUFFIX = ":layout-v3";

export function parseGridViewMemory(
  raw: string | null,
  permittedKeys: readonly string[],
): GridColumnLayout[] {
  if (!raw || raw.length > 100_000) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const allowed = new Set(permittedKeys);
    const used = new Set<string>();
    const result: GridColumnLayout[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const column = item as Record<string, unknown>;
      if (typeof column.key !== "string" || !allowed.has(column.key) || used.has(column.key)) continue;
      if (typeof column.width !== "number" || !Number.isFinite(column.width)) continue;
      used.add(column.key);
      result.push({
        key: column.key,
        width: Math.max(100, Math.min(500, Math.round(column.width))),
        pinned: column.pinned === true,
        hidden: column.hidden === true,
      });
    }
    return result;
  } catch {
    return [];
  }
}

export function serializeGridViewMemory(
  columns: readonly GridColumnLayout[],
  permittedKeys: readonly string[],
): string {
  const allowed = new Set(permittedKeys);
  const used = new Set<string>();
  return JSON.stringify(columns.filter(column => {
    if (!allowed.has(column.key) || used.has(column.key)) return false;
    used.add(column.key);
    return true;
  }).map(column => ({
    key: column.key,
    width: Math.max(100, Math.min(500, Math.round(column.width))),
    pinned: Boolean(column.pinned),
    hidden: Boolean(column.hidden),
  })));
}
