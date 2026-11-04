/**
 * Fail closed on ambiguous query selectors before an authenticated read
 * reaches a tenant- or recipient-scoped service. URLSearchParams.get()
 * silently chooses the first repeated value, which is unsafe when a
 * reverse proxy, compatibility adapter or client sees a different value.
 *
 * This validates selector *shape*, not authorization, UUID ownership or
 * persistence. Callers must continue to check those independently.
 */
export function hasAmbiguousQuerySelectors(
  params: URLSearchParams,
  keys: readonly string[],
  aliases: readonly (readonly string[])[] = [],
  requiredWhenPresent: readonly string[] = [],
): boolean {
  for (const key of keys) {
    if (params.getAll(key).length > 1) return true;
  }
  for (const group of aliases) {
    if (group.filter(key => params.has(key)).length > 1) return true;
  }
  for (const key of requiredWhenPresent) {
    if (params.has(key) && !params.get(key)?.trim()) return true;
  }
  return false;
}
