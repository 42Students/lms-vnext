"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminScope } from "@/modules/identity/context";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import { Select } from "@/components/ui/select";

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
      <Select
        id="admin-scope-switcher"
        value={selectedValue(scope)}
        disabled={pending}
        onChange={(event) => switchScope(event.target.value)}
        className="min-h-10 py-0"
      >
        <option value="">All platform</option>
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
            {choices.colleges.map((college) => (
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
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
