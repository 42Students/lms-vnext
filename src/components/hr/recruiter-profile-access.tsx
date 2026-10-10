"use client";

import { useState } from "react";

type Grant = {
  id: string;
  collegeId: string;
  collegeName: string;
};

export function RecruiterProfileAccess({ grants }: { grants: readonly Grant[] }) {
  const [items, setItems] = useState(() => [...grants]);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function leave(grant: Grant) {
    if (!window.confirm(
      "Leave access to " + grant.collegeName + "? You will immediately lose recruiter access to this college.",
    )) return;
    setLeaving(grant.id);
    setError("");
    try {
      const response = await fetch(
        "/api/placements/recruiter/access/" + encodeURIComponent(grant.id),
        { method: "DELETE", credentials: "same-origin" },
      );
      if (!response.ok) {
        setError("Could not leave this college access. Refresh and try again.");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== grant.id));
      window.location.assign("/hr/home");
    } catch {
      setError("Could not leave this college access. Check your connection and try again.");
    } finally {
      setLeaving(null);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">College Access</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Leaving access takes effect immediately. The placement cell must grant access again if you need to return.
      </p>
      {error ? (
        <div role="alert" className="mt-3 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No active college access.</p>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {items.map((grant) => (
            <div key={grant.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <div className="font-medium text-foreground">{grant.collegeName}</div>
                <div className="mt-1 text-xs text-muted-foreground">Active recruiter access</div>
              </div>
              <button
                type="button"
                disabled={leaving === grant.id}
                onClick={() => void leave(grant)}
                className="rounded-md border border-danger/30 bg-surface px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-50"
              >
                {leaving === grant.id ? "Leaving…" : "Leave Access"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
