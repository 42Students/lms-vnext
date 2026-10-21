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

export function FacultyContactsTable({items,showRoles,detailBaseHref,detailQuery="",search=""}:{
  items:readonly FacultyContactRow[];showRoles:boolean;detailBaseHref?:string;
  detailQuery?:string;
  search?:string;
}) {
  if(items.length===0) return <EmptyState title={search?'No contacts match “'+search+'”':"No contacts found"}
    description={search?"Try another name or department, or clear the search.":"No college directory members are visible in this contact tab. Private contact information is not displayed."} />;
  const contactHref = (id:string) => detailBaseHref
    ? detailBaseHref+"/"+encodeURIComponent(id)+detailQuery : null;
  const initials=(name:string)=>name==="—"?"?":name.split(/\s+/).slice(0,2).map(part=>part.slice(0,1).toUpperCase()).join("");
  const palette=["bg-sky-100 text-sky-800","bg-amber-100 text-amber-800","bg-emerald-100 text-emerald-800",
    "bg-indigo-100 text-indigo-800","bg-rose-100 text-rose-800","bg-orange-100 text-orange-800",
    "bg-teal-100 text-teal-800","bg-violet-100 text-violet-800"];
  const avatar=(item:FacultyContactRow,name:string)=>{
   const seed=[...item.membershipId].reduce((hash,ch)=>(hash*31+ch.charCodeAt(0))>>>0,7);
   return <span aria-hidden="true" className={"flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold "+palette[seed%palette.length]}>{initials(name)}</span>;
  };
  return <>
    <div aria-label="Contacts directory" className="min-w-0 divide-y divide-border border-y border-border min-[560px]:hidden">
      {items.map(item=>{
        const name=item.displayName?.trim()||"—";
        const href=contactHref(item.membershipId);
        return <article key={item.membershipId} className="min-w-0 rounded border-b border-border bg-surface px-3 py-4">
          <div className="flex min-w-0 items-start gap-3">{avatar(item,name)}<div className="min-w-0 flex-1">
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
          </div></div>
        </article>;
      })}
    </div>
    <Table aria-label="Contacts directory" containerClassName="hidden min-[560px]:block [&>table]:min-w-[560px]">
      <thead><tr>
        <th scope="col">Name</th><th scope="col">Department</th><th scope="col">Email</th><th scope="col">Contact</th>{showRoles?<th scope="col">Role</th>:null}
      </tr></thead>
      <tbody>{items.map(item=>{
        const name=item.displayName?.trim()||"—";
        const href=contactHref(item.membershipId);
        return <tr key={item.membershipId}>
          <td className="min-w-40 font-semibold">
            <div className="flex min-w-0 items-center gap-2">{avatar(item,name)}<div className="min-w-0">{href?<Link href={href} className="inline-flex min-h-9 items-center break-words text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{name}</Link>:name}
            </div></div>
          </td>
          <td className="min-w-28 text-muted-foreground">{item.departmentName??"—"}</td>
          <td className="min-w-32 text-muted-foreground">Private</td>
          <td className="min-w-32 text-muted-foreground">Private</td>
          {showRoles?<td><ul aria-label="Current college roles" className="flex min-w-0 flex-wrap gap-2">
            {(showRoles||item.roles.length>0)&&item.roles.map(role=><li key={role}><StatusBadge tone="info">{facultyContactRoleLabel(role)}</StatusBadge></li>)}
          </ul></td>:null}
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
