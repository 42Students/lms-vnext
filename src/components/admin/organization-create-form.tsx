"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {createdOrganizationStepHref} from "@/modules/colleges/admin-tenant-organization-step";

export function OrganizationCreateForm({ advanceToCollege = false }: { advanceToCollege?: boolean } = {}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Could not create organization");
        return;
      }

      if (advanceToCollege) {
        const payload:unknown=await response.json().catch(()=>null);
        const href=createdOrganizationStepHref(payload);
        if (!href) {
          setError("Organization created, but the college step could not be selected. Refresh to choose the organization.");
          router.refresh();
          return;
        }
        router.push(href);
        router.refresh();
        return;
      }
      setName("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor="organization-name"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Organization name
        </label>
        <Input
          id="organization-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={255}
          placeholder="e.g. 42 Education Trust"
        />
      </div>
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "Create organization"}
      </Button>
      {error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-error sm:w-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
