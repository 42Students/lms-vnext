import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// The sign-in page's flows against scripted server answers: one phone with accounts in many colleges, suspended
// accounts, accounts without a college address, duplicates, a college's own address, sign-in methods, refresh.
// Login audit 2026-10-12.

const mockAuth = {
  mobileAuthStart: jest.fn(),
  mobileAuthSend: jest.fn(),
  mobileAuthVerify: jest.fn(),
  mobileAuthEmailFallbackSend: jest.fn(),
  mobileAuthEmailFallbackVerify: jest.fn(),
  emailLoginStart: jest.fn(),
  emailLoginSend: jest.fn(),
};
let mockBootstrap = { mode: "GLOBAL" };

jest.mock("@/api/Services/MobileAuthService", () => {
  // Wrappers: jest.mock factories run before mockAuth is initialised, so each call looks it up when made.
  const names = ["mobileAuthStart", "mobileAuthSend", "mobileAuthVerify", "mobileAuthEmailFallbackSend", "mobileAuthEmailFallbackVerify", "emailLoginStart", "emailLoginSend"];
  return Object.fromEntries(names.map((n) => [n, (...args) => mockAuth[n](...args)]));
});
jest.mock("@/api/Services/TenantService", () => ({ getTenantBootstrap: () => Promise.resolve(mockBootstrap) }));
jest.mock("@/api/Services/AuthOrgService", () => ({ getMemberships: () => Promise.resolve({ data: {} }) }));
const mockRouter = { isReady: true, query: {}, pathname: "/login", replace: jest.fn(() => Promise.resolve()), push: jest.fn() };
jest.mock("next/router", () => ({ useRouter: () => mockRouter })); // one router object, as in the app
jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (fn) => fn({ loginUser: {} }) }));
jest.mock("@/redux/store", () => ({ loginUserAction: { setIsUserLoggedIn: jest.fn(), handleUserData: jest.fn() } }));
jest.mock("@/components/Loader/loader", () => ({ __esModule: true, default: () => null }));
jest.mock("@/utils/authUtils", () => ({
  storeAuthResponse: (a) => a?.user || null,
  getAndClearLogoutReason: () => null,
  getAndClearSessionReturnPath: () => null,
  isLoggedIn: () => false,
  getStoredUserData: () => null,
  clearAllTokens: jest.fn(),
  isNativeAppShell: () => false,
}));
jest.mock("@/utils/tenantUtils", () => ({
  saveTenantBootstrapToStorage: jest.fn(),
  getTenantCollegeId: () => null,
  getGlobalHost: () => "42lms.com",
  clearTenantBootstrapFromStorage: jest.fn(),
  isLocalDevelopmentHost: () => true,
}));

// eslint-disable-next-line import/first
import LoginPage from "../Login";

const choice = (choiceId, key, label, collegeId, host, extra = {}) => ({
  choiceId, key, label, collegeId, host, hostVerified: host ? true : null, userType: key.split(":")[1], ...extra,
});

const threeColleges = [
  choice(1, "acc:LEARNER:254:college:6", "NSRIT • Learner", 6, "nsrit42.42lms.com"),
  choice(2, "acc:LEARNER:902:college:9", "KL University • Learner", 9, "klu.42lms.com"),
  choice(3, "acc:LEARNER:977:college:10", "IIIT Dharwad • Learner", 10, "iiitdwd.42lms.com"),
];

const fail = (code) => Object.assign(new Error(code), { code });

async function renderPage() {
  const view = render(<LoginPage />);
  await act(async () => { await Promise.resolve(); });
  return view;
}

async function usePhone(number) {
  const phoneTab = screen.queryByRole("tab", { name: /phone/i });
  if (phoneTab) fireEvent.click(phoneTab);
  fireEvent.change(document.querySelector("#phone-input"), { target: { value: number } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue/i })); });
}

const options = () => [...document.querySelectorAll(".ln2-account")];
const selected = () => options().find((o) => o.getAttribute("aria-checked") === "true");
const fieldError = () => document.querySelector(".ant-form-item-explain-error")?.textContent || null;

beforeEach(() => {
  Object.values(mockAuth).forEach((fn) => fn.mockReset());
  mockBootstrap = { mode: "GLOBAL" };
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("one phone, accounts in several colleges", () => {
  test("lists every college, preselects the last used, and sends the picked account's key", async () => {
    window.localStorage.setItem("lms_last_membership_key", "acc:LEARNER:902:college:9");
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: threeColleges });
    mockAuth.mobileAuthSend.mockResolvedValue({ mode: "OTP_SENT", attemptId: "a-1", choice: threeColleges[2] });
    await renderPage();
    await usePhone("9100060001");

    expect(options()).toHaveLength(3);
    expect(selected().getAttribute("aria-label")).toMatch(/^KL University/);

    fireEvent.click(options().find((o) => o.getAttribute("aria-label").startsWith("IIIT")));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue/i })); });

    expect(mockAuth.mobileAuthSend).toHaveBeenCalledWith("9100060001", 3, "acc:LEARNER:977:college:10");
    expect(screen.getByText("Enter your code")).toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem("lms_login_attempt")).choiceKey).toBe("acc:LEARNER:977:college:10");
  });

  test("editing the number drops the list and the chosen account", async () => {
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: threeColleges });
    await renderPage();
    await usePhone("9100060001");
    expect(options()).toHaveLength(3);
    fireEvent.change(document.querySelector("#phone-input"), { target: { value: "910006000" } });
    expect(options()).toHaveLength(0);
  });

  test("a list that changed since it was shown is refused, cleared and explained", async () => {
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: threeColleges });
    mockAuth.mobileAuthSend.mockRejectedValue(fail("INVALID_CHOICE"));
    await renderPage();
    await usePhone("9100060001");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue/i })); });
    expect(options()).toHaveLength(0);
    await waitFor(() => expect(document.body.textContent).toMatch(/list of accounts changed/i));
  });
});

describe("accounts that need care", () => {
  test("a suspended account is shown as suspended, can't be picked and is never preselected", async () => {
    window.localStorage.setItem("lms_last_membership_key", "acc:LEARNER:254:college:6");
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: [
      choice(1, "acc:LEARNER:254:college:6", "NSRIT • Learner", 6, "nsrit42.42lms.com", { suspended: true }),
      choice(2, "acc:FACULTY:18:college:6:facultyType:PROFESSOR", "NSRIT • Instructor", 6, "nsrit42.42lms.com"),
    ] });
    await renderPage();
    await usePhone("9876543210");

    const suspended = options().find((o) => /suspended/.test(o.getAttribute("aria-label")));
    expect(suspended).toBeDisabled();
    expect(suspended.textContent).toMatch(/Suspended/);
    expect(selected().getAttribute("aria-label")).toMatch(/Instructor/);
  });

  test("when every account is suspended nothing is chosen and Continue asks to choose", async () => {
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: [
      choice(1, "acc:LEARNER:1:college:6", "NSRIT • Learner", 6, "nsrit42.42lms.com", { suspended: true }),
      choice(2, "acc:LEARNER:2:college:9", "KL University • Learner", 9, "klu.42lms.com", { suspended: true }),
    ] });
    await renderPage();
    await usePhone("9876543210");
    expect(selected()).toBeUndefined();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue/i })); });
    expect(mockAuth.mobileAuthSend).not.toHaveBeenCalled();
  });

  test("an account whose college has no address yet can be picked and signs in here", async () => {
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: [
      choice(1, "acc:FACULTY:10:college:8", "Audit CSV College • Instructor", 8, null),
      choice(2, "acc:LEARNER:1:college:1", "42Learn • Learner", 1, "college1.42lms.com"),
    ] });
    mockAuth.mobileAuthSend.mockResolvedValue({ mode: "OTP_SENT", attemptId: "a-2", choice: {} });
    await renderPage();
    await usePhone("8801448346");
    const noAddress = options().find((o) => o.getAttribute("aria-label").startsWith("Audit CSV College"));
    expect(noAddress).not.toBeDisabled();
    fireEvent.click(noAddress);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue/i })); });
    expect(mockAuth.mobileAuthSend).toHaveBeenCalledWith("8801448346", 1, "acc:FACULTY:10:college:8");
  });

  test("two accounts that read the same are numbered", async () => {
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: [
      choice(1, "acc:LEARNER:11:college:6", "NSRIT • Learner", 6, "nsrit42.42lms.com"),
      choice(2, "acc:LEARNER:12:college:6", "NSRIT • Learner", 6, "nsrit42.42lms.com"),
    ] });
    await renderPage();
    await usePhone("9000000002");
    const labels = options().map((o) => o.getAttribute("aria-label"));
    expect(labels.some((l) => /account 1/.test(l))).toBe(true);
    expect(labels.some((l) => /account 2/.test(l))).toBe(true);
  });

  test("a single suspended account says so (no code is sent)", async () => {
    mockAuth.mobileAuthStart.mockRejectedValue(fail("ACCOUNT_SUSPENDED"));
    await renderPage();
    await usePhone("9876543210");
    await waitFor(() => expect(document.body.textContent).toMatch(/account is suspended/i));
    expect(screen.queryByText("Enter your code")).toBeNull();
  });
});

describe("not registered, and a college's own address", () => {
  test("a number nobody has says so under the field", async () => {
    mockAuth.mobileAuthStart.mockRejectedValue(fail("NOT_REGISTERED"));
    await renderPage();
    await usePhone("9000000001");
    expect(fieldError()).toMatch(/isn't registered/);
  });

  test("a number from another college says so and offers the main sign-in page", async () => {
    mockBootstrap = { mode: "TENANT", collegeName: "KL University", loginMethods: "PHONE_EMAIL" };
    mockAuth.mobileAuthStart.mockRejectedValue(fail("NO_ACCOUNT_FOR_DOMAIN"));
    await renderPage();
    await usePhone("9100060001");
    expect(fieldError()).toMatch(/isn't registered at this college/);
    expect(screen.getByRole("link", { name: /main sign-in page/i })).toBeInTheDocument();
  });

  test("a phone-only college shows no email option; an email-only one no phone option", async () => {
    mockBootstrap = { mode: "TENANT", collegeName: "KL University", loginMethods: "PHONE_ONLY" };
    const first = await renderPage();
    expect(screen.queryByRole("tab", { name: /email/i })).toBeNull();
    expect(document.querySelector("#phone-input")).not.toBeNull();
    first.unmount();
    mockBootstrap = { mode: "TENANT", collegeName: "KL University", loginMethods: "EMAIL_ONLY" };
    await renderPage();
    expect(screen.queryByRole("tab", { name: /phone/i })).toBeNull();
    expect(document.querySelector("#email-input")).not.toBeNull();
  });
});

describe("email with accounts in several places", () => {
  test("the picked account's key goes with the email", async () => {
    mockAuth.emailLoginStart.mockResolvedValue({ mode: "CHOOSE_ACCOUNT", choices: [
      choice(1, "acc:LEARNER:5:college:6", "NSRIT • Learner", 6, "nsrit42.42lms.com"),
      choice(2, "acc:FACULTY:7:college:9", "KL University • Instructor", 9, "klu.42lms.com"),
    ] });
    mockAuth.emailLoginSend.mockResolvedValue({ mode: "EMAIL_OTP_SENT", attemptId: "e-1", maskedEmail: "t***@example.com", choice: {} });
    await renderPage();
    fireEvent.change(document.querySelector("#email-input"), { target: { value: "tester@example.com" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue/i })); });
    fireEvent.click(options().find((o) => o.getAttribute("aria-label").startsWith("KL University")));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue/i })); });
    expect(mockAuth.emailLoginSend).toHaveBeenCalledWith("tester@example.com", 2, "acc:FACULTY:7:college:9");
    expect(screen.getByText("Enter your code")).toBeInTheDocument();
  });
});

describe("the code screen", () => {
  test("after a refresh it comes back, and Resend goes to the same account by its key", async () => {
    window.sessionStorage.setItem("lms_login_attempt", JSON.stringify({
      id: "a-9", choiceId: 3, choiceKey: "acc:LEARNER:977:college:10", phone: "9100060001", host: window.location.host,
      channel: "mobile", maskedEmail: "", expiresAt: Date.now() + 120000, createdAt: Date.now() - 60000,
    }));
    mockAuth.mobileAuthSend.mockResolvedValue({ mode: "OTP_SENT", attemptId: "a-10", choice: {} });
    await renderPage();
    expect(screen.getByText("Enter your code")).toBeInTheDocument();
    // The saved attempt's 30 s wait is over; the label settles on "Resend code" within a second.
    const resend = await screen.findByRole("button", { name: /^resend code$/i }, { timeout: 2500 });
    await act(async () => { fireEvent.click(resend); });
    expect(mockAuth.mobileAuthSend).toHaveBeenCalledWith("9100060001", 3, "acc:LEARNER:977:college:10");
  });

  test("too many wrong codes: says so, and a new code can be asked for at once", async () => {
    mockAuth.mobileAuthStart.mockResolvedValue({ mode: "OTP_SENT", attemptId: "a-3", choice: threeColleges[0] });
    mockAuth.mobileAuthVerify.mockRejectedValue(fail("OTP_ATTEMPTS_EXCEEDED"));
    await renderPage();
    await usePhone("9100060001");
    fireEvent.change(document.querySelector("#otp-input"), { target: { value: "1234" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /verify and sign in/i })); });
    await waitFor(() => expect(document.body.textContent).toMatch(/Too many wrong codes/));
    expect(screen.getByRole("button", { name: /^resend code$/i })).not.toBeDisabled();
  });
});
