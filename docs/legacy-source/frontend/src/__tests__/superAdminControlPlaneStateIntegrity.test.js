import fs from "fs";
import path from "path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const features = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/FeatureControlsHub.js"), "utf8");
const domains = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/CollegeSubdomain.js"), "utf8");
const colleges = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Colleges.js"), "utf8");

test("feature controls never turn a failed load into an empty college table", () => {
  expect(features).toMatch(/const \[loadError, setLoadError\] = useState\(null\)/);
  expect(features).toMatch(/Feature controls could not be loaded/);
  expect(features).toMatch(/Could not load feature controls; use Retry above/);
  expect(features).toMatch(/Module catalog is partially unavailable/);
});

test("tenant-domain loads are scope-safe and visibly recoverable", () => {
  expect(domains).toMatch(/const requestSeq = useRef\(0\)/);
  expect(domains).toMatch(/if \(seq !== requestSeq\.current\) return;/);
  expect(domains).toMatch(/Couldn't load the web address/);
});

test("college and organization source failures block dependent writes instead of looking empty", () => {
  expect(colleges).toMatch(/const \[loadError, setLoadError\] = useState\(null\)/);
  expect(colleges).toMatch(/const \[organizationsError, setOrganizationsError\] = useState\(null\)/);
  expect(colleges).toMatch(/Colleges could not be loaded/);
  expect(colleges).toMatch(/Organizations could not be loaded/);
  expect(colleges).toMatch(/Creating or moving a college is blocked until the organization list can be verified/);
});


test("tenant setup mutations are draft-safe, single-flight and fail closed", () => {
  const organizations = read("src/pages/superadmin/sections/Organizations.js");
  const colleges = read("src/pages/superadmin/sections/Colleges.js");
  const domains = read("src/pages/superadmin/sections/CollegeSubdomain.js");
  const branding = read("src/pages/superadmin/sections/CollegeBranding.js");
  const readiness = read("src/pages/superadmin/sections/ReadinessGate.js");

  expect(organizations).toContain("const actionRef = useRef(false)");
  expect(organizations).toContain("useUnsavedFormGuard");
  expect(organizations).toContain("!Array.isArray(result.data)");

  expect(colleges).toContain("const actionRef = useRef(false)");
  expect(colleges).toContain("Discard this bulk-import draft?");
  expect(colleges).toContain("Discard college changes?");

  expect(domains).toContain("const mutationRef = useRef(false)");
  expect(domains).toContain("if (mutationRef.current) return;");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(domains).toContain("if (mutationRef.current) return");

  expect(branding).toContain("const savingRef = useRef(false)");
  expect(branding).toContain("Branding could not be loaded");
  expect(branding).toContain("useUnsavedFormGuard");

  expect(readiness).toContain("Launch checklist could not be loaded");
  expect(readiness).toContain("Unexpected readiness response");
});

test("feature, module-access and tenant-settings writes use immediate locks and confirmation guards", () => {
  const features = read("src/pages/superadmin/sections/FeatureControlsHub.js");
  const access = read("src/pages/superadmin/sections/ModuleAccess.js");
  const settings = read("src/pages/superadmin/sections/TenantSettings.js");

  expect(features).toContain("const savingRef = useRef(false)");
  expect(features).toContain("const confirmRef = useRef(false)");
  expect(features).toContain("confirmRef.current");

  expect(access).toContain("const mutationRef = useRef(false)");
  expect(access).toContain("const confirmRef = useRef(false)");
  expect(access).toContain("if (mutationRef.current");

  expect(settings).toContain("const mutationRef = useRef(false)");
  expect(settings).toContain("const confirmRef = useRef(false)");
  expect(settings).toContain("useUnsavedFormGuard");
  expect(settings).toContain("Unexpected settings response");
  expect(settings).toContain("Settings could not be loaded or saved safely");
  expect(settings).toContain("Discard unsaved setting changes?");
});


test("control-plane scope switches cannot repaint or mutate a previous tenant", () => {
  const access = read("src/pages/superadmin/sections/ModuleAccess.js");
  const recruiters = read("src/pages/superadmin/sections/RecruiterAccounts.js");
  const settings = read("src/pages/superadmin/sections/TenantSettings.js");
  const branding = read("src/pages/superadmin/sections/CollegeBranding.js");
  const readiness = read("src/pages/superadmin/sections/ReadinessGate.js");

  expect(access).toContain("const activeCollegeRef = useRef(collegeId)");
  expect(access).toContain("Number(activeCollegeRef.current) !== Number(requestedCollegeId)");
  expect(access).toContain("const requestedCollegeId = collegeId");

  expect(recruiters).toContain("const listSeq = useRef(0)");
  expect(recruiters).toContain("const detailSeq = useRef(0)");
  expect(recruiters).toContain("const scopeKeyRef = useRef(scopeKey)");
  expect(recruiters).toContain("requestedScope !== scopeKeyRef.current");

  expect(settings).toContain("const loadSeq = useRef(0)");
  expect(settings).toContain("const activeScopeKeyRef = useRef(activeScopeKey)");
  expect(settings).toContain("requestedScopeKey !== activeScopeKeyRef.current");

  expect(branding).toContain("const requestSeq = useRef(0)");
  expect(branding).toContain("const activeCollegeRef = useRef(fixedCollegeId)");
  expect(readiness).toContain("const requestSeq = useRef(0)");

  // Switching college drops any in-flight load for the previous one.
  const domains = read("src/pages/superadmin/sections/CollegeSubdomain.js");
  expect(domains).toContain("return () => { ++requestSeq.current; };");
  expect(domains).toContain("}, [fixedCollegeId]);");
});

test("tenant setup and settings expose the real operational scope", () => {
  const tenants = read("src/pages/superadmin/sections/TenantsHub.js");
  const settings = read("src/pages/superadmin/sections/TenantSettings.js");

  expect(tenants).toContain("router.query.tab");
  expect(tenants).toContain('persistTab("identity")');
  expect(tenants).toContain("A tenant scope is selected, so creating is turned off");

  expect(settings).toContain('const scopeWritable = scopeType !== "ORG"');
  expect(settings).toContain("No runtime reader consumes organization-level settings");
  expect(settings).toContain("!scopeWritable");
});

test("deleted recruiter accounts do not expose live-account actions", () => {
  const recruiters = read("src/pages/superadmin/sections/RecruiterAccounts.js");

  expect(recruiters).toContain('r.status === "DELETED" || actionBusy != null');
  expect(recruiters).toContain('r.status === "ACTIVE" ? (');
  expect(recruiters).toContain('r.status !== "ACTIVE" || actionBusy != null');
  expect(recruiters).toContain('detail.status === "DELETED"');
});
