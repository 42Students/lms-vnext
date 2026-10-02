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
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setNextName(name);
            setRenameOpen(true);
          }}
        >
          Rename
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setArchiveOpen(true)}
        >
          Archive
        </Button>
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename organization"
        description="The active-name uniqueness rule is enforced by the server."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
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
          className="mb-1.5 block text-xs font-semibold text-body"
        >
          Organization name
        </label>
        <Input
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
        confirmLabel="Archive organization"
        pending={pending}
        onConfirm={archive}
      />
    </>
  );
}
