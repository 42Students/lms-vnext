"use client";

import {
  useRef,
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
  const [discardRenameOpen,setDiscardRenameOpen]=useState(false);
  const [nextName, setNextName] = useState(name);
  const [pending, startTransition] = useTransition();
  const inFlightRef=useRef(false);
  function requestRenameClose(){
    if(pending||inFlightRef.current)return;
    if(nextName.trim()!==name.trim()){setDiscardRenameOpen(true);return;}
    setRenameOpen(false);
  }
  function discardRename(){
    if(pending||inFlightRef.current)return;
    setDiscardRenameOpen(false);
    setNextName(name);
    setRenameOpen(false);
  }

  function rename() {
    if(pending||inFlightRef.current||!nextName.trim())return;
    inFlightRef.current=true;
    startTransition(async () => {
      try {
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
          title: "Failed to update organization: "+(payload?.error === "ORGANIZATION_NAME_CONFLICT" ? "Organization name already exists" : "The organization could not be renamed."),
        });
        return;
      }

      setRenameOpen(false);
      setDiscardRenameOpen(false);
      showToast({
        tone: "success",
        title: "Updated organization “"+nextName.trim()+"”.",
      });
      router.refresh();
      }catch{showToast({tone:"error",title:"Failed to update organization: The organization could not be renamed."});}
      finally{inFlightRef.current=false;}
    });
  }

  function archive() {
    if(pending||inFlightRef.current)return;
    inFlightRef.current=true;
    startTransition(async () => {
      try {
      const response = await fetch(
        `/api/organizations/${organizationId}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast({
          tone: "error",
          title: "Failed to archive organization: "+(payload?.error === "ORGANIZATION_HAS_COLLEGES"
            ? "Cannot archive organization: colleges exist under this organization"
            : "The organization could not be archived."),
        });
        return;
      }

      setArchiveOpen(false);
      showToast({
        tone: "success",
        title: "Archived organization “"+name+"”.",
      });
      router.refresh();
      }catch{showToast({tone:"error",title:"Failed to archive organization: The organization could not be archived."});}
      finally{inFlightRef.current=false;}
    });
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 print:hidden">
        <Button type="button" variant="secondary" size="sm" disabled={pending}
          title="Edit organization" aria-label={"Edit organization "+name}
          onClick={()=>{setNextName(name);setRenameOpen(true);}}>
          <span aria-hidden="true">✎</span> Edit
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={pending}
          title="Archive rather than permanently delete this organization"
          aria-label={"Archive organization "+name} onClick={()=>setArchiveOpen(true)}>
          <span aria-hidden="true">⌫</span> Archive
        </Button>
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={next=>{if(next)setRenameOpen(true);else requestRenameClose();}}
        dismissible={!pending}
        title="Edit Organization"
        description="The active-name uniqueness rule is enforced by the server."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              variant="secondary"
              className="min-h-11 w-full md:min-h-9 md:w-auto"
              disabled={pending}
              onClick={requestRenameClose}
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
              {pending ? "Saving…" : "Save Changes"}
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
        open={discardRenameOpen}
        onOpenChange={next=>{if(!next&&!pending)setDiscardRenameOpen(false);}}
        title="Discard changes to this organization?"
        description="Your unsaved edits will be lost."
        confirmLabel="Discard changes" confirmVariant="danger"
        onConfirm={discardRename}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={next=>{if(!pending)setArchiveOpen(next);}}
        title={`Archive ${name}?`}
        description="This archives rather than permanently deletes the organization. It is allowed only when no active colleges exist."
        confirmLabel="Archive organization" confirmVariant="danger"
        pending={pending}
        onConfirm={archive}
      />
    </>
  );
}
