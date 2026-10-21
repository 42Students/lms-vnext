"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TpoRoundCheckIn({
  roundId, applicationId, displayName, attendance, roundStatus,rollNumber=null,
}: {
  roundId: string; applicationId: string; displayName: string;
  attendance: string; roundStatus: string;rollNumber?:string|null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<"PRESENT" | "ABSENT" | "IN_INTERVIEW" | "DONE" | null>(null);
  const [lastAction,setLastAction]=useState<string|null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!["WAITING", "PRESENT", "ABSENT","IN_INTERVIEW","DONE"].includes(attendance) ||
      roundStatus === "CANCELLED" || roundStatus === "COMPLETED") return null;
  async function mark(status: "PRESENT" | "ABSENT" | "IN_INTERVIEW" | "DONE") {
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
      if (!response.ok){
        const payload:unknown=await response.json().catch(()=>null);
        const explanation=payload&&typeof payload==="object"&&"message" in payload&&
         typeof payload.message==="string"&&payload.message.length<=200?payload.message:null;
        throw new Error(explanation??"Could not save");
      }
      const result:unknown=await response.json().catch(()=>null);
      if(!result||typeof result!=="object"||!("attendance" in result)||
         !result.attendance||typeof result.attendance!=="object"||
         !("status" in result.attendance)||result.attendance.status!==status)
       throw Error("Could not confirm the saved attendance status.");
      const who=displayName+(rollNumber?" ("+rollNumber+")":"");
      setLastAction(status==="PRESENT"?who+" marked present.":
       status==="ABSENT"?who+" marked absent.":
       who+" marked "+(status==="DONE"?"done.":"in interview."));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save");
    } finally { setBusy(false); }
  }
  return (
    <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
      {attendance !== "PRESENT" ? (
        <Button variant="secondary" type="button" disabled={busy} onClick={() => setTarget("PRESENT")}
          className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link disabled:opacity-60 sm:w-auto md:min-h-9">
          ✓ Present
        </Button>
      ) : null}
      {attendance==="PRESENT"?<Button variant="secondary" type="button" disabled={busy}
        onClick={()=>setTarget("IN_INTERVIEW")}>In interview</Button>:null}
      {attendance==="IN_INTERVIEW"?<Button variant="secondary" type="button" disabled={busy}
        onClick={()=>setTarget("DONE")}>Done</Button>:null}
      {attendance !== "ABSENT" && attendance!=="DONE" && attendance!=="IN_INTERVIEW" ? (
        <Button variant="secondary" type="button" disabled={busy} onClick={() => setTarget("ABSENT")}
          className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-error/50 px-3 text-sm font-semibold text-error disabled:opacity-60 sm:w-auto md:min-h-9">
          ⚠ Absent
        </Button>
      ) : null}
      {lastAction?<div role="status" className="flex w-full flex-wrap items-center justify-between gap-2 border-l-2 border-primary bg-primary-subtle px-3 py-2 text-sm">
       <span>{lastAction}</span>
       <button type="button" className="min-h-9 font-semibold text-link underline" onClick={()=>setLastAction(null)}>Dismiss</button>
      </div>:null}
      {error ? <div className="min-w-0 sm:w-full"><InlineNotice tone="error" message={error}/></div> : null}
      <ConfirmDialog open={target !== null}
        onOpenChange={next => { if (!next && !busy) setTarget(null); }}
        title={"Confirm "+(target === "ABSENT" ? "absent" : target==="IN_INTERVIEW"?"in interview":target==="DONE"?"done":"present")+"?"}
        description={"Confirm "+(target === "ABSENT" ? "absent":target==="IN_INTERVIEW"?"in interview":target==="DONE"?"done":"checked-in")+" for "+displayName+"? This records an audited attendance change. Current attendance: "+attendance.toLowerCase()+"."}
        confirmLabel={target === "ABSENT" ? "⚠ Absent" : target==="IN_INTERVIEW"?"In interview":target==="DONE"?"Done":"✓ Present"}
        confirmVariant={target === "ABSENT" ? "danger" : "primary"} pending={busy}
        onConfirm={() => { if (target) void mark(target); }}/>
    </div>
  );
}
