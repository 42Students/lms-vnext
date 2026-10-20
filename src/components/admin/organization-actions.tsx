"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function OrganizationActions({
  organizationId,
  name,
}: {
  organizationId: string;
  name: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [nextName, setNextName] = useState(name);
  const [pending, startTransition] = useTransition();

  function rename() {
    startTransition(async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: nextName }),
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Rename failed",
          description:
            payload?.error === "ORGANIZATION_NAME_CONFLICT"
              ? "Another active organization already uses that name."
              : "The organization could not be renamed.",
        });
        return;
      }

      setRenameOpen(false);
      showToast({
        tone: "success",
        title: "Organization renamed",
      });
      router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Archive blocked",
          description:
            payload?.error === "ORGANIZATION_HAS_COLLEGES"
              ? "Archive or move active colleges before archiving this organization."
              : "The organization could not be archived.",
        });
        return;
      }

      setArchiveOpen(false);
      showToast({
        tone: "success",
        title: "Organization archived",
      });
      router.refresh();
    });
  }

  return (
    <>
      <details className="group min-w-0 text-left print:hidden">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-[var(--lms-space-3)] text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Actions</summary>
        <div className="mt-[var(--lms-space-2)] flex min-w-0 flex-col gap-[var(--lms-space-2)]">
          <Button type="button" variant="secondary" size="sm" className="min-h-11 md:min-h-9"
            onClick={() => { setNextName(name); setRenameOpen(true); }}>Rename</Button>
          <Button type="button" variant="ghost" size="sm" className="min-h-11 md:min-h-9"
            onClick={() => setArchiveOpen(true)}>Archive</Button>
        </div>
      </details>

      <Dialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename organization"
        description="The active-name uniqueness rule is enforced by the server."
        footer={
          <>
            <Button
              variant="secondary"
              className="min-h-11 w-full md:min-h-9 md:w-auto"
              disabled={pending}
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="min-h-11 w-full md:min-h-9 md:w-auto"
              disabled={
                pending ||
                !nextName.trim() ||
                nextName.trim() === name
              }
              onClick={rename}
            >
              {pending ? "Saving…" : "Save name"}
            </Button>
          </>
        }
      >
        <label
          htmlFor={`organization-name-${organizationId}`}
          className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
        >
          Organization name
        </label>
        <Input
          className="min-h-11 md:min-h-9"
          id={`organization-name-${organizationId}`}
          value={nextName}
          onChange={(event) =>
            setNextName(event.target.value)
          }
          maxLength={255}
        />
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${name}?`}
        description="This is allowed only when the organization has no active colleges."
        confirmLabel="Archive organization" confirmVariant="danger"
        pending={pending}
        onConfirm={archive}
      />
    </>
  );
}
