"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminScope } from "@/modules/identity/context";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

function selectedValue(scope: AdminScope | null | undefined) {
  if (scope?.collegeId) {
    return `college:${scope.collegeId}`;
  }

  if (scope?.organizationId) {
    return `organization:${scope.organizationId}`;
  }

  return "";
}

export function AdminScopeSwitcher({
  choices,
  scope,
}: {
  choices: AdminScopeChoices;
  scope: AdminScope | null | undefined;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [search,setSearch]=useState("");
  const visibleColleges=choices.colleges.filter(college=>
    (college.name+" "+college.organizationName).toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN")));
  const [pending, startTransition] = useTransition();

  function switchScope(value: string) {
    if (pending || value === selectedValue(scope)) return;
    setError(null);

    startTransition(async () => {
      try {
      let response: Response;

      if (!value) {
        response = await fetch("/api/auth/admin-scope", {
          method: "DELETE", credentials: "same-origin",
        });
      } else {
        const [kind, id] = value.split(":");
        const body =
          kind === "organization"
            ? { kind, organizationId: id }
            : { kind: "college", collegeId: id };

        response = await fetch("/api/auth/admin-scope", {
          method: "POST", credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) {
        setError("Could not change admin scope.");
        return;
      }

      router.refresh();
      } catch {
        setError("Could not change admin scope. Check your connection and retry.");
      }
    });
  }

  return (
    <div className="grid w-full min-w-0 max-w-64 gap-[var(--lms-space-2)]">
      <label className="sr-only" htmlFor="admin-scope-switcher">
        Super Admin scope
      </label>
      <details className="group min-w-0">
        <summary className="flex min-h-9 cursor-pointer items-center text-sm font-semibold text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Search colleges</summary>
        <label htmlFor="admin-college-search" className="sr-only">Search colleges</label>
        <Input id="admin-college-search" type="search" value={search} onChange={event=>setSearch(event.target.value)}
          placeholder="Search colleges" aria-label="Search colleges" className="mt-[var(--lms-space-2)] w-full"/>
      </details>
      <Select
        id="admin-scope-switcher"
        value={selectedValue(scope)}
        disabled={pending}
        aria-busy={pending}
        onChange={(event) => switchScope(event.target.value)}
        className="w-full min-w-0"
      >
        <option value="">All colleges</option>
        {choices.organizations.length > 0 ? (
          <optgroup label="Organizations">
            {choices.organizations.map((organization) => (
              <option
                key={organization.id}
                value={`organization:${organization.id}`}
              >
                {organization.name}
              </option>
            ))}
          </optgroup>
        ) : null}
        {choices.colleges.length > 0 ? (
          <optgroup label="Colleges">
            {visibleColleges.map((college) => (
              <option
                key={college.id}
                value={`college:${college.id}`}
              >
                {college.organizationName} · {college.name}
              </option>
            ))}
          </optgroup>
        ) : null}
      </Select>
      {pending ? <p role="status" className="min-w-0 break-words text-xs text-muted-foreground">Switching workspace…</p> : null}
      {!scope?.collegeId && !scope?.organizationId ? <p className="mt-1 text-xs text-muted-foreground">Showing all colleges — data may be large.</p> : null}
      {search.trim() && visibleColleges.length===0?<p role="status" className="mt-1 text-xs text-muted-foreground">No matching colleges.</p>:null}
      {error ? (
        <p role="alert" className="min-w-0 break-words text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
