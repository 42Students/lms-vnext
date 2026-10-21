import tpoRecruiterTheme, { isTpoRecruiterPath } from "@/layouts/tpoRecruiterTheme";

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe("TPO and HR antd theme", () => {
  const t = tpoRecruiterTheme.token;
  it("white text on the primary colour and on error badges reads at 4.5:1", () => {
    expect(ratio(t.colorPrimary, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.colorError, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
  it("secondary text and links read at 4.5:1 on white and on the soft page background", () => {
    expect(ratio(t.colorTextDescription, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.colorTextDescription, "#f8fafc")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.colorLink, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.colorLinkHover, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.colorLinkActive, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
  it("ordinary links use the role's brand primary instead of a separate one-off blue", () => {
    expect(t.colorLink).toBe(t.colorPrimary);
  });
  it("the Ant preset blue follows the portal primary instead of reintroducing royal blue", () => {
    expect(t.blue).toBe(t.colorPrimary);
    expect(t.cyan).toBe(t.colorPrimary);
  });
  it("uses the LMS control/card geometry and type scale instead of role-specific sizing", () => {
    expect(t.borderRadius).toBe(6);
    expect(t.borderRadiusLG).toBe(12);
    expect(t.controlHeight).toBe(40);
    expect(t.controlHeightSM).toBe(32);
    expect(t.fontSize).toBe(14);
    expect(t.fontSizeSM).toBe(13);
  });
  it("applies to /tpo and /recruiter pages only", () => {
    ["/tpo", "/tpo/home", "/recruiter/drives/[jobId]", "/recruiter"].forEach((p) => expect(isTpoRecruiterPath(p)).toBe(true));
    ["/", "/dashboard", "/admin/hr", "/tpo-fake", "/recruiterx", "/hr"].forEach((p) => expect(isTpoRecruiterPath(p)).toBe(false));
  });
});
