"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DepartmentCreateForm({
  collegeId,
}: {
  collegeId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collegeId, name }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Could not create department");
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
          htmlFor="department-name"
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Department name
        </label>
        <Input
          id="department-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={255}
          placeholder="e.g. Computer Science"
        />
      </div>
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "Create department"}
      </Button>
      {error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-error sm:w-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
