"use client";
import { Button } from "@/components/ui/button";

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
        <Button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          variant="ghost" className="min-h-11 !text-[var(--lms-primary-text)] hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      ) : null}
    </div>
  );
}
