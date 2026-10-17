"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {createdOrganizationStepHref} from "@/modules/colleges/admin-tenant-organization-step";

export function OrganizationCreateForm({ advanceToCollege = false }: { advanceToCollege?: boolean } = {}) {
  const router = useRouter();
  const {showToast}=useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanName=name.trim().replace(/\s+/g," ");
    if(!cleanName){setError("Please enter organization name");return;}
    startTransition(async () => {
      try {
        const payload=await apiFetch<unknown>("/api/organizations",{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({name:cleanName}),
        });
        showToast({title:"Created organization “"+cleanName+"”.",tone:"success"});
        if(advanceToCollege){
          const href=createdOrganizationStepHref(payload);
          if(!href){
            setError("Organization created, but the college step could not be selected. Refresh to choose the organization.");
            router.refresh();return;
          }
          router.push(href);router.refresh();return;
        }
        setName("");router.refresh();
      } catch(cause) {
        setError(cause instanceof FriendlyFetchError && cause.status===409
          ? "Organization name already exists"
          :cause instanceof Error ? cause.message
          : "Could not create organization. Please try again.");
      }
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
          placeholder="e.g., ABC University"
        />
      </div>
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "Create Organization"}
      </Button>
      {error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-error sm:w-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
