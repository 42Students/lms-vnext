import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
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
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {items.map(item=>{
      const name=item.displayName?.trim()||"Name not recorded";
      return <article key={item.membershipId}
        className="border-b border-border py-3 last:border-0">
        <h2 className="text-sm font-semibold text-foreground">
          {detailBaseHref?<Link
            href={detailBaseHref+"/"+encodeURIComponent(item.membershipId)+detailQuery}
            className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] hover:underline md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">{name}</Link>:name}
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

  return <Pagination page={page} pageCount={totalPages}
    hrefForPage={href} label="Contacts pages" showBoundaryLinks={false} />;
}
