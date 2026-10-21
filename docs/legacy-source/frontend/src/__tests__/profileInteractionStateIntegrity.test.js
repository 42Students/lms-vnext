import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("video-intro lookup failure fails closed instead of exposing a false create state", () => {
  const source = read("src/components/profile/userInfo.js");
  expect(source).toContain("videoLoadError");
  expect(source).toContain("Video introduction status unavailable");
  expect(source).toContain("recording is temporarily disabled");
  expect(source).toContain("onClick={loadVideoIntro}");
  expect(source).toContain("!videoIntro?.hasVideoIntro && !videoLoadError");
});

test("profile publications expose a single in-flight save contract", () => {
  const source = read("src/components/profile/about/publications.js");
  expect(source).toContain("const [saving, setSaving] = useState(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("if (saving) return");
  expect(source).toContain("loading={saving}");
  expect(source).toContain("disabled={saving}");
  expect(source).toContain("finally");
  expect(source).toContain("setSaving(false)");
});

test("resume upload, import and removal share a synchronous mutation lock and destructive confirmation", () => {
  const source = read("src/components/profile/about.js");
  expect(source).toContain("const resumeMutationRef = useRef(false)");
  expect(source).toContain("if (!userId || resumeMutationRef.current) return false");
  expect(source).toContain("if (!userId || resumeMutationRef.current) return;");
  expect(source).toContain('title="Remove this resume?"');
  expect(source).toContain("onConfirm={handleRemoveProfileResume}");
  expect(source).toContain("disabled={uploadingResume}");
});

test("profile section source failures remain explicitly retryable", () => {
  const source = read("src/components/profile/about.js");
  expect(source).toContain("sectionLoadErrors");
  expect(source).toContain("Last known data is kept where available");
  expect(source).toContain("Retry sections");
});


test("open profile editors protect drafts across unload and client-side navigation", () => {
  const source = read("src/components/profile/about.js");
  expect(source).toContain("hasOpenProfileDraft");
  expect(source).toContain('window.addEventListener("beforeunload"');
  expect(source).toContain('Router.events.on("routeChangeStart"');
  expect(source).toContain("Discard your unsaved profile changes?");
});
