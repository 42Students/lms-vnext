import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table } from "@/components/ui/table";
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
  const contactHref = (id:string) => detailBaseHref
    ? detailBaseHref+"/"+encodeURIComponent(id)+detailQuery : null;
  return <>
    <div aria-label="Contacts directory" className="min-w-0 divide-y divide-border border-y border-border sm:hidden">
      {items.map(item=>{
        const name=item.displayName?.trim()||"Name not recorded";
        const href=contactHref(item.membershipId);
        return <article key={item.membershipId} className="min-w-0 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {href?<Link href={href}
              className="inline-flex min-h-11 max-w-full items-center break-words text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{name}</Link>:name}
          </h2>
          <p className="mt-1 text-sm leading-5 text-body">Email: Private</p>
          <p className="mt-1 text-sm leading-5 text-body">Contact: Private</p>
          <p className="mt-1 text-sm leading-5 text-body">Department: {item.departmentName??"Not recorded"}</p>
          {showRoles||item.roles.length>0?<ul aria-label="Current college roles" className="mt-2 flex flex-wrap gap-2">
            {item.roles.map(role=><li key={role}><StatusBadge tone="info">{facultyContactRoleLabel(role)}</StatusBadge></li>)}
          </ul>:null}
        </article>;
      })}
    </div>
    <Table aria-label="Contacts directory" containerClassName="hidden sm:block">
      <thead><tr>
        <th scope="col">Name</th><th scope="col">Email</th><th scope="col">Contact</th><th scope="col">Role</th>
      </tr></thead>
      <tbody>{items.map(item=>{
        const name=item.displayName?.trim()||"Name not recorded";
        const href=contactHref(item.membershipId);
        return <tr key={item.membershipId}>
          <td className="min-w-40 font-semibold">
            {href?<Link href={href} className="inline-flex min-h-9 items-center break-words text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{name}</Link>:name}
            <span className="block text-xs font-normal text-muted-foreground">{item.departmentName??"Department not recorded"}</span>
          </td>
          <td className="min-w-32 text-muted-foreground">Private</td>
          <td className="min-w-32 text-muted-foreground">Private</td>
          <td><ul aria-label="Current college roles" className="flex min-w-0 flex-wrap gap-2">
            {(showRoles||item.roles.length>0)&&item.roles.map(role=><li key={role}><StatusBadge tone="info">{facultyContactRoleLabel(role)}</StatusBadge></li>)}
          </ul></td>
        </tr>;
      })}</tbody>
    </Table>
  </>;
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
