export function tpoStudentRequestShortcutFilters(
  search: string | undefined,
  pageSize: number | undefined,
  status?: string,
) {
  return { status, search, pageSize, page: 1 };
}
