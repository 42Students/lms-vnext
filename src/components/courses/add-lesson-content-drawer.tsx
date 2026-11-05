"use client";

/**
 * UI04-S45 — Add Lesson Content Drawer (faculty Blueprint tab)
 *
 * Replaces legacy AddNewLessonContentDrawer.js.
 * Opens from the per-lesson "+ Add content" row on the Blueprint tab.
 * Drawer width: 640px (md: w-[min(640px,100vw)]).
 *
 * Content types:
 *   Videos      → FacultyLessonAuthoring (YOUTUBE) + link to video upload manager
 *   Resources   → FacultyLessonAuthoring (RESOURCE)
 *   Quizzes     → navigates to /teacher/courses/[deliveryId]/quizzes/manage
 *   Assignments → navigates to /teacher/courses/[deliveryId]/assignments/manage
 *   Live Sessions → FacultyLessonAuthoring (LIVE_CLASS)
 *
 * contentMode controls which categories appear (matches legacy MODE_CATEGORIES):
 *   "lectures"   → Videos only
 *   "assessments"→ Quizzes + Assignments
 *   "resources"  → Resources only (skips category picker, opens form directly)
 *   "live"       → Live Sessions only (skips category picker, opens form directly)
 *   default / "blueprint" / "roadmap" → all five categories
 */

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { FacultyLessonAuthoring } from "./faculty-lesson-authoring";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

const CONTENT_CATEGORIES = [
  "Videos",
  "Resources",
  "Quizzes",
  "Assignments",
  "Live Sessions",
] as const;
type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export type AddContentMode =
  | "lectures"
  | "assessments"
  | "resources"
  | "live"
  | "roadmap"
  | "blueprint";

type AuthoringMode = "YOUTUBE" | "RESOURCE" | "LIVE_CLASS";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MODE_VISIBLE_CATEGORIES: Partial<
  Record<AddContentMode, readonly ContentCategory[]>
> = {
  lectures: ["Videos"],
  assessments: ["Quizzes", "Assignments"],
  resources: ["Resources"],
  live: ["Live Sessions"],
};

function getVisibleCategories(
  contentMode: AddContentMode | undefined,
): readonly ContentCategory[] {
  if (contentMode && MODE_VISIBLE_CATEGORIES[contentMode]) {
    return MODE_VISIBLE_CATEGORIES[contentMode]!;
  }
  return CONTENT_CATEGORIES;
}

function getDrawerTitle(contentMode: AddContentMode | undefined): string {
  switch (contentMode) {
    case "lectures":
      return "Add Video";
    case "resources":
      return "Add Resource";
    case "live":
      return "Add Live Session";
    case "assessments":
      return "Add Assessment";
    default:
      return "Add New Content";
  }
}

/** Returns the FacultyLessonAuthoring mode for a given category, or null when
 * the category navigates out to a manage page instead of authoring inline. */
function categoryToAuthoringMode(category: ContentCategory): AuthoringMode | null {
  switch (category) {
    case "Videos":
      return "YOUTUBE";
    case "Resources":
      return "RESOURCE";
    case "Live Sessions":
      return "LIVE_CLASS";
    default:
      return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddLessonContentDrawer({
  open,
  onOpenChange,
  onContentAdded,
  contentMode,
  lessonId,
  deliveryId,
  nextSequence,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a content item is successfully saved. */
  onContentAdded?: () => void;
  /** Restricts / pre-selects the content type. See AddContentMode. */
  contentMode?: AddContentMode;
  lessonId: string;
  deliveryId: string;
  nextSequence: number;
}) {
  const [selectedCategory, setSelectedCategory] =
    useState<ContentCategory | null>(null);

  const visibleCategories = getVisibleCategories(contentMode);

  // "resources" and "live" modes skip the category picker entirely.
  const directAuthoringMode: AuthoringMode | null =
    contentMode === "resources"
      ? "RESOURCE"
      : contentMode === "live"
        ? "LIVE_CLASS"
        : null;

  function handleClose() {
    setSelectedCategory(null);
    onOpenChange(false);
  }

  function handleSaved() {
    setSelectedCategory(null);
    onContentAdded?.();
    onOpenChange(false);
  }

  // Resolve the active authoring mode from selection or from contentMode.
  const authoringMode: AuthoringMode | null =
    selectedCategory !== null
      ? categoryToAuthoringMode(selectedCategory)
      : directAuthoringMode;

  // Categories that open an external manage page rather than an inline form.
  const isNavigatingCategory =
    selectedCategory === "Quizzes" || selectedCategory === "Assignments";

  const showCategoryPicker =
    authoringMode === null && !isNavigatingCategory && directAuthoringMode === null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(true);
      }}
      title={getDrawerTitle(contentMode)}
      side="right"
      className="md:!w-[min(640px,100vw)]"
    >
      {/* ── Step 1: Category picker ── */}
      {showCategoryPicker ? (
        <ul
          className="mt-2 space-y-2"
          role="list"
          aria-label="Choose content type"
        >
          {visibleCategories.map((category, index) => (
            <li key={category}>
              <Button variant="bare"
                type="button"
                aria-label={`Add ${category}`}
                className="flex w-full min-h-11 items-center gap-3 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                onClick={() => setSelectedCategory(category)}
              >
                <span className="shrink-0 w-5 text-xs font-bold text-muted-foreground">
                  {index + 1}.
                </span>
                <span>{category}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* ── Step 2a: Quizzes — link to quiz manage page ── */}
      {selectedCategory === "Quizzes" ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-5 text-body">
            Use the full Quiz Builder to add a quiz to this lesson.
          </p>
          <Link
            href={
              "/teacher/courses/" +
              encodeURIComponent(deliveryId) +
              "/quizzes/manage?lesson=" +
              encodeURIComponent(lessonId)
            }
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--lms-on-primary)] hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            onClick={handleClose}
          >
            Open Quiz Builder
          </Link>
          <Button variant="bare"
            type="button"
            className="block text-sm font-semibold text-primary-text underline"
            onClick={() => setSelectedCategory(null)}
          >
            ← Back to content types
          </Button>
        </div>
      ) : null}

      {/* ── Step 2b: Assignments — link to assignment manage page ── */}
      {selectedCategory === "Assignments" ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-5 text-body">
            Use the full Assignment Builder to add an assignment to this lesson.
          </p>
          <Link
            href={
              "/teacher/courses/" +
              encodeURIComponent(deliveryId) +
              "/assignments/manage?lesson=" +
              encodeURIComponent(lessonId)
            }
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--lms-on-primary)] hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            onClick={handleClose}
          >
            Open Assignment Builder
          </Link>
          <Button variant="bare"
            type="button"
            className="block text-sm font-semibold text-primary-text underline"
            onClick={() => setSelectedCategory(null)}
          >
            ← Back to content types
          </Button>
        </div>
      ) : null}

      {/* ── Step 2c: Videos — show YouTube authoring + video-upload link ── */}
      {authoringMode === "YOUTUBE" && selectedCategory === "Videos" ? (
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <Button variant="bare"
              type="button"
              className="text-sm font-semibold text-primary-text underline"
              onClick={() => setSelectedCategory(null)}
            >
              ← Back to content types
            </Button>
            <Link
              href={
                "/teacher/courses/" +
                encodeURIComponent(deliveryId) +
                "/blueprint?lesson=" +
                encodeURIComponent(lessonId) +
                "&advanced=1&create=VIDEO#faculty-video-upload-" +
                lessonId
              }
              className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-body hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)]"
              onClick={handleClose}
            >
              Upload a video file instead →
            </Link>
          </div>
          <FacultyLessonAuthoring
            key={"drawer-youtube:" + lessonId}
            initialMode="YOUTUBE"
            lessonId={lessonId}
            deliveryId={deliveryId}
            nextContentSequence={nextSequence}
            nextAssignmentSequence={nextSequence}
            nextQuizSequence={nextSequence}
            availableModes={["YOUTUBE"]}
            onSaved={handleSaved}
            enableAssignmentResources={false}
          />
        </div>
      ) : null}

      {/* ── Step 2d: Resources ── */}
      {authoringMode === "RESOURCE" ? (
        <div className="min-w-0">
          {selectedCategory !== null ? (
            <Button variant="bare"
              type="button"
              className="mb-4 text-sm font-semibold text-primary-text underline"
              onClick={() => setSelectedCategory(null)}
            >
              ← Back to content types
            </Button>
          ) : null}
          <FacultyLessonAuthoring
            key={"drawer-resource:" + lessonId}
            initialMode="RESOURCE"
            lessonId={lessonId}
            deliveryId={deliveryId}
            nextContentSequence={nextSequence}
            nextAssignmentSequence={nextSequence}
            nextQuizSequence={nextSequence}
            availableModes={["RESOURCE"]}
            onSaved={handleSaved}
            enableAssignmentResources
          />
        </div>
      ) : null}

      {/* ── Step 2e: Live Sessions ── */}
      {authoringMode === "LIVE_CLASS" ? (
        <div className="min-w-0">
          {selectedCategory !== null ? (
            <Button variant="bare"
              type="button"
              className="mb-4 text-sm font-semibold text-primary-text underline"
              onClick={() => setSelectedCategory(null)}
            >
              ← Back to content types
            </Button>
          ) : null}
          <FacultyLessonAuthoring
            key={"drawer-live:" + lessonId}
            initialMode="LIVE_CLASS"
            lessonId={lessonId}
            deliveryId={deliveryId}
            nextContentSequence={nextSequence}
            nextAssignmentSequence={nextSequence}
            nextQuizSequence={nextSequence}
            availableModes={["LIVE_CLASS"]}
            onSaved={handleSaved}
            enableAssignmentResources={false}
          />
        </div>
      ) : null}
    </Drawer>
  );
}
