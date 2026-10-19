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
    setError(null);

    startTransition(async () => {
      let response: Response;

      if (!value) {
        response = await fetch("/api/auth/admin-scope", {
          method: "DELETE",
        });
      } else {
        const [kind, id] = value.split(":");
        const body =
          kind === "organization"
            ? { kind, organizationId: id }
            : { kind: "college", collegeId: id };

        response = await fetch("/api/auth/admin-scope", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) {
        setError("Could not change admin scope.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="w-48 min-w-0 sm:w-64">
      <label className="sr-only" htmlFor="admin-scope-switcher">
        Super Admin scope
      </label>
      <label htmlFor="admin-college-search" className="sr-only">Search colleges</label>
      <Input id="admin-college-search" type="search" value={search} onChange={event=>setSearch(event.target.value)}
       placeholder="Search colleges" aria-label="Search colleges" className="mb-1 min-h-9 w-full text-sm"/>
      <Select
        id="admin-scope-switcher"
        value={selectedValue(scope)}
        disabled={pending}
        onChange={(event) => switchScope(event.target.value)}
        className="min-h-10 py-0"
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
      {!scope?.collegeId && !scope?.organizationId ? <p className="mt-1 text-xs text-muted-foreground">Showing all colleges — data may be large.</p> : null}
      {search.trim() && visibleColleges.length===0?<p role="status" className="mt-1 text-xs text-muted-foreground">No matching colleges.</p>:null}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
