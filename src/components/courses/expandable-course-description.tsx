"use client";
import { Button } from "@/components/ui/button";

import { useId, useMemo, useState } from "react";
import {
  plainCourseDescription,
  summarizeCourseDescription,
} from "./course-description-preview";

type Props = {
  /** Sanitized and attribute-free by the server-side course metadata reader. */
  safeBodyHtml: string | null;
  fallbackDescription: string;
  secondaryDescription: string | null;
};

export function ExpandableCourseDescription({
  safeBodyHtml,
  fallbackDescription,
  secondaryDescription,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const preview = useMemo(() => {
    const text = safeBodyHtml
      ? plainCourseDescription(safeBodyHtml)
      : [fallbackDescription, secondaryDescription].filter(Boolean).join(" ");
    return summarizeCourseDescription(text);
  }, [safeBodyHtml, fallbackDescription, secondaryDescription]);

  return (
    <div className="mt-3 space-y-2 text-sm leading-6 text-body">
      <div id={contentId}>
        {!expanded && preview.long ? (
          <p className="m-0 whitespace-pre-wrap">{preview.preview}</p>
        ) : safeBodyHtml ? (
          <div
            className="space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
          />
        ) : (
          <>
            <p className="m-0 whitespace-pre-wrap">{fallbackDescription}</p>
            {secondaryDescription ? (
              <p className="mt-3 whitespace-pre-wrap">{secondaryDescription}</p>
            ) : null}
          </>
        )}
      </div>
      {preview.long ? (
        <Button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          variant="ghost" className="min-h-11 !text-[var(--lms-primary-text)] underline-offset-2 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      ) : null}
    </div>
  );
}
