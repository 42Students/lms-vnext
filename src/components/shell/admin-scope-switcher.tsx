"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminScope } from "@/modules/identity/context";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

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
  const {showToast}=useToast();
  const [error, setError] = useState<string | null>(null);
  const [search,setSearch]=useState("");
  const matchingColleges = choices.colleges.filter((college) =>
    (college.name + " " + college.organizationName).toLocaleLowerCase("en-IN")
      .includes(search.trim().toLocaleLowerCase("en-IN")));
  // A controlled select must keep its selected option mounted while searching.
  // Otherwise the browser shows a different scope from the one still active.
  const visibleColleges = choices.colleges.filter((college) =>
    college.id === scope?.collegeId || matchingColleges.includes(college));
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
        const feedback=value.startsWith("college:")
          ? "Couldn't switch to your saved college. Pick it again from the header."
          : "Could not change admin scope.";
        setError(feedback);
        showToast({tone:"error",title:feedback});
        return;
      }

      if(!value && choices.colleges.length>1)
        showToast({tone:"info",title:"Showing all colleges — data may be large."});
      router.refresh();
      } catch {
        const feedback="Failed to load colleges. Please refresh.";
        setError(feedback);
        showToast({tone:"error",title:feedback});
      }
    });
  }

  return (
    <div className="grid w-full min-w-0 max-w-64 gap-[var(--lms-space-2)]">
      <label className="sr-only" htmlFor="admin-scope-switcher">
        Super Admin scope
      </label>
      <details className="group min-w-0">
        <summary className="flex min-h-9 cursor-pointer items-center text-sm font-semibold text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] max-[767px]:min-h-11">Search colleges</summary>
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
        {visibleColleges.length > 0 ? (
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
      {search.trim() && matchingColleges.length===0?<p role="status" className="mt-1 text-xs text-muted-foreground">No matching colleges.</p>:null}
      {error ? (
        <p role="alert" className="min-w-0 break-words text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
