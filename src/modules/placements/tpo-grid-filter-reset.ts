/** Clear only this table's active filter dimensions; retain search, columns and unrelated URL state. */
export function clearTpoGridFilters(
  query: URLSearchParams,
  fields: readonly {key:string;urlKey?:string}[],
): URLSearchParams {
  const next = new URLSearchParams(query);
  for (const field of fields) next.delete(field.urlKey ?? "filter." + field.key);
  next.delete("page");
  return next;
}
