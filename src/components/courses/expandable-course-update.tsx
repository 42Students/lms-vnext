"use client";

import { useId, useState } from "react";

const PREVIEW_LENGTH = 220;

/** Kept outside the discussion link so its button is independently operable. */
export function ExpandableCourseUpdate({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const long = body.length > PREVIEW_LENGTH;
  return (
    <div className="mt-1">
      <p id={contentId} className="m-0 whitespace-pre-wrap break-words text-sm leading-6 text-body">
        {expanded || !long ? body : `${body.slice(0, PREVIEW_LENGTH).trimEnd()}…`}
      </p>
      {long ? (
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="min-h-10 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
