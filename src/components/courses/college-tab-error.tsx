"use client";

import { ErrorState } from "@/components/ui/error-state";
import {
  COLLEGE_TAB_LOAD_ERROR_TITLE,
  type CollegeCourseTab,
} from "@/modules/courses/college-course-tabs-copy";

/** Route-level named load alert with Retry (COL-course-tabs-23). */
export function CollegeTabError({ tab, reset }: { tab: CollegeCourseTab; reset: () => void }) {
  return (
    <ErrorState
      title={COLLEGE_TAB_LOAD_ERROR_TITLE[tab]}
      description="Nothing was changed. Try again; no empty-result conclusion is assumed."
      action={
        <button type="button" onClick={reset}
          className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Retry
        </button>
      }
    />
  );
}
