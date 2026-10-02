"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type OrganizationOption = {
  id: string;
  name: string;
};

export function CollegeCreateForm({
  organizations,
}: {
  organizations: readonly OrganizationOption[];
}) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(
    organizations[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/colleges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, name, code }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Could not create college");
        return;
      }

      setName("");
      setCode("");
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
          College name
        </label>
        <Input
          id="college-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={255}
          placeholder="College name"
        />
      </div>
      <div>
        <label
          htmlFor="college-code"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Code
        </label>
        <Input
          id="college-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
          maxLength={64}
          placeholder="CODE"
        />
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
        {pending ? "Creating…" : "Create college"}
      </Button>
      {error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-error lg:col-span-4">
          {error}
        </p>
      ) : null}
    </form>
  );
}
