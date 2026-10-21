import fs from "fs";
import path from "path";

const read = (relative) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("shared control accessibility contracts", () => {
  test("ActionMenu gives its icon-only trigger an accessible name and announced popup state", () => {
    const source = read("src/components/Global/ActionMenu/actionMenu.js");
    expect(source).toContain('ariaLabel = "More actions"');
    expect(source).toContain('aria-label={ariaLabel}');
    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("onOpenChange={setOpen}");
    expect(source).toContain('aria-hidden="true"');
  });

  test("shared file upload is keyboard operable and profile upload actions reveal on focus", () => {
    const upload = read("src/components/Global/Button/uploadButton.jsx");
    const buttonStyles = read("src/styles/components/_button.scss");
    expect(upload).toContain("const inputRef = useRef(null)");
    expect(upload).toContain("<button");
    expect(upload).toContain('type="button"');
    expect(upload).toContain("inputRef.current?.click()");
    expect(buttonStyles).toContain("&:focus-within");
  });

  test("shared search/select wrappers always expose an accessible name", () => {
    const search = read("src/components/Global/Search/search.js");
    const select = read("src/components/Global/Select/select.js");
    expect(search).toContain('aria-label={props.ariaLabel || props.placeholder || "Search"}');
    expect(select).toContain('aria-label={ariaLabel || placeholder || "Select option"}');
  });

  test("shared card headers expose heading semantics", () => {
    const cardHeader = read("src/components/Global/CardHeader/cardHeader.js");
    expect(cardHeader).toContain('role="heading"');
    expect(cardHeader).toContain("aria-level={headingLevel}");
  });

  test("interactive metric pills announce popup state and support Escape focus return", () => {
    const source = read("src/components/Global/MetricPill/MetricPill.jsx");
    expect(source).toContain("<button");
    expect(source).toContain('type="button"');
    expect(source).toContain('aria-haspopup="dialog"');
    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("aria-controls={popoverId}");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('event.key !== "Escape"');
    expect(source).toContain("triggerRef.current?.focus()");
    expect(source).toContain("onOpenChange={setOpen}");
    expect(source).not.toContain('role={popover ? "button"');
  });

  test("profile image edit is a real button and crop sliders have programmatic labels", () => {
    const source = read("src/components/Global/Button/PencilUploadButton.jsx");
    expect(source).toContain('type="button"');
    expect(source).toContain('aria-label="Upload profile picture"');
    expect(source).toContain("profile-crop-zoom-label");
    expect(source).toContain("profile-crop-rotate-label");
    expect(source).toContain("setAttribute('aria-labelledby'");
  });
});
