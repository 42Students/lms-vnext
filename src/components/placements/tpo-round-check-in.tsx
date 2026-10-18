"use client";
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
  const [error, setError] = useState<string | null>(null);
  if (!["WAITING", "PRESENT", "ABSENT"].includes(attendance) ||
      roundStatus === "CANCELLED" || roundStatus === "COMPLETED") return null;
  async function mark(status: "PRESENT" | "ABSENT") {
    if (busy || !window.confirm(
      "Confirm " + (status === "PRESENT" ? "checked-in" : "no-show") +
      " for " + displayName + "? This records an audited attendance change.",
    )) return;
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
        <button type="button" disabled={busy} onClick={() => void mark("PRESENT")}
          className="min-h-9 rounded-[9px] border border-border px-2 text-xs font-semibold text-primary-text disabled:opacity-60">
          Mark checked-in
        </button>
      ) : null}
      {attendance !== "ABSENT" ? (
        <button type="button" disabled={busy} onClick={() => void mark("ABSENT")}
          className="min-h-9 rounded-[9px] border border-border px-2 text-xs font-semibold text-primary-text disabled:opacity-60">
          Mark no-show
        </button>
      ) : null}
      {error ? <p role="alert" className="w-full text-xs text-error">{error}</p> : null}
    </div>
  );
}
