import { Pagination } from "@/components/ui/pagination";
import { peoplePageState } from "@/modules/admin-ui/people-pagination";

export function PeoplePagination({
  basePath,
  page,
  total,
  pageSize,
}: {
  basePath: "/college/people" | "/admin/people";
  page: number;
  total: number;
  pageSize: number;
}) {
  const state = peoplePageState(page, total, pageSize);
  const link = (target: number) => target === 1
    ? basePath : `${basePath}?page=${target}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="m-0 text-muted-foreground" aria-live="polite">
        {state.total === 0 ? "No people found" : `Showing ${state.first}–${state.last} of ${state.total} people`}
      </p>
      <Pagination label="People directory pages" page={state.page}
        pageCount={state.pages} hrefForPage={link} />
    </div>
  );
}
