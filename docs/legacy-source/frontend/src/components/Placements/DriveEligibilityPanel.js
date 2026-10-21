import { useEffect, useState } from "react";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { getDriveEligibility } from "@/api/Services/TpoHubService";

/**
 * The drive's rules, each with pass or fail, inside the drive page's "Can you apply" card (redesign, 14 Oct 2026: it was a second,
 * unlabelled banner above the page saying "Eligible / Eligible"). Says so if the check cannot load.
 */
// The rule texts are written for the placement cell ("Their batch..."); "Eligible" next to a pass says nothing new.
const detailOf = (c) => {
  const d = String(c.detail || "").replace(/^Their /, "Your ");
  if (!d || (c.pass && /^eligible$/i.test(d))) return c.pass ? "yours is included" : "";
  return d;
};

export default function DriveEligibilityPanel({ jobId }) {
  const [result, setResult] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setResult(null);
    setFailed(false);
    if (!jobId) return undefined;
    let current = true;
    getDriveEligibility(jobId)
      .then((r) => { if (current) setResult(r?.data || null); })
      // No such drive (or not one for this student): the page says it is unavailable.
      .catch((e) => { if (current && e?.response?.status !== 404) setFailed(true); });
    return () => { current = false; };
  }, [jobId]);

  // BE-0012: a failed check is said, not shown as "no rules".
  if (failed) {
    return <p className="sp-small sp-text-bad" data-testid="placements.eligibility-failed">We couldn&apos;t check this drive&apos;s rules just now. Refresh the page to see whether you meet them.</p>;
  }
  if (!result || !Array.isArray(result.checks) || result.checks.length === 0) return null;
  return (
    <ul className="sp-checks" aria-label="This drive's rules" data-testid="placements.eligibility">
      {result.checks.map((c, i) => (
        <li key={`${c.rule}-${i}`} className={c.pass ? "is-pass" : "is-fail"}>
          {c.pass ? <CheckCircleFilled aria-label="Met" /> : <CloseCircleFilled aria-label="Not met" />}
          <span>{c.rule}{detailOf(c) ? <span className="sp-muted">: {detailOf(c)}</span> : null}</span>
        </li>
      ))}
    </ul>
  );
}
