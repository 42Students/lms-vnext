import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export type FacultyContactRow = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
  phoneE164: string | null;
  roles: string[];
};

function displayName(contact: FacultyContactRow) {
  return (
    contact.displayName?.trim() ||
    contact.email?.trim() ||
    `Contact ${contact.membershipId.slice(0, 8)}`
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    (parts.length > 1
      ? `${parts[0]![0]}${parts.at(-1)![0]}`
      : parts[0]?.slice(0, 2)) || "C"
  ).toUpperCase();
}

function roleLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function FacultyContactsTable({
  items,
  showRoles,
}: {
  items: readonly FacultyContactRow[];
  showRoles: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No contacts found"
        description="Try another search or contact tab."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead className="bg-surface-subtle text-xs uppercase tracking-[0.06em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contact</th>
              {showRoles ? (
                <th className="px-4 py-3">Role</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((contact) => {
              const name = displayName(contact);
              return (
                <tr key={contact.membershipId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary-text"
                      >
                        {initials(name)}
                      </span>
                      <span className="font-semibold text-foreground">
                        {name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.phoneE164 ? (
                      <a
                        href={`tel:${contact.phoneE164}`}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {contact.phoneE164}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {showRoles ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {contact.roles.map((role) => (
                          <StatusBadge key={role} tone="info">
                            {roleLabel(role)}
                          </StatusBadge>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((contact) => {
          const name = displayName(contact);
          return (
            <article
              key={contact.membershipId}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary-text"
                >
                  {initials(name)}
                </span>
                <div className="min-w-0">
                  <h2 className="m-0 text-sm font-semibold text-foreground">
                    {name}
                  </h2>
                  {showRoles ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {contact.roles.map((role) => (
                        <StatusBadge key={role} tone="info">
                          {roleLabel(role)}
                        </StatusBadge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="break-all font-semibold text-primary-text"
                  >
                    {contact.email}
                  </a>
                ) : null}
                {contact.phoneE164 ? (
                  <a
                    href={`tel:${contact.phoneE164}`}
                    className="font-semibold text-primary-text"
                  >
                    {contact.phoneE164}
                  </a>
                ) : null}
                {!contact.email &&
                !contact.phoneE164 ? (
                  <span className="text-muted-foreground">
                    Contact details unavailable
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export function FacultyContactsPagination({
  page,
  totalPages,
  baseHref,
  search,
}: {
  page: number;
  totalPages: number;
  baseHref: string;
  search: string;
}) {
  if (totalPages <= 1) return null;

  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
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
