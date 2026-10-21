import fs from "fs";
import path from "path";

const read = (relative) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 12 shared accessibility hardening", () => {
  test("persistent shell controls have explicit names and loading announcements", () => {
    const header = read("src/components/Global/Header/Header.js");
    expect(header).toContain('aria-label="Loading page"');
    expect(header).toContain('aria-label="Search courses"');
    expect(header).toContain('aria-label="Switch workspace"');
    expect(header).toContain("Searching courses");
  });

  test("long route-tab navigation exposes current state and overflow guidance", () => {
    const shell = read("src/components/Common/PageShell.jsx");
    expect(shell).toContain('aria-current={tab.active ? "page" : undefined}');
    expect(shell).toContain("aria-describedby={tabs.length > 6 ? overflowHintId : undefined}");
    expect(shell).toContain("This section navigation scrolls horizontally");
  });

  test("shared drawer and confirmation flows preserve trigger focus safely", () => {
    const drawer = read("src/components/Global/RightDrawer/DrawerWidget.js");
    const confirmation = read("src/components/Global/ModalContainer/ConfirmationModal.jsx");
    expect(drawer).toContain("triggerRef.current = document.activeElement");
    expect(drawer).toContain("document.contains(trigger)");
    expect(drawer).toContain("trigger.focus()");
    expect(confirmation).toContain('typeof result.then === "function"');
    expect(confirmation).toContain("return result.then");
    expect(confirmation).toContain("restoreTriggerFocus()");
  });

  test("TPO message rows and quick replies are keyboard controls with an announced conversation log", () => {
    const messages = read("src/components/tpo/MessagesPanel.js");
    expect(messages).toContain('role="button"');
    expect(messages).toContain("tabIndex={0}");
    expect(messages).toContain('event.key === "Enter" || event.key === " "');
    expect(messages).toContain('role="log"');
    expect(messages).toContain('aria-label="Conversation messages"');
    expect(messages).toContain('aria-label="Search conversations"');
    expect(messages).toContain('className="tpo-message-panel__quick-reply"');
  });

  test("notification new-state meaning is not carried by a dot alone", () => {
    for (const file of [
      "src/components/tpo/TpoBellPanel.jsx",
      "src/components/recruiter/RecruiterNotificationBell.jsx",
    ]) {
      const source = read(file);
      expect(source).toContain('className="tpo-bell-panel__dot" aria-hidden="true"');
      expect(source).toContain('className="sr-only">New notification.');
    }
  });
});
