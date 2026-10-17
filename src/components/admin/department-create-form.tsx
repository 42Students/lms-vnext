"use client";

import { useState, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const response = await fetch("/api/college/departments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        setError(DEPARTMENT_COPY.createFailed);
        return;
      }

      setNotice(`Created department “${name.trim()}”. Next, add programs or courses under it.`);
      setName("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      aria-label={DEPARTMENT_COPY.createCardTitle}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <h2 className="m-0 w-full text-base font-semibold text-foreground">{DEPARTMENT_COPY.createCardTitle}</h2>
      <div className="min-w-48 flex-1">
        <label
          htmlFor="department-name"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          {DEPARTMENT_COPY.nameLabel}
        </label>
        <Input
          id="department-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={255}
          placeholder={DEPARTMENT_COPY.namePlaceholder}
        />
      </div>
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : DEPARTMENT_COPY.createButton}
      </Button>
      {notice ? <p role="status" className="m-0 w-full text-sm text-body">{notice}</p> : null}
      {error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-error sm:w-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
