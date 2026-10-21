"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api-fetch";
import { classLifecyclePrompt } from "@/modules/academics/college-section-lifecycle-model";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

export function CollegeSectionLifecycleAction({ row }: {
  row: { id: string; name: string; status: "ACTIVE" | "ARCHIVED"; updatedAt: string };
}) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const action = row.status === "ACTIVE" ? "ARCHIVE" : "RESTORE";

  function change() {
    if (inFlight.current || pending) return;
    inFlight.current = true;
    setError("");
    startTransition(async () => {
      try {
        await apiFetch("/api/college/classes/" + encodeURIComponent(row.id) + "/lifecycle", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, expectedUpdatedAt: row.updatedAt, confirm: true }),
        });
        setConfirming(false);
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "We couldn't update this class. Please retry.");
      } finally {
        inFlight.current = false;
      }
    });
  }

  return <div className="min-w-0">
    <Button variant="secondary" type="button" disabled={pending}
      className="min-h-11 w-full sm:w-auto md:min-h-9"
      onClick={() => { setError(""); setConfirming(true); }}>
      {pending ? "Saving…" : action === "ARCHIVE" ? "Archive" : "Restore"}
    </Button>
    <ConfirmDialog open={confirming} onOpenChange={setConfirming}
      title={action === "ARCHIVE" ? "Archive class" : "Restore class"}
      description={classLifecyclePrompt(row.name, action)}
      confirmLabel={action === "ARCHIVE" ? "Archive class" : "Restore class"}
      confirmVariant={action === "ARCHIVE" ? "danger" : "primary"}
      pending={pending} onConfirm={change}>
      {error ? <Alert tone="error" className="mt-3">{error}</Alert> : null}
    </ConfirmDialog>
  </div>;
}
