const fs = require("fs");
const path = require("path");

describe("42 Tracker standalone shell", () => {
  test("restores document scrolling for nolayout tracker pages", () => {
    const shell = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/TrackerShell.jsx"),
      "utf8"
    );
    const styles = fs.readFileSync(
      path.resolve(__dirname, "../../styles/pages/_bug-tracker.scss"),
      "utf8"
    );

    expect(shell).toContain('classList.add("tracker-scroll-active")');
    expect(shell).toContain('classList.remove("tracker-scroll-active")');
    expect(styles).toContain("html.tracker-scroll-active");
    expect(styles).toContain("overflow-y: auto !important");
  });

  test("keeps tracker primary actions on the LMS teal token", () => {
    const styles = fs.readFileSync(
      path.resolve(__dirname, "../../styles/pages/_bug-tracker.scss"),
      "utf8"
    );
    expect(styles).toContain(".ant-btn-primary");
    expect(styles).toContain("background: $clrThird");
  });
});
