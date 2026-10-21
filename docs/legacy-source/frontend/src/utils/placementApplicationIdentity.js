export function getPlacementApplicationId(row) {
  const raw = row?.application?.id ?? row?.id ?? row?.applicationId;
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function findPlacementJourneyByApplicationId(rows, applicationId) {
  const target = Number(applicationId);
  if (!Number.isFinite(target) || !Array.isArray(rows)) return null;
  return rows.find((row) => getPlacementApplicationId(row) === target) ?? null;
}
