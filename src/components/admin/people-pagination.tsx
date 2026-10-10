import Link from "next/link";
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
  const common = "inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle";
  return (
    <nav aria-label="People directory pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="m-0 text-muted-foreground" aria-live="polite">
        {state.total === 0 ? "No people found" : `Showing ${state.first}–${state.last} of ${state.total} people`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {state.hasPrevious
          ? <Link className={common} href={link(state.page - 1)}>Previous</Link>
          : <span aria-disabled="true" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-muted-foreground opacity-50">Previous</span>}
        <span className="text-muted-foreground">Page {state.page} of {state.pages}</span>
        {state.hasNext
          ? <Link className={common} href={link(state.page + 1)}>Next</Link>
          : <span aria-disabled="true" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-muted-foreground opacity-50">Next</span>}
      </div>
    </nav>
  );
}
