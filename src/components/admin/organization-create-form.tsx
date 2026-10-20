"use client";

import { useState } from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useFormDraft} from "@/hooks/use-form-draft";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {createdOrganizationStepHref} from "@/modules/colleges/admin-tenant-organization-step";

export function OrganizationCreateForm({ advanceToCollege = false }: { advanceToCollege?: boolean } = {}) {
  const router = useRouter();
  const {showToast}=useToast();
  const {draft,setDraft,restored,clearDraft}=useFormDraft("admin-create-organization",{name:""});
  const name=draft.name;
  const setName=(value:string)=>setDraft({...draft,name:value});
  const [error, setError] = useState<string | null>(null);
  const {pending,run:guardedRun}=useGuardedAction({busyLabel:"Creating..."});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanName=name.trim().replace(/\s+/g," ");
    if(!cleanName){setError("Please enter organization name");return;}
    void guardedRun(async () => {
      try {
        const payload=await apiFetch<unknown>("/api/organizations",{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({name:cleanName}),
        });
        showToast({title:"Created organization “"+cleanName+"”.",tone:"success"});
        clearDraft();
        if(advanceToCollege){
          const href=createdOrganizationStepHref(payload);
          if(!href){
            setError("Organization created, but the college step could not be selected. Refresh to choose the organization.");
            router.refresh();return;
          }
          router.push(href);router.refresh();return;
        }
        setName("");clearDraft();router.refresh();
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
      className="flex min-w-0 flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-end print:hidden"
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor="organization-name"
          className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
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
      <Button type="submit" disabled={pending || !name.trim()} loading={pending}>
        {pending ? "Creating…" : "Create Organization"}
      </Button>
      {restored?<Alert tone="info" className="md:w-full">Draft restored</Alert>:null}
      {error ? (
        <Alert tone="error" className="md:w-full">
          {error}
        </Alert>
      ) : null}
    </form>
  );
}
