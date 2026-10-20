/** The five assessment-counter pictograms; presentation only, excluded from AT. */
export type AssessmentMetricGlyphKind = "assignment" | "courses" | "pending" | "overdue" | "submitted";

export function AssessmentMetricGlyph({ kind }: { kind: AssessmentMetricGlyphKind }) {
  const drawings = {
    assignment: <><path d="M8 4h9a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3Z" /><path d="M9 9h6M9 13h6M9 17h4" /></>,
    courses: <><path d="M4 5.5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0zM12 5.5c2.5-1.5 5-1.5 8 0v15c-3-1.5-5.5-1.5-8 0z" /></>,
    pending: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2" /></>,
    overdue: <><path d="m12 3 10 17H2z"/><path d="M12 9v4M12 16h.01" /></>,
    submitted: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6" /></>,
  } satisfies Record<AssessmentMetricGlyphKind, import("react").ReactNode>;
  return <svg viewBox="0 0 24 24" width="1em" height="1em"
    fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {drawings[kind]}
  </svg>;
}
