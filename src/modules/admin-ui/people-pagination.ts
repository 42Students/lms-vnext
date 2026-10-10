/**
 * W06 UI-only pager for the existing permission-checked people repository.
 * Only the selected college from server auth context may enter the query.
 */
export const PEOPLE_PAGE_SIZE = 50;

export function parsePeoplePage(value: string | undefined): number {
  if (!value || !/^[1-9]\d{0,5}$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export function peoplePageState(
  page: number,
  total: number,
  pageSize = PEOPLE_PAGE_SIZE,
) {
  const safeTotal = Math.max(0, Math.trunc(total));
  const safeSize = Math.max(1, Math.trunc(pageSize));
  const pages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const current = Math.max(1, Math.min(pages, Math.trunc(page)));
  return {
    page: current,
    pages,
    limit: safeSize,
    offset: (current - 1) * safeSize,
    total: safeTotal,
    first: safeTotal ? (current - 1) * safeSize + 1 : 0,
    last: Math.min(current * safeSize, safeTotal),
    hasPrevious: current > 1,
    hasNext: current < pages,
  };
}
