"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TpoRoundCheckIn({
  roundId, applicationId, displayName, attendance, roundStatus,
}: {
  roundId: string; applicationId: string; displayName: string;
  attendance: string; roundStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<"PRESENT" | "ABSENT" | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!["WAITING", "PRESENT", "ABSENT"].includes(attendance) ||
      roundStatus === "CANCELLED" || roundStatus === "COMPLETED") return null;
  async function mark(status: "PRESENT" | "ABSENT") {
    if (busy) return;
    setTarget(null);
    setBusy(true); setError(null);
    try {
      const response = await fetch(
        "/api/placements/tpo/drive-day/" + encodeURIComponent(roundId) + "/check-in",
        {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmed: true, applicationId,
            expectedAttendance: attendance, status }),
        },
      );
      if (!response.ok) throw new Error(
        "Attendance has changed or could not be saved. Refresh the round before retrying.",
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Check-in failed.");
    } finally { setBusy(false); }
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attendance !== "PRESENT" ? (
        <Button variant="secondary" type="button" disabled={busy} onClick={() => setTarget("PRESENT")}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 text-xs font-semibold text-primary-text disabled:opacity-60">
          Mark checked-in
        </Button>
      ) : null}
      {attendance !== "ABSENT" ? (
        <Button variant="secondary" type="button" disabled={busy} onClick={() => setTarget("ABSENT")}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 text-xs font-semibold text-primary-text disabled:opacity-60">
          Mark no-show
        </Button>
      ) : null}
      {error ? <InlineNotice tone="error" message={error}/> : null}
      <ConfirmDialog open={target !== null}
        onOpenChange={next => { if (!next && !busy) setTarget(null); }}
        title={"Confirm "+(target === "ABSENT" ? "no-show" : "checked-in")+"?"}
        description={"Confirm "+(target === "ABSENT" ? "no-show" : "checked-in")+" for "+displayName+"? This records an audited attendance change."}
        confirmLabel={target === "ABSENT" ? "Mark no-show" : "Mark checked-in"}
        confirmVariant={target === "ABSENT" ? "danger" : "primary"} pending={busy}
        onConfirm={() => { if (target) void mark(target); }}/>
    </div>
  );
}
