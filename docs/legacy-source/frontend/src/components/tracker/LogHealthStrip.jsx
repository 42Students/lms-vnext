import { Tooltip } from "antd";
import { shortCommit } from "@/utils/logReport";

function relative(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

const VERDICT = {
  OK: { label: "Healthy", tone: "ok" },
  ELEVATED: { label: "More errors after", tone: "warn" },
  JUMP: { label: "Errors jumped", tone: "danger" },
};

/**
 * Four numbers that answer "do I need to look at anything": new error types, regressions, what is
 * still open, and how the latest deploy behaved. Everything here is clickable through to detail.
 */
export default function LogHealthStrip({ environment, digest, deploys, health, loading, onOpenDigest }) {
  const latest = deploys && deploys[0];
  const verdict = health ? VERDICT[health.verdict] : null;
  const isProd = environment === "PRODUCTION";

  const stat = (key, value, label, tone, hint) => (
    <button
      type="button"
      key={key}
      className={`tracker-health__card tracker-health__card--${tone}`}
      onClick={onOpenDigest}
      disabled={!isProd || !digest}
      title={hint}
    >
      <strong>{loading ? "…" : value}</strong>
      <span>{label}</span>
    </button>
  );

  return (
    <section className="tracker-health" aria-label="Log health">
      {isProd ? (
        <>
          {stat("new", digest ? digest.newErrors.length : "–", "new error types (24h)", digest && digest.newErrors.length ? "danger" : "ok", "Error types seen for the first time in the last 24 hours")}
          {stat("reg", digest ? digest.regressions.length : "–", "regressions", digest && digest.regressions.length ? "danger" : "ok", "Errors marked fixed that came back")}
          {stat("open", digest ? digest.stillActive : "–", "open and active", "neutral", "Open error types seen in the last 24 hours")}
        </>
      ) : (
        <div className="tracker-health__note">Error tracking and the daily digest cover production. Deploys are shown for every environment.</div>
      )}
      <Tooltip
        title={
          health
            ? `Errors in the 10 minutes before: ${health.errorsBefore}. After: ${health.errorsAfter}${health.capped ? "+" : ""}.`
            : latest
              ? "Comparing error volume before and after this release…"
              : "Deploy history starts with the next release."
        }
      >
        <div className={`tracker-health__card tracker-health__card--deploy${verdict ? ` tracker-health__card--${verdict.tone}` : ""}`}>
          <strong>{latest ? shortCommit(latest.commit) : "–"}</strong>
          <span>
            {latest ? `last deploy ${relative(latest.at)}` : "no deploys recorded yet"}
            {verdict && <em className={`tracker-health__verdict tracker-health__verdict--${verdict.tone}`}>{verdict.label}</em>}
          </span>
        </div>
      </Tooltip>
    </section>
  );
}
