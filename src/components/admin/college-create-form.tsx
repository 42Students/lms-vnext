"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {tenantCreationScopeRequest} from "@/modules/colleges/admin-tenant-create-handoff";

export type OrganizationOption = {
  id: string;
  name: string;
};

export function CollegeCreateForm({
  organizations,
  advanceToSetup = false,
  preferredOrganizationId,
}: {
  organizations: readonly OrganizationOption[];
  advanceToSetup?: boolean;
  preferredOrganizationId?: string;
}) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(
    preferredOrganizationId ?? organizations[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city,setCity]=useState(""),[state,setState]=useState(""),
   [addressLine1,setAddressLine1]=useState(""),[addressLine2,setAddressLine2]=useState(""),
   [landmark,setLandmark]=useState(""),[postalCode,setPostalCode]=useState(""),
   [country,setCountry]=useState("India");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/colleges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, name, code,
          city,state,addressLine1,addressLine2,landmark,postalCode,country }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Could not create college");
        return;
      }

      if (advanceToSetup) {
        const payload: unknown = await response.json().catch(() => null);
        const request = tenantCreationScopeRequest(payload);
        if (!request) {
          setError("College created, but the setup handoff was unavailable. Select it from the scope switcher.");
          router.refresh();
          return;
        }
        const scopeResponse = await fetch("/api/auth/admin-scope", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request),
        });
        if (!scopeResponse.ok) {
          setError("College created, but selecting it failed. Choose the new college in the scope switcher before setup.");
          router.refresh();
          return;
        }
        router.push("/admin/tenants/setup");
        router.refresh();
        return;
      }
      setName("");
      setCode("");
      setCity("");setState("");setAddressLine1("");setAddressLine2("");
      setLandmark("");setPostalCode("");setCountry("India");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 lg:grid-cols-[1fr_1fr_12rem_auto] lg:items-end"
    >
      <div>
        <label
          htmlFor="college-organization"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Organization
        </label>
        <Select
          id="college-organization"
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          required
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label
          htmlFor="college-name"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          College Name
        </label>
        <Input
          id="college-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={255}
          placeholder="e.g., Engineering College"
        />
      </div>
      <div>
        <label
          htmlFor="college-code"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Unique ID / Code
        </label>
        <Input
          id="college-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
          maxLength={64}
          placeholder="e.g., nsrit or eng-college"
        />
      </div>
      <div className="space-y-3 lg:col-span-4">
       <details className="rounded-md border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold">Address details (optional)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
         {([
          ["City",city,setCity,128],["State",state,setState,128],
          ["Address",addressLine1,setAddressLine1,255],["Address line 2",addressLine2,setAddressLine2,255],
          ["Landmark",landmark,setLandmark,255],["Pin Code",postalCode,setPostalCode,32],
          ["Country",country,setCountry,128],
         ] as const).map(([label,value,setter,maxLength])=><label key={label} className="grid gap-1 text-xs font-semibold">
          {label}<input value={value} onChange={e=>setter(e.target.value)} maxLength={maxLength}
           className="min-h-10 rounded border border-border bg-background px-2 text-sm"/>
         </label>)}
        </div>
       </details>
       <p className="text-xs text-muted-foreground">Unique ID / Code identifies this college across links and integrations. Choose it carefully; it is not editable after creation.</p>
      </div>
      <Button
        type="submit"
        disabled={
          pending ||
          !organizationId ||
          !name.trim() ||
          !code.trim()
        }
      >
        {pending ? "Creating…" : "Create College"}
      </Button>
      {error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-error lg:col-span-4">
          {error}
        </p>
      ) : null}
    </form>
  );
}
