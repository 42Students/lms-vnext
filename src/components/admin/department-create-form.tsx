"use client";

import { useState } from "react";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";

export function DepartmentCreateForm({
  collegeId,
}: {
  collegeId: string;
}) {
  void collegeId; // College identity comes from the request context on every mutation.
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {pending,run} = useGuardedAction({timeoutMs:30000});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!name.trim()) { setError("Please enter department name"); return; }
    if (name.trim().length > 255) { setError("Department name must be 255 characters or less"); return; }

    void run(async () => {
      try {
      const response = await fetch("/api/college/departments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const conflict = payload && typeof payload === "object" && "error" in payload && payload.error === "DEPARTMENT_NAME_CONFLICT";
        setError(conflict ? "Department was not created. That department name is already active in this college." : DEPARTMENT_COPY.createFailed + ". Please check the name and try again.");
        return;
      }

      setNotice(`Created department “${name.trim()}”. Next, add programs or courses under it.`);
      setName("");
      router.refresh();
      } catch { setError(DEPARTMENT_COPY.createFailed + ". Please try again."); }
    }).catch(() => setError(DEPARTMENT_COPY.createFailed + ". Please try again."));
  }

  return (
    <form
      onSubmit={submit}
      aria-label={DEPARTMENT_COPY.createCardTitle}
      className="flex flex-wrap items-end gap-3 print:hidden"
    >
      <h2 className="m-0 w-full text-base font-semibold text-foreground">{DEPARTMENT_COPY.createCardTitle}</h2>
      <div className="min-w-48 flex-1">
        <label
          htmlFor="department-name"
          className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
        >
          {DEPARTMENT_COPY.nameLabel}
        </label>
        <Input
          className="min-h-11 md:min-h-9" id="department-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={255}
          placeholder={DEPARTMENT_COPY.namePlaceholder}
        />
      </div>
      <Button type="submit" className="min-h-11 md:min-h-9" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : DEPARTMENT_COPY.createButton}
      </Button>
      {notice ? <p role="status" className="m-0 w-full text-sm text-body">{notice}</p> : null}
      {error ? (
        <p role="alert" className="m-0 w-full text-xs font-semibold text-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
