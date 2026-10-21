import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "antd";
import { getDriveProcess, getPlacementJourney } from "@/api/Services/TpoHubService";
import RoundTrack from "./RoundTrack";
import { standing } from "./words";

/**
 * A drive's selection process on the drive page (redesign, 14 Oct 2026): its rounds in order, and, once the student applied, where
 * they are in them (test cleared, interview booked for tomorrow...). The page showed a generic "reviews, then assessment or
 * interview" list instead. `unavailable` is the page's own "this drive can't be shown" state: a student who applied to a drive that
 * was then cancelled is told so, with the reason, instead of "Job not found or not active".
 */
export default function DriveJourney({ jobId, unavailable = false }) {
  const [app, setApp] = useState(undefined);
  const [process, setProcess] = useState(null);

  useEffect(() => {
    if (!jobId) return undefined;
    let live = true;
    setApp(undefined);
    setProcess(null);
    getPlacementJourney()
      .then((r) => {
        const mine = (r?.data?.applications || []).find((a) => String(a.jobId) === String(jobId)) || null;
        if (live) setApp(mine);
      })
      .catch(() => { if (live) setApp(null); });
    if (!unavailable) {
      getDriveProcess(jobId)
        .then((r) => { if (live) setProcess(Array.isArray(r?.data) ? r.data : []); })
        .catch(() => { if (live) setProcess([]); });
    }
    return () => { live = false; };
  }, [jobId, unavailable]);

  if (unavailable) {
    if (!app) return null;
    const st = standing(app);
    return (
      <Alert type="warning" showIcon style={{ marginBottom: 16 }} data-testid="sp.drive-unavailable"
        message={app.lifecycle === "CANCELLED" ? `${app.company} · ${app.role} was cancelled` : `${app.company} · ${app.role} has closed`}
        description={<>
          {app.lifecycle === "CANCELLED" && <p style={{ margin: "0 0 4px" }}>{app.cancelReason ? `The placement cell said: ${app.cancelReason}` : "The placement cell cancelled this drive."}</p>}
          <p style={{ margin: 0 }}>Your application: {st.label}. Your other applications are not affected. <Link href={`/learn/my-placements/applications?show=all&applicationId=${app.applicationId}`}>See it in Applications</Link></p>
        </>} />
    );
  }

  const rounds = app?.rounds?.length ? app.rounds : process;
  if (app === undefined || rounds === null) return null;
  return (
    <section className="ljd-card" aria-labelledby="sp-process-h" data-testid="sp.drive-process">
      <h2 id="sp-process-h" className="ljd-section-title">{app ? "Your progress" : "Selection process"}</h2>
      {app && <p className="sp-muted" style={{ marginTop: -4 }}>Where you are: <b>{standing(app).label}</b></p>}
      <RoundTrack rounds={rounds} />
      {app && rounds.some((r) => r.state === "SCHEDULED") && (
        <p className="sp-small" style={{ marginTop: 12, marginBottom: 0 }}><Link href="/learn/my-placements/schedule">Confirm or reschedule in your schedule</Link></p>
      )}
    </section>
  );
}
