import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Every TPO modal is covered by a named case, not merely by file existence.
 * The shared native-dialog primitives are also directly tested in UX-tpo-overlay-01. */
const overlayCases = [
  {
    "path": "src/components/tpo/recruiter-lead-detail-workspace.tsx",
    "kind": "Dialog",
    "cue": "Discard unsaved recruiter changes?"
  },
  {
    "path": "src/components/tpo/tpo-after-college-bulk-editor.tsx",
    "kind": "Dialog",
    "cue": "Update after-college outcomes"
  },
  {
    "path": "src/components/tpo/tpo-after-college-editor.tsx",
    "kind": "Dialog",
    "cue": "Save after-college outcome"
  },
  {
    "path": "src/components/tpo/tpo-batch-class-decision.tsx",
    "kind": "ConfirmDialog",
    "cue": "Student overrides are not changed."
  },
  {
    "path": "src/components/tpo/tpo-batch-eligibility-import.tsx",
    "kind": "Drawer",
    "cue": "Import eligibility decisions"
  },
  {
    "path": "src/components/tpo/tpo-batch-inline-decision.tsx",
    "kind": "Dialog",
    "cue": "Mark learner ineligible"
  },
  {
    "path": "src/components/tpo/tpo-batch-invitation-control.tsx",
    "kind": "ConfirmDialog",
    "cue": "Remove the registration deadline?"
  },
  {
    "path": "src/components/tpo/tpo-batch-rule-editor.tsx",
    "kind": "ConfirmDialog",
    "cue": "Discard your unsaved batch-rule changes?"
  },
  {
    "path": "src/components/tpo/tpo-batch-student-saved-views.tsx",
    "kind": "ConfirmDialog",
    "cue": "Delete this saved batch view?"
  },
  {
    "path": "src/components/tpo/tpo-bell-panel.tsx",
    "kind": "Drawer",
    "cue": "Nothing yet"
  },
  {
    "path": "src/components/tpo/tpo-bulk-action-panel.tsx",
    "kind": "Dialog",
    "cue": "Share selected applicants with the company"
  },
  {
    "path": "src/components/tpo/tpo-company-create-form.tsx",
    "kind": "Dialog",
    "cue": "Confirm company creation"
  },
  {
    "path": "src/components/tpo/tpo-company-team-conversation.tsx",
    "kind": "ConfirmDialog",
    "cue": "Its ask is cancelled too."
  },
  {
    "path": "src/components/tpo/tpo-find-shortcut.tsx",
    "kind": "Dialog",
    "cue": "Search records in your college."
  },
  {
    "path": "src/components/tpo/tpo-keyboard-shortcuts.tsx",
    "kind": "Drawer",
    "cue": "Press a key, then the next one."
  },
  {
    "path": "src/components/tpo/tpo-mobile-footer.tsx",
    "kind": "Navigation",
    "cue": "/tpo/more"
  },
  {
    "path": "src/components/tpo/tpo-new-followup-modal.tsx",
    "kind": "Dialog",
    "cue": "Discard this follow-up draft?"
  },
  {
    "path": "src/components/tpo/tpo-new-recruiter-conversation.tsx",
    "kind": "Dialog",
    "cue": "New message to a recruiter"
  },
  {
    "path": "src/components/tpo/tpo-notice-composer-dialog.tsx",
    "kind": "Dialog",
    "cue": "New announcement"
  },
  {
    "path": "src/components/tpo/tpo-public-join-link-card.tsx",
    "kind": "ConfirmDialog",
    "cue": "PUBLIC_JOIN_LINK_COPY.replace"
  },
  {
    "path": "src/components/tpo/tpo-student-nudge-panel.tsx",
    "kind": "Dialog",
    "cue": "The message will be audited."
  },
  {
    "path": "src/components/tpo/tpo-student-quick-panel.tsx",
    "kind": "Drawer",
    "cue": "onClick={()=>void fetchDetail()}"
  },
  {
    "path": "src/components/tpo/tpo-student-saved-views.tsx",
    "kind": "Dialog",
    "cue": "Delete saved view"
  },
  {
    "path": "src/components/tpo/tpo-students-assign-prep.tsx",
    "kind": "Dialog",
    "cue": "Learners will be notified."
  },
  {
    "path": "src/components/tpo/tpo-students-bulk-add.tsx",
    "kind": "Dialog",
    "cue": "Add selected students to a drive"
  },
  {
    "path": "src/components/tpo/tpo-students-bulk-debar.tsx",
    "kind": "Dialog",
    "cue": "Confirm debarment"
  },
  {
    "path": "src/components/tpo/tpo-students-drive-visibility.tsx",
    "kind": "Dialog",
    "cue": "Confirm drive eligibility overrides?"
  },
  {
    "path": "src/components/tpo/tpo-timed-debar-control.tsx",
    "kind": "Dialog",
    "cue": "Confirm debarment"
  }
] as const;

describe("UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions", () => {
  for (const { path, kind, cue } of overlayCases) {
    it("UX-tpo-overlay-" + path.split("/").pop() + " keeps a named shared overlay and scoped interaction", () => {
      const source = readFileSync(path, "utf8");
      if (kind === "Navigation") {
        expect(source).toContain('<nav aria-label="TPO mobile footer"');
        expect(source).toContain("<Link");
        expect(source).toContain('aria-current={active ? "page" : undefined}');
        expect(source).toContain(cue);
        expect(source).not.toContain("window.open");
        expect(source).not.toContain("target=\"_blank\"");
        return;
      }
      expect(source).toContain("<" + kind);
      expect(source).toContain("onOpenChange=");
      expect(source).toContain(cue);
      expect(source).not.toMatch(/transition-all|duration-(?:500|700|1000)/);
      // Shared modal delegates focus trapping and Escape handling to the
      // native dialog while the exit hook manages focus return and transitions.
      const shared = readFileSync("src/components/ui/" +
        (kind === "ConfirmDialog" ? "confirm-dialog" : kind === "BottomSheet" ? "bottom-sheet" : kind.toLowerCase()) + ".tsx", "utf8");
      expect(shared).toMatch(/<Dialog|<dialog/);
    });
  }

  it("UX-tpo-overlay shared modal title/focus/escape and safe viewport cues have direct evidence", () => {
    for (const name of ["dialog", "drawer", "bottom-sheet"]) {
      const source = readFileSync("src/components/ui/" + name + ".tsx", "utf8");
      expect(source).toContain("useOverlayExit(ref, opener, open,");
      expect(source).toContain("if (opener.current?.isConnected) opener.current.focus()");
      expect(source).toContain("aria-labelledby={titleId}");
      expect(source).toContain("<dialog");
      expect(source).toContain("onCancel={event =>");
      expect(source).toContain("onClick={event =>");
      expect(source).toContain("<ScrollCue");
      expect(source).toContain("--lms-visual-height");
    }
    const exitHook=readFileSync("src/components/ui/use-overlay-exit.ts","utf8");
    expect(exitHook).toContain("dialog.showModal()");
    expect(exitHook).toContain("opener.focus()");
  });
});
