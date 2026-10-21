import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Skeleton } from "antd";
import { getPlacementRules } from "@/api/Services/TpoHubService";

/**
 * The college's placement rules as a student reads them (redesign, 14 Oct 2026): one point per rule, in plain words, with the
 * student's own line on top when they hold an offer. It was one paragraph written for the placement cell ("A student counts as
 * placed when...", "from Settings").
 */
export default function PlacementRules({ collapsible = false }) {
  const [rules, setRules] = useState(null);
  // On Offers the full list (also on Placement cell) starts folded: only the student's own line shows (student UX audit, 20 Oct 2026).
  const [open, setOpen] = useState(!collapsible);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    getPlacementRules()
      .then((r) => {
        if (r?.data && Array.isArray(r.data.points) && r.data.points.length) setRules(r.data);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (failed) return <Alert type="warning" showIcon message="We couldn't load the rules" action={<Button size="small" onClick={load}>Retry</Button>} />;
  if (!rules) return <Skeleton active paragraph={{ rows: 3 }} />;
  return (
    <div data-testid="sp.rules">
      {rules.personalNote && <p className="sp-personal"><b>Where you stand:</b> {rules.personalNote}</p>}
      {collapsible && <Button type="link" style={{ padding: 0 }} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide the rules" : "See all the rules"}</Button>}
      {open && <><ul className="sp-rules">
        {rules.points.map((p) => (
          <li key={p.title}><h3>{p.title}</h3><p>{p.text}</p></li>
        ))}
      </ul>
      <p className="sp-small sp-muted" style={{ marginTop: 12, marginBottom: 0 }}>
        Your placement cell sets these rules. If they change, the new rules apply to applications made after the change.
      </p></>}
    </div>
  );
}
