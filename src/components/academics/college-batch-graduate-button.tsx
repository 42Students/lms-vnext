"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-fetch";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

/** Legacy BatchPromotion.js: guarded one-click "Mark graduated" on a final-semester row. */
export function CollegeBatchGraduateButton({ cohortId, batchName }: { cohortId: string; batchName: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  function graduate() {
    if (pending) return;
    setNotice("");
    startTransition(async () => {
      try {
        await apiFetch("/api/college/batches/" + encodeURIComponent(cohortId) + "/graduate", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        });
        setOpen(false);
        showToast({ tone: "success", title: `Marked “${batchName}” as graduated (Completed).` });
        router.refresh();
      } catch (error) {
        setOpen(false);
        setNotice(academicSetupErrorMessage(error, "Unable to graduate batch."));
      }
    });
  }
  return <>
    <Button type="button" variant="secondary" disabled={pending} aria-label={"Mark graduated: " + batchName}
      style={{ minHeight: 44 }} onClick={() => setOpen(true)}>Mark graduated</Button>
    <ConfirmDialog open={open} onOpenChange={next => { if (!pending) setOpen(next); }}
      title={`Graduate “${batchName}”?`}
      description="Semester promotion is finished for this batch. Marking it Completed removes it from this list; it can be reactivated from Batches → Edit."
      confirmLabel="Mark graduated" pending={pending} onConfirm={graduate} />
    {notice ? <Alert tone="error" className="mt-2">{notice}</Alert> : null}
  </>;
}
