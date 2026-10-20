"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
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
      <Dropdown trigger="Actions" label="Organization actions" mobileSheet align="end" className="print:hidden" triggerClassName="md:!min-h-9">
        <Menu className="w-full min-w-0">
          <MenuItem onClick={() => { setNextName(name); setRenameOpen(true); }}>Rename</MenuItem>
          <MenuItem onClick={() => setArchiveOpen(true)}>Archive</MenuItem>
        </Menu>
      </Dropdown>

      <Dialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename organization"
        description="The active-name uniqueness rule is enforced by the server."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
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
          </div>
        }
      >
        <label
          htmlFor={`organization-name-${organizationId}`}
          className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
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
