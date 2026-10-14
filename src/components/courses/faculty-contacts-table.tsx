import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { facultyContactRoleLabel } from "@/modules/courses/faculty-contact-detail-model";

export type FacultyContactRow={
  membershipId:string;displayName:string|null;
  departmentName:string|null;roles:string[];
};

export function FacultyContactsTable({items,showRoles,detailBaseHref,detailQuery=""}:{
  items:readonly FacultyContactRow[];showRoles:boolean;detailBaseHref?:string;
  detailQuery?:string;
}) {
  if(items.length===0) return <EmptyState title="No public directory members found"
    description="Try another name, department or contact tab. Private contact information is not displayed." />;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {items.map(item=>{
      const name=item.displayName?.trim()||"Name not recorded";
      return <article key={item.membershipId}
        className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">
          {detailBaseHref?<Link
            href={detailBaseHref+"/"+encodeURIComponent(item.membershipId)+detailQuery}
            className="text-primary-text hover:underline">{name}</Link>:name}
        </h2>
        <p className="mt-2 text-sm text-body">Department: {item.departmentName??"Not recorded"}</p>
        {showRoles||item.roles.length>0?<ul
          aria-label="Current college roles" className="mt-3 flex flex-wrap gap-2">
          {item.roles.map(role=><li key={role}>
            <StatusBadge tone="info">{facultyContactRoleLabel(role)}</StatusBadge>
          </li>)}
        </ul>:null}
      </article>;
    })}
  </div>;
}

export function FacultyContactsPagination({
  page,
  totalPages,
  baseHref,
  search,
  pageSize,
}: {
  page: number;
  totalPages: number;
  baseHref: string;
  search: string;
  pageSize: number;
}) {
  if (totalPages <= 1) return null;

  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("pageSize", String(pageSize));
    params.set("page", String(nextPage));
    return `${baseHref}?${params.toString()}`;
  };

  return (
    <nav
      aria-label="Contacts pages"
      className="flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-body hover:border-primary hover:text-primary-text"
        >
          Previous
        </Link>
      ) : (
        <span className="min-h-10 px-3" />
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-body hover:border-primary hover:text-primary-text"
        >
          Next
        </Link>
      ) : (
        <span className="min-h-10 px-3" />
      )}
    </nav>
  );
}
