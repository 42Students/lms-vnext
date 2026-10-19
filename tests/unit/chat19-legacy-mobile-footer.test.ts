import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const mobile = () => readFileSync("src/components/shell/learner-faculty-mobile-footer.tsx", "utf8");
const styles = () => readFileSync("src/components/shell/legacy-mobile-footer.css", "utf8");
const shell = () => readFileSync("src/components/shell/app-shell.tsx", "utf8");
const legacy = () => readFileSync("docs/design/legacy-styles/components___antddesign.scss", "utf8");

/** Static old-LMS guardrails; no app/CI is executed in the owner sprint. */
describe("chat-19 legacy learner/faculty mobile footer", () => {
  it("retains original bottom height and phone safe-area geometry", () => {
    expect(legacy()).toContain("height: calc(64px + env(safe-area-inset-bottom, 0px))");
    expect(styles()).toContain("height:calc(64px + env(safe-area-inset-bottom,0px))");
    expect(styles()).toContain("bottom:0");
    expect(styles()).toContain("border-top:1px solid #f1f4f9");
    expect(styles()).toContain("padding-bottom:env(safe-area-inset-bottom,0px)");
    expect(styles()).toContain("box-shadow:0 -2px 8px rgba(0,0,0,.04)");
  });
  it("uses production 24px artwork, neutral inactive opacity and active opacity 1", () => {
    expect(mobile()).toContain("width={24} height={24}");
    expect(styles()).toContain("width:24px;height:24px;object-fit:contain;opacity:.5");
    expect(styles()).toContain("transition:opacity .15s ease");
    expect(styles()).toContain(".lms-legacy-mobile-footer-items .active .lms-legacy-mobile-footer-icon {opacity:1;}");
  });
  it("anchors the original AntD small badge to the bell with a red 14px indicator", () => {
    expect(mobile()).toContain('className="lms-legacy-mobile-footer-icon-wrap"');
    expect(mobile()).toContain('className="lms-legacy-mobile-footer-badge"');
    expect(mobile()).toContain('{unread>99?"99+":unread}');
    expect(styles()).toContain(".lms-legacy-mobile-footer-icon-wrap {");
    expect(styles()).toContain("position:relative;");
    expect(styles()).toContain("transform:translate(50%,-50%)");
    for (const value of ["min-width:14px;", "height:14px;", "font-size:12px;",
      "line-height:14px;", "background:#ff4d4f;", "box-shadow:0 0 0 1px #fff;"]) {
      expect(styles(), value).toContain(value);
    }
    // The counter is visual decoration; the link names its count for screen readers.
    expect(mobile()).toContain('aria-label={alerts?item.label+", "+unread+" unread":item.label}');
    expect(mobile()).toContain('aria-hidden="true" className="lms-legacy-mobile-footer-badge"');
  });
  it("retains learner and faculty icon order without mixing portal links", () => {
    const content = mobile();
    const learner = content.slice(content.indexOf("const learnerLinks"), content.indexOf("const facultyLinks"));
    const faculty = content.slice(content.indexOf("const facultyLinks"), content.indexOf("const recruiterLinks"));
    expect(learner).toContain('href:"/learn/courses"');
    expect(learner).toContain('href:"/learn/notifications"');
    expect(learner).toContain('href:"/learn/profile"');
    expect(faculty).toContain('href:"/teacher/allQuizzes"');
    expect(faculty).toContain('href:"/teacher/allAssignments"');
    expect(faculty).not.toContain("/tpo/");
    expect(content).toContain('href:"/hr/conversations"');
    expect(content).toContain('href:"/college/placements"');
    expect(content).toContain("items.some(item=>item.href===link.href)");
    expect(content).toContain("if (!learner && !faculty && !recruiter && !college && !mentor) return null");
    const imagePaths = [...content.matchAll(/icon:\s*"(\/assets\/images\/[^"]+)"/g)];
    for (const match of imagePaths) expect(existsSync("public" + match[1]), match[1]).toBe(true);
  });
  it("mounts once outside main and keeps route-level TPO footer separate", () => {
    expect(shell()).toContain('import { LearnerFacultyMobileFooter } from "./learner-faculty-mobile-footer"');
    expect(shell()).toContain("<LearnerFacultyMobileFooter items={navigation} />");
    expect(shell().indexOf("<LearnerFacultyMobileFooter items={navigation} />")).toBeGreaterThan(shell().indexOf("</main>"));
    expect(mobile()).toContain('data-slot="legacy-mobile-footer"');
  });
});
