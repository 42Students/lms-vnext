import { useEffect, useRef, useState } from "react";
import { listBugReports } from "@/api/Services/BugTrackerService";
import { StatusPill } from "@/components/tracker/TrackerPill";
import { trackerLocationText } from "@/utils/bugTrackerUtils";

const MIN_DESCRIPTION_LENGTH = 15;
const SEARCH_DEBOUNCE_MS = 500;
// Long enough to catch a duplicate by wording, short enough that two reports describing the
// same bug in slightly different phrasing still overlap on this leading slice.
const SEARCH_SNIPPET_LENGTH = 60;

/**
 * A quiet "you might not be the first" nudge on the report form: searches existing issues for the
 * text the reporter is already typing, so a tester can check an existing report (open OR closed --
 * "already fixed, please retest" is just as useful to know as "already open") before filing a
 * near-duplicate. Never blocks submission -- it's a suggestion, not a gate.
 */
export default function SimilarIssuesPanel({ description, excludePublicId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const trimmed = (description || "").trim();
    if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
      setResults([]);
      return undefined;
    }

    const controller = new AbortController();
    const requestId = ++requestRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const page = await listBugReports(
          { search: trimmed.slice(0, SEARCH_SNIPPET_LENGTH), size: 5, sort: "DESC" },
          controller.signal
        );
        if (requestRef.current !== requestId) return;
        const items = Array.isArray(page?.content) ? page.content : [];
        setResults(items.filter((item) => item.publicId !== excludePublicId));
      } catch (error) {
        if (error?.name !== "AbortError" && requestRef.current === requestId) setResults([]);
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [description, excludePublicId]);

  if (!loading && results.length === 0) return null;

  return (
    <div className="tracker-similar-issues" role="status">
      <p className="tracker-similar-issues__title">
        {loading ? "Checking for similar reports…" : `Possibly already reported (${results.length})`}
      </p>
      {!loading && (
        <ul className="tracker-similar-issues__list">
          {results.map((issue) => (
            <li key={issue.publicId}>
              <a href={`/tracker/issues/${issue.publicId}`} target="_blank" rel="noreferrer">
                {issue.publicId}
              </a>
              <StatusPill value={issue.status} />
              <span className="tracker-similar-issues__location">{trackerLocationText(issue)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
