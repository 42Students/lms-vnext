/**
 * Four legacy placements-snapshot glyph silhouettes. Keep this local to the
 * learner snapshot; shared UI icons and the tile primitive remain unchanged.
 * Visual geometry: lms2-fe@prod-2026/_learn-placements.scss:1946-1957.
 */
export type PlacementSnapshotGlyphKind = "jobs" | "applications" | "assessments" | "interviews";

export function PlacementSnapshotGlyph({ kind }: { kind: PlacementSnapshotGlyphKind }) {
  const paths = {
    jobs: <><path d="M7 3.5h7l4 4V20H7z" /><path d="M14 3.5V8h4M10 12h5M10 15h5" /></>,
    applications: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-2a7 7 0 0 1 14 0v2" /></>,
    assessments: <><rect x="5" y="5" width="14" height="16" rx="2" /><path d="M9 5V3h6v2M9 10h6M9 14h6M9 18h4" /></>,
    interviews: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  } satisfies Record<PlacementSnapshotGlyphKind, import("react").ReactNode>;
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"
    width="1em" height="1em" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {paths[kind]}
  </svg>;
}
