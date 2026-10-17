"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TpoRecruiterGrantForm({ companies }: {
  companies: readonly { relationshipId: string; name: string }[];
}) {
  const router = useRouter();
  const [relationshipId, setRelationshipId] = useState(companies[0]?.relationshipId ?? "");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  async function save() {
    if (busy || !relationshipId || !email.trim()) return;
    if (!window.confirm("Grant the existing user recruiter access to this college/company? This changes real recruiter permissions.")) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/recruiter-grants", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GRANT", confirmed: true,
          companyRelationshipId: relationshipId, email: email.trim().toLowerCase(),
          title: title.trim() || null }),
      });
      if (!response.ok) throw new Error("Recruiter grant could not be saved. Verify the existing user and company.");
      const value = await response.json() as { outcome: string };
      setSuccess(value.outcome === "already-active" ? "This user already has an active grant." : "Recruiter access granted.");
      setEmail(""); setTitle(""); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Grant failed.");
    } finally { setBusy(false); }
  }
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
      <h3 className="text-base font-semibold text-foreground">Grant recruiter college access</h3>
      <p className="text-sm text-body">
        Choose an active linked company and an existing active user email. Duplicate
        active grants are not re-created. No invitation email is sent.
      </p>
      {companies.length === 0 ? (
        <p role="status" className="text-sm text-body">No active linked companies are available for recruiter grants.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-semibold text-body">Company
              <select value={relationshipId} disabled={busy}
                onChange={(event) => setRelationshipId(event.target.value)}
                className="min-h-10 rounded-md border border-border bg-surface px-3">
                {companies.map((company) => <option key={company.relationshipId} value={company.relationshipId}>{company.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">Existing user email
              <input type="email" value={email} disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-10 rounded-md border border-border bg-surface px-3" required />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">Recruiter title (optional)
              <input type="text" value={title} maxLength={160} disabled={busy}
                onChange={(event) => setTitle(event.target.value)}
                className="min-h-10 rounded-md border border-border bg-surface px-3" />
            </label>
          </div>
          <button type="button" disabled={busy || !email.trim()} onClick={() => void save()}
            className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
            {busy ? "Saving..." : "Review and confirm grant"}
          </button>
        </>
      )}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {success ? <p role="status" className="text-sm text-body">{success}</p> : null}
    </section>
  );
}

export function TpoRecruiterRevoke({ grantId, expectedUpdatedAt, displayName }: {
  grantId: string; expectedUpdatedAt: string; displayName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  async function revoke() {
    if (busy || !window.confirm("Remove " + displayName + "\'s access?\nThey will no longer be able to use this college\'s recruiter workspace.")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/recruiter-grants", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE", confirmed: true,
          grantId, expectedUpdatedAt }),
      });
      if (!response.ok) throw new Error("Grant changed or revocation failed. Refresh to review the current state.");
      setNotice("Access removed");router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Revoke failed.");
    } finally { setBusy(false); }
  }
  return <div className="mt-2">
    <button type="button" disabled={busy} onClick={() => void revoke()}
      className="min-h-9 rounded-md border border-border px-3 text-xs font-semibold text-primary-text disabled:opacity-60">
      {busy ? "Revoking..." : "Revoke access"}
    </button>
    {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
    {notice ? <p role="status" className="text-xs text-success-text">{notice}</p> : null}
  </div>;
}
