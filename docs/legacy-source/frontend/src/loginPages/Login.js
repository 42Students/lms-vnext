import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Input } from "antd";
import Head from "next/head";
import LoginDecor from "./LoginDecor";
import LoginRobot from "./LoginRobot";
import Loader from "@/components/Loader/loader";
import { message } from "antd";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "@/redux/store";
import { facultyTypeEnumObj } from "@/common/constant";
import { storeAuthResponse, getAndClearLogoutReason, getAndClearSessionReturnPath, isLoggedIn, getStoredUserData, clearAllTokens, isNativeAppShell } from "@/utils/authUtils";
import { getTenantBootstrap } from "@/api/Services/TenantService";
import { saveTenantBootstrapToStorage, getTenantCollegeId, getGlobalHost, clearTenantBootstrapFromStorage, isLocalDevelopmentHost } from "@/utils/tenantUtils";
import { mobileAuthStart, mobileAuthSend, mobileAuthVerify, mobileAuthEmailFallbackSend, mobileAuthEmailFallbackVerify, emailLoginStart, emailLoginSend } from "@/api/Services/MobileAuthService";
import { getMemberships } from "@/api/Services/AuthOrgService";
import {
  ROLE,
  homePathForRole,
  isInPortal,
  isStrictPortalRole,
  portalForRole,
  resolveRoleFromUser,
} from "@/config/roles";
import { isRecruiterType } from "@/config/roles";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Codes after which the code screen's attempt can't be used any more: the person asks for a new code.
const DEAD_ATTEMPT = new Set(["OTP_EXPIRED", "EMAIL_OTP_EXPIRED", "INVALID_ATTEMPT", "OTP_ATTEMPTS_EXCEEDED", "WRONG_TENANT", "ACCOUNT_SUSPENDED"]);

/**
 * One sentence per server answer (PublicMobileAuthController). The requests here use fetch, so the code is on
 * `error.code`; reading `error.response.data` (an axios shape) found nothing, and every phone refusal, "not
 * registered" included, used to say "Unable to send OTP right now".
 */
export function loginErrorMessage(code, { channel = "phone" } = {}) {
  const what = channel === "email" ? "email" : "number";
  switch (code) {
    case "NOT_REGISTERED":
    case "INVALID_EMAIL":
      return channel === "email" ? "We couldn't find an account with that email." : "This number isn't registered. Check it, or sign in with your email.";
    case "NO_ACCOUNT_FOR_DOMAIN":
      return `This ${what} isn't registered at this college. If you belong to another college, use the main sign-in page (42lms.com).`;
    case "ACCOUNT_SUSPENDED":
      return "This account is suspended. Contact your college administrator.";
    case "ACCOUNT_UNAVAILABLE":
    case "USER_NOT_FOUND":
      return "This account can't sign in right now. Contact your college administrator.";
    case "TOO_MANY_REQUESTS":
      return "Too many codes were requested. Try again in about 10 minutes.";
    case "TOO_SOON":
      return "A code was just sent. Wait a few seconds before asking for another.";
    case "OTP_DELIVERY_FAILED":
      return channel === "email" ? "We couldn't send the email just now. Try again." : "We couldn't send the text message just now. Try again, or get the code by email.";
    case "LOGIN_METHOD_DISABLED":
      return channel === "email" ? "This college signs in with a mobile number. Use your phone number instead." : "This college signs in with email. Use your email instead.";
    case "INVALID_CHOICE":
      return "The list of accounts changed. Choose your account again.";
    case "MOBILE_AUTH_TIMEOUT":
      return "That took too long. Check your connection and try again.";
    case "INCORRECT_OTP":
      return "That code isn't right. Check it and try again.";
    case "OTP_EXPIRED":
    case "EMAIL_OTP_EXPIRED":
    case "INVALID_ATTEMPT":
      return "This code has expired. Ask for a new one.";
    case "OTP_ATTEMPTS_EXCEEDED":
      return "Too many wrong codes. Ask for a new one.";
    case "WRONG_TENANT":
      return "This code was asked for on another college's address. Start again here.";
    case "EMAIL_NOT_FOUND":
      return "No email is saved on this account. Use the code sent to your phone.";
    case "RECRUITER_COLLEGE_ADDRESS":
      return "Recruiters sign in at their college's placement address, for example klu.42lms.com. It's in your invitation email.";
    default:
      return "Something went wrong. Try again in a moment.";
  }
}

const LoginPage = () => {
  const dispatch = useDispatch();
  const [isOTPTriggered, setOTPTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumValid, setphoneNumValid] = useState(true);
  // recruiter V1 §10/§2: recruiters sign in by email, not phone - a separate mini-flow on this same
  // screen. The shared login page is used by every role, so this no longer advertises itself
  // there with a visible toggle; it only activates via a direct "?recruiter=email" link (e.g.
  // from a recruiter invite email), so an email-only recruiter account still has a way in.
  const [emailMode, setEmailMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [emailValid, setEmailValid] = useState(true);
  // What is wrong with the number/email itself (not registered here, ...), shown under the field.
  const [fieldProblem, setFieldProblem] = useState(null);
  // Avoid hard-blocking the entire login UI behind a spinner.
  // We still bootstrap tenant in the background, but login form should render immediately.
  const [loaderSpin, setLoaderSpin] = useState(false);
  const [rawMessageApi, contextHolder] = message.useMessage();
  // Every sign-in error also tells the robot on the card (LoginRobot.jsx) to look sorry.
  const messageApi = useMemo(() => ({
    ...rawMessageApi,
    error: (config) => {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ln2-robot", { detail: "oops" }));
      // One error at a time: five wrong codes used to stack five identical messages.
      return rawMessageApi.error(config && typeof config === "object" ? { key: "ln2-error", ...config } : config);
    },
  }), [rawMessageApi]);
  const router = useRouter();
  const loginUser = useSelector(state => state.loginUser);
  // Consent is given by continuing: the line under each button says so (there is no terms checkbox).
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);
  const loginFlowSeqRef = useRef(0);
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [tenantBootstrap, setTenantBootstrap] = useState(null);
  const [tenantBootstrapError, setTenantBootstrapError] = useState(null);
  const [domainAccountError, setDomainAccountError] = useState(null);
  const [accountChoices, setAccountChoices] = useState([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  // The chosen account's stable key (acc:TYPE:id:college:n). The server matches on it: choiceId is only a position in a
  // list it rebuilds on every call, so "choice 2" could become another account between the list and Continue.
  const choiceKeyRef = useRef(null);

  // Only a direct "?recruiter=email" link opens the email mini-flow now - the shared login page
  // itself shows the same plain mobile-number form it always has, for every role.
  useEffect(() => {
    if (router.isReady && router.query.recruiter === "email") setEmailMode(true);
  }, [router.isReady, router.query.recruiter]);
  const [otpChannel, setOtpChannel] = useState("mobile");
  const [otpEmailTarget, setOtpEmailTarget] = useState("");
  const [resendCooldownUntilMs, setResendCooldownUntilMs] = useState(0);
  const nativeAppShell = useMemo(() => isNativeAppShell(), []);
  const LOGIN_ATTEMPT_KEY = "lms_login_attempt";
  // Must not read localStorage during initial render (SSR hydration mismatch risk).
  const [tenantCollegeId, setTenantCollegeId] = useState(null);
  const LAST_MEMBERSHIP_KEY = "lms_last_membership_key";

  const getPostLoginPath = useCallback((user) => {
    const role = resolveRoleFromUser(user);
    let fallback = "/";

    // Keep existing role homes as the fallback, then allow a short-lived session-expiry
    // return path only when it belongs to a portal this role is allowed to use.
    if (isStrictPortalRole(role)) fallback = homePathForRole(role);
    else if (user?.userType === "FACULTY") {
      if (user?.facultyType === facultyTypeEnumObj.ADMIN) fallback = "/college-admin/dashboard";
      else if (user?.facultyType === facultyTypeEnumObj.MENTOR) fallback = "/mentor/projects";
      else fallback = "/teacher/courses";
    } else if (user?.userType === "LEARNER") {
      fallback = "/learn/courses";
    }

    const savedPath = getAndClearSessionReturnPath();
    if (!savedPath || !role) return fallback;

    const pathname = savedPath.split(/[?#]/, 1)[0];
    const ownPortal = portalForRole(role);
    const inOwnPortal = isInPortal(pathname, ownPortal);
    const tpoGuest =
      isInPortal(pathname, "/tpo") &&
      (role === ROLE.ADMIN || role === ROLE.FACULTY);

    return inOwnPortal || tpoGuest ? savedPath : fallback;
  }, []);

  const normalizePhoneInput = useCallback((value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 12 && digits.startsWith("91")) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith("0")) {
      return digits.slice(1);
    }
    // Never silently truncate a malformed number into someone else's valid account.
    return digits;
  }, []);

  const isValidPhoneNumber = useCallback((value) => /^\d{10}$/.test(String(value || "")), []);

  const getUserCollegeId = useCallback((user) => {
    const value = user?.collegeId ?? user?.college_id ?? user?.college?.id;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }, []);

  const clearSavedLoginAttempt = useCallback(() => {
    try { sessionStorage.removeItem(LOGIN_ATTEMPT_KEY); } catch (_) {}
  }, []);

  // Persist only a short-lived, host-bound challenge identifier, NEVER an OTP or bearer token.
  // This permits a tab refresh to resume the same OTP challenge without spending another SMS.
  const persistLoginAttempt = useCallback((id, choiceId, phone, channel = "mobile", maskedEmail = "") => {
    // A phone attempt carries the number; an email-first attempt has none, only the masked address.
    const hasPhone = /^\d{10}$/.test(String(phone || ""));
    if (typeof window === "undefined" || !id || (!hasPhone && !(channel === "email" && maskedEmail))) return;
    try {
      const now = Date.now();
      let previous = null;
      try { previous = JSON.parse(sessionStorage.getItem(LOGIN_ATTEMPT_KEY) || "null"); } catch (_) {}
      const sameAttempt = previous?.id === id && previous?.host === window.location.host;
      const expiresAt = sameAttempt && Number(previous?.expiresAt) > now
        ? Number(previous.expiresAt) : now + 5 * 60 * 1000;
      sessionStorage.setItem(LOGIN_ATTEMPT_KEY, JSON.stringify({
        id, choiceId, choiceKey: choiceKeyRef.current || null, phone: hasPhone ? phone : "", host: window.location.host, channel, maskedEmail, expiresAt,
        createdAt: sameAttempt ? Number(previous.createdAt) || now : now,
      }));
      if (!sameAttempt) setResendCooldownUntilMs(now + 30 * 1000);
    } catch (_) {}
  }, []);

  const backToLogin = () => {
    loginFlowSeqRef.current += 1;
    sendingRef.current = false;
    verifyingRef.current = false;
    clearSavedLoginAttempt();
    setLoading(false);
    setOTPTriggered(false);
    setAttemptId(null);
    setOtpChannel("mobile");
    setOtpEmailTarget("");
    setAccountChoices([]);
    setSelectedChoiceId(null);
    choiceKeyRef.current = null;
    setDomainAccountError(null);
    setFieldProblem(null);
  };

  // How people sign in here (super admin > Tenant Setup, per college; the global host is always email first, then phone).
  // ["email", "phone"] / ["phone", "email"] show a toggle in that order; one entry means only that method.
  const methodOrder = (() => {
    const m = String(tenantBootstrap?.mode === "TENANT" ? tenantBootstrap?.loginMethods || "" : "").toUpperCase();
    if (m === "PHONE_EMAIL") return ["phone", "email"];
    if (m === "EMAIL_ONLY") return ["email"];
    if (m === "PHONE_ONLY") return ["phone"];
    return ["email", "phone"];
  })();
  const methodKey = methodOrder.join(",");
  // Start on the first method whenever the setting arrives or changes (not after the person has moved on to the code).
  useEffect(() => {
    if (isOTPTriggered) return;
    setEmailMode(methodKey.split(",")[0] === "email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodKey]);
  const chooseMethod = (method) => {
    if (loading) return;
    setEmailMode(method === "email");
    setAccountChoices([]);
    setSelectedChoiceId(null);
    setDomainAccountError(null);
    setphoneNumValid(true);
    setEmailValid(true);
    setFieldProblem(null);
  };

  const normalizeHostOnly = useCallback((hostRaw) => {
    if (typeof hostRaw !== "string") return null;
    let host = hostRaw.trim();
    if (!host) return null;
    host = host.replace(/^https?:\/\//i, "");
    const slash = host.indexOf("/");
    if (slash > 0) host = host.substring(0, slash);
    if (host.startsWith("[")) {
      const end = host.indexOf("]");
      if (end > 1) host = host.substring(1, end);
    } else {
      const colon = host.indexOf(":");
      if (colon > 0) host = host.substring(0, colon);
    }
    host = host.toLowerCase();
    if (host.startsWith("www.")) host = host.substring(4);
    return host || null;
  }, []);

  // The page's start-up (college look-up, already-signed-in redirect, code screen restore) runs once. It used to re-run
  // whenever the router object changed, and every run restarted the restored code's resend countdown.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Bootstrap tenant from domain early (branding + tenant-scoped login)
    getTenantBootstrap()
      .then((b) => {
        saveTenantBootstrapToStorage(b);
        setIsGlobalMode(b?.mode === "GLOBAL");
        setTenantBootstrap(b || null);
        setTenantBootstrapError(null);
      })
      .catch((e) => {
        // If tenant bootstrap fails (e.g. global domain 42lms.com), use phone-based global login mode.
        clearTenantBootstrapFromStorage();
        setIsGlobalMode(true);
        setTenantBootstrap(null);
        setTenantBootstrapError({
          code: e?.code || e?.message || "TENANT_BOOTSTRAP_FAILED",
          status: typeof e?.status === "number" ? e.status : null,
        });
      });
    if (typeof window === "undefined") return;
    const logoutReason = getAndClearLogoutReason();
    if (logoutReason === "session_expired") {
      message.info("Your session expired. Please log in again.", 4);
    }

    // Prevent infinite login redirect loops when localStorage is stale but backend session/cookie is not.
    const redirectKey = "login_redirect_attempted";
    const alreadyAttempted = sessionStorage.getItem(redirectKey) === "1";
    if (isLoggedIn()) {
      sessionStorage.setItem(redirectKey, "1");
      const currentUserObject = getStoredUserData();
      const done = () => setLoaderSpin(false);
      const onErr = () => {
        if (alreadyAttempted) {
          clearAllTokens();
        }
        done();
      };
      const postLoginPath = getPostLoginPath(currentUserObject);
      if (postLoginPath && postLoginPath !== "/") {
        router.replace(postLoginPath).then(done).catch(onErr);
      } else {
        done();
      }
      clearSavedLoginAttempt();
    } else {
      sessionStorage.removeItem(redirectKey);
      setLoaderSpin(false);
      try {
        const saved = JSON.parse(sessionStorage.getItem(LOGIN_ATTEMPT_KEY) || "null");
        const valid = saved && saved.host === window.location.host
          && typeof saved.id === "string" && saved.id.length <= 128
          && (/^\d{10}$/.test(String(saved.phone || "")) || (saved.channel === "email" && saved.maskedEmail))
          && Number(saved.expiresAt) > Date.now();
        if (valid) {
          if (saved.phone) setPhoneNumber(saved.phone);
          else setEmailMode(true); // an email-first sign-in: "Change" goes back to the email form
          setAttemptId(saved.id);
          setSelectedChoiceId(saved.choiceId ?? null);
          choiceKeyRef.current = typeof saved.choiceKey === "string" ? saved.choiceKey : null;
          setOtpChannel(saved.channel === "email" ? "email" : "mobile");
          setOtpEmailTarget(String(saved.maskedEmail || ""));
          setOTPTriggered(true);
          // 0 when the 30 s wait is already over: "now" here could sit a moment past the countdown's clock and leave the
          // button frozen on "Resend code in 0:01".
          const resendAt = Number(saved.createdAt || 0) + 30000;
          setResendCooldownUntilMs(resendAt > Date.now() ? resendAt : 0);
        } else { clearSavedLoginAttempt(); }
      } catch (_) { clearSavedLoginAttempt(); }
    }
  }, [clearSavedLoginAttempt, getPostLoginPath, router]);

  // The code box gets the cursor whenever the code screen shows, including after a refresh (autoFocus alone missed that).
  useEffect(() => {
    if (!isOTPTriggered || typeof document === "undefined") return undefined;
    const t = setTimeout(() => document.getElementById("otp-input")?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOTPTriggered]);

  // resendCooldownUntilMs alone never changes once the cooldown starts, so a useMemo keyed only
  // on it computes the remaining seconds exactly once and then never again — the button freezes
  // on whatever count it started at (e.g. permanently "Resend in 30s"). Tick a local clock every
  // second while a cooldown is actually running so the derived seconds value keeps recomputing.
  const [resendCooldownClockMs, setResendCooldownClockMs] = useState(() => Date.now());
  useEffect(() => {
    if (!(Number(resendCooldownUntilMs) > Date.now())) {
      // Nothing to count down: bring the clock up to now so a just-ended wait doesn't read as "0:01".
      setResendCooldownClockMs(Date.now());
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      setResendCooldownClockMs(now);
      // Stop ticking once the cooldown has actually elapsed instead of running once a second for
      // the rest of the session — the effect only re-runs when resendCooldownUntilMs itself
      // changes (a new OTP send), not when the countdown it's tracking reaches zero on its own.
      if (now >= Number(resendCooldownUntilMs)) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldownUntilMs]);

  const resendCooldownSeconds = useMemo(() => {
    const ms = Math.max(0, (Number(resendCooldownUntilMs) || 0) - resendCooldownClockMs);
    return Math.ceil(ms / 1000);
  }, [resendCooldownUntilMs, resendCooldownClockMs]);

  // Derive tenant college id after mount only (prevents hydration mismatches).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isGlobalMode) {
      setTenantCollegeId(null);
      return;
    }
    setTenantCollegeId(getTenantCollegeId());
  }, [isGlobalMode]);

  const isLocalHost = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isLocalDevelopmentHost(window.location.hostname);
  }, []);

  const showDomainNotOnboardedBanner = useMemo(() => {
    // In dev we intentionally fall back to global mode to keep work moving.
    if (isLocalHost) return false;
    const code = tenantBootstrapError?.code || null;
    const status = tenantBootstrapError?.status;
    return status === 404 || code === "TENANT_NOT_FOUND" || code === "UNKNOWN_HOST";
  }, [isLocalHost, tenantBootstrapError]);

  const showTenantInfraBanner = useMemo(() => {
    if (isLocalHost) return false;
    if (!tenantBootstrapError) return false;
    return !showDomainNotOnboardedBanner;
  }, [isLocalHost, tenantBootstrapError, showDomainNotOnboardedBanner]);

  const globalLoginUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://42lms.com";
    const proto = window.location.protocol || "https:";
    return `${proto}//42lms.com`;
  }, []);

  const lastUsedMembershipKey = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const k = localStorage.getItem(LAST_MEMBERSHIP_KEY);
      return k && String(k).trim() ? String(k).trim() : null;
    } catch {
      return null;
    }
  }, []);

  const accountChoiceGroups = useMemo(() => {
    const toText = (value) => (typeof value === "string" && value.trim() ? value.trim() : "");
    const toTitleCase = (value) => {
      const text = toText(value);
      if (!text) return "";
      return text
        .toLowerCase()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    };
    const isGenericCollegeLabel = (value) => /^college(\s+\d+)?$/i.test(toText(value));
    const formatHostLabel = (host) => {
      const text = toText(host);
      if (!text) return "";
      const firstSegment = text.split(".")[0] || "";
      return toTitleCase(firstSegment.replace(/\d+$/g, "").replace(/-/g, " ")) || text;
    };
    const splitChoiceLabel = (value) => {
      const text = toText(value);
      if (!text) return { title: "", role: "" };
      const parts = text.split(/ - |\u2022/).map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return {
          title: parts.slice(0, -1).join("  -  "),
          role: parts[parts.length - 1],
        };
      }
      return { title: text, role: "" };
    };

    const sortedChoices = [...(Array.isArray(accountChoices) ? accountChoices : [])]
      .map((choice) => {
        const host = toText(choice?.host);
        const parsedLabel = splitChoiceLabel(choice?.label);
        const explicitCollegeName = toText(choice?.collegeName);
        const explicitOrganizationName = toText(choice?.organizationName);
        const derivedTitle = parsedLabel.title || formatHostLabel(host);
        const collegeName = (!isGenericCollegeLabel(explicitCollegeName) && explicitCollegeName)
          || derivedTitle
          || (choice?.collegeId != null ? `College ${choice.collegeId}` : "College workspace");
        const organizationName = explicitOrganizationName && explicitOrganizationName.toLowerCase() !== collegeName.toLowerCase()
          ? explicitOrganizationName
          : "";
        const role = toTitleCase(parsedLabel.role) || toTitleCase(choice?.role) || "Account";
        const facultyType = toTitleCase(choice?.facultyType);
        const roleLabel = facultyType && facultyType !== role ? `${role}  -  ${facultyType}` : role;
        const isLastUsed = Boolean(lastUsedMembershipKey) && String(choice?.key || "") === String(lastUsedMembershipKey);
        const isUnverified = choice?.switchWarning === "DOMAIN_UNVERIFIED" || choice?.hostVerified === false;
        const isSuspended = choice?.suspended === true;
        // A college without its own address signs in on this page (as a single such account always did); only a suspended
        // account can't be picked. "No domain" accounts used to be greyed out, so someone whose only usable account had
        // no address was stuck on the list.
        const isDisabled = isSuspended;

        return {
          raw: choice,
          choiceId: choice?.choiceId,
          organizationName,
          collegeName,
          host,
          roleLabel,
          isLastUsed,
          isUnverified,
          isDisabled,
          isSuspended,
          groupKey: `${collegeName.toLowerCase()}::${host.toLowerCase() || "no-host"}`,
        };
      })
      .sort((left, right) => {
        if (left.isLastUsed !== right.isLastUsed) return left.isLastUsed ? -1 : 1;
        if (left.isDisabled !== right.isDisabled) return left.isDisabled ? 1 : -1;
        return `${left.collegeName} ${left.roleLabel}`.localeCompare(`${right.collegeName} ${right.roleLabel}`);
      });

    const groups = [];
    const groupMap = new Map();

    sortedChoices.forEach((choice) => {
      if (!groupMap.has(choice.groupKey)) {
        const nextGroup = {
          key: choice.groupKey,
          title: choice.collegeName,
          host: choice.host,
          organizationName: choice.organizationName,
          hasLastUsed: choice.isLastUsed,
          items: [],
        };
        groupMap.set(choice.groupKey, nextGroup);
        groups.push(nextGroup);
      }
      const group = groupMap.get(choice.groupKey);
      group.hasLastUsed = group.hasLastUsed || choice.isLastUsed;
      group.items.push(choice);
    });
    // Two accounts that read the same (two learner records at one college) get a number, so they can be told apart.
    groups.forEach((group) => {
      const seen = new Map();
      group.items.forEach((item) => seen.set(item.roleLabel, (seen.get(item.roleLabel) || 0) + 1));
      const n = new Map();
      group.items.forEach((item) => {
        if (seen.get(item.roleLabel) > 1) {
          const k = (n.get(item.roleLabel) || 0) + 1;
          n.set(item.roleLabel, k);
          item.roleLabel = `${item.roleLabel} (account ${k})`;
        }
      });
    });

    return groups.sort((left, right) => {
      if (left.hasLastUsed !== right.hasLastUsed) return left.hasLastUsed ? -1 : 1;
      return `${left.title} ${left.organizationName}`.localeCompare(`${right.title} ${right.organizationName}`);
    });
  }, [accountChoices, lastUsedMembershipKey]);

  // ---------------------------------------------------------------- presentation helpers
  const collegeName = typeof tenantBootstrap?.collegeName === "string" && tenantBootstrap.collegeName.trim()
    ? tenantBootstrap.collegeName.trim()
    : "";
  const tenantLogoUrl = typeof tenantBootstrap?.logoUrl === "string" && tenantBootstrap.logoUrl.trim()
    ? tenantBootstrap.logoUrl.trim()
    : "";
  const shownPhone = (() => {
    const d = String(phoneNumber || "").replace(/\D/g, "").slice(-10);
    return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : "your mobile number";
  })();
  const resendLabel = resendCooldownSeconds > 0
    ? `Resend code in 0:${String(resendCooldownSeconds).padStart(2, "0")}`
    : otpChannel === "email" ? "Resend code to email" : "Resend code";
  const year = new Date().getFullYear();

  const brandMark = (
    <span className="ln2-brand" data-robot-tip="That's 42LMS: your classes, coursework and placements in one place.">
      <img src="/assets/images/logo.svg" alt="" className="ln2-brand__mark" />
      <span className="ln2-brand__word">42LMS</span>
    </span>
  );
  // On a college address the college is the identity on the card: its logo, or a monogram in its colour.
  const collegeMonogram = (() => {
    const words = collegeName.split(/\s+/).filter((word) => word && !/^(of|and|the|for|&)$/i.test(word));
    if (!words.length) return "";
    if (/^[A-Z]{2,5}$/.test(words[0])) return words[0].slice(0, 4);
    return words.slice(0, 2).map((word) => word[0].toUpperCase()).join("");
  })();
  const collegeIdentity = collegeName ? (
    <div className="ln2-college" data-robot-tip={`This is ${collegeName} on 42LMS. Sign in with the details your college has for you.`}>
      {tenantLogoUrl ? (
        <img src={tenantLogoUrl} alt="" className="ln2-college__logo" />
      ) : (
        <span className="ln2-college__mark" aria-hidden="true">{collegeMonogram}</span>
      )}
      <span className="ln2-college__name">{collegeName}</span>
    </div>
  ) : null;

  const banner = (title, body) => (
    <div className="ln2-alert" role="status">
      <div className="ln2-alert__title">{title}</div>
      <div className="ln2-alert__body">{body}</div>
      <a className="ln2-link" href={globalLoginUrl} data-robot-tip="Not sure this is your college's page? The main sign-in page works for everyone.">Use the main sign-in page (42lms.com)</a>
    </div>
  );

  const accountPicker = (
    <>
        {Array.isArray(accountChoices) && accountChoices.length > 0 && (
          <div className="ln2-accounts">
            <div className="ln2-label">Choose where to sign in</div>
            <p className="ln2-hint" data-robot-tip="You have more than one account. Pick the one you want to open now; you can switch later.">{emailMode ? "This email" : "This number"} is registered in more than one place.</p>
            <div className="ln2-accounts__list" role="radiogroup" aria-label="Available accounts">
              {accountChoiceGroups.map((group) => (
                <div key={group.key} className="ln2-accounts__group">
                  {group.items.map((choice) => {
                    const isSelected = String(choice.choiceId) === String(selectedChoiceId);
                    return (
                      <button
                        key={choice.choiceId}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-robot-tip={choice.isSuspended
                          ? "This account is suspended. Your college administrator can turn it back on."
                          : `Open your ${choice.roleLabel.toLowerCase()} account at ${group.title}.`}
                        aria-label={`${group.title}, ${choice.roleLabel}${group.host ? `, ${group.host}` : ""}${choice.isLastUsed ? ", last used" : ""}${choice.isSuspended ? ", suspended" : ""}`}
                        disabled={choice.isDisabled}
                        className={`ln2-account${isSelected ? " is-selected" : ""}${choice.isDisabled ? " is-disabled" : ""}`}
                        onClick={() => { setSelectedChoiceId(choice.choiceId); choiceKeyRef.current = choice.raw?.key || null; }}
                      >
                        <span className="ln2-account__radio" aria-hidden />
                        <span className="ln2-account__main">
                          <span className="ln2-account__org">{group.title}</span>
                          <span className="ln2-account__meta">
                            {choice.roleLabel}
                            {group.host ? <> · {group.host}</> : null}
                          </span>
                        </span>
                        <span className="ln2-account__tags">
                          {choice.isLastUsed && <span className="ln2-tag ln2-tag--info">Last used</span>}
                          {choice.isUnverified && <span className="ln2-tag ln2-tag--warn">Unverified</span>}
                          {choice.isSuspended && <span className="ln2-tag ln2-tag--danger">Suspended</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {domainAccountError === "NO_ACCOUNT_FOR_DOMAIN" && (
              <a className="ln2-link" href={globalLoginUrl}>Use the main sign-in page (42lms.com)</a>
            )}
          </div>
        )}
    </>
  );

  const consent = (
    <p className="ln2-consent">
      By continuing, you agree to the{" "}
      <a href="/assets/static/terms-and-conditions-view.html" target="_blank" rel="noopener noreferrer" data-robot-tip="The rules for using 42LMS. Opens in a new tab.">Terms of Use</a>
      {" "}and{" "}
      <a href="/assets/static/privacy-policy-view.html" target="_blank" rel="noopener noreferrer" data-robot-tip="How we keep your details safe. Opens in a new tab.">Privacy Policy</a>.
    </p>
  );

  return (
    <>
      <Head>
        <title>{collegeName ? `Sign in · ${collegeName}` : "Sign in · 42LMS"}</title>
        <meta name="description" content="Sign in to 42LMS." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      </Head>
      {!loaderSpin ? (
        <section
          className="ln2"
          style={{
          }}
        >
          {contextHolder}
          <LoginDecor />

          {/* ---------------------------------------------------------------- sign-in */}
          <div className="ln2-main">
            <header className="ln2-top">{collegeName ? null : brandMark}</header>

            <div className="ln2-card">
              <LoginRobot collegeName={collegeName} />
              {showDomainNotOnboardedBanner && banner(
                "This address isn't set up yet",
                "Ask your administrator to add this college's address in 42LMS, or use the main sign-in page.",
              )}
              {showTenantInfraBanner && banner(
                "We couldn't confirm this college right now",
                "This address may be correct, but its settings didn't load. Try again in a moment, or use the main sign-in page.",
              )}

              <div className="ln2-card__head">
                {collegeIdentity}
                {!isOTPTriggered ? (
                  <>
                    <h1 className="ln2-title">Sign in</h1>
                    <p className="ln2-subtitle">
                      {emailMode ? "Use your registered email address." : "Use your registered mobile number."}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="ln2-title">Enter your code</h1>
                    <p className="ln2-subtitle">
                      {otpChannel === "email" && otpEmailTarget
                        ? <>We sent a code to <strong>{otpEmailTarget}</strong>.</>
                        : <>We sent a code to <strong>{shownPhone}</strong>.</>}{" "}
                      <button type="button" className="ln2-inline-link" onClick={backToLogin} data-robot-tip={otpChannel === "email" && !phoneNumber ? "Wrong email? Change it here." : "Wrong number? Change it here."}>Change</button>
                    </p>
                  </>
                )}
              </div>

              {!isOTPTriggered && methodOrder.length > 1 && (
                <div className="ln2-switch" role="tablist" aria-label="Sign in with" data-active={methodOrder.indexOf(emailMode ? "email" : "phone")}>
                  <span className="ln2-switch__thumb" aria-hidden="true" />
                  {methodOrder.map((method) => {
                    const active = (method === "email") === emailMode;
                    return (
                      <button
                        key={method}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`ln2-switch__option${active ? " is-active" : ""}`}
                        data-robot-tip={method === "email" ? "Sign in with your email. I'll send a code to your inbox." : "Sign in with your mobile number. I'll text you a code."}
                        onClick={() => chooseMethod(method)}
                      >
                        {method === "email" ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
                        )}
                        {method === "email" ? "Email" : "Phone"}
                      </button>
                    );
                  })}
                </div>
              )}

              <Form
                name={isOTPTriggered ? "login" : "sendOtp"}
                layout="vertical"
                requiredMark={false}
                onFinish={e => {
                  if (isOTPTriggered) {
                    VerifyOTP(e);
                  }
                }}
                initialValues={{ remember: true }}
                autoComplete="on"
                className="ln2-form"
              >
                {!isOTPTriggered && emailMode ? (
                  <>
                    <label htmlFor="email-input" className="ln2-label">Email</label>
                    <Form.Item
                      name="Login_Email"
                      rules={[{ required: true, message: "Enter your email" }]}
                      validateStatus={!emailValid || fieldProblem ? "error" : undefined}
                      help={fieldProblem || (!emailValid ? "Enter a valid email address" : null)}
                    >
                      <Input
                        id="email-input"
                        type="email"
                        data-robot-tip="Type the email address your college has on record for you."
                        autoComplete="email"
                        value={loginEmail}
                        placeholder="you@example.com"
                        className="ln2-input"
                        onPressEnter={e => { e.preventDefault(); handleEmailLogin(); }}
                        onChange={e => {
                          setLoginEmail(e.target.value);
                          if (!emailValid) setEmailValid(true);
                          if (fieldProblem) setFieldProblem(null);
                          if (accountChoices.length) { setAccountChoices([]); setSelectedChoiceId(null); choiceKeyRef.current = null; }
                          if (domainAccountError) setDomainAccountError(null);
                        }}
                      />
                    </Form.Item>

                    {domainAccountError === "NO_ACCOUNT_FOR_DOMAIN" && !accountChoices.length && (
                      <a className="ln2-link" href={globalLoginUrl} data-robot-tip="Not sure this is your college's page? The main sign-in page works for everyone.">Use the main sign-in page (42lms.com)</a>
                    )}
                    {accountPicker}

                    <Button
                      type="primary"
                      block
                      className={`ln2-btn${EMAIL_SHAPE.test(loginEmail.trim()) ? "" : " ln2-btn--waiting"}`}
                      loading={loading}
                      onClick={handleEmailLogin}
                      htmlType="button"
                      data-robot-tip={accountChoices.length ? "Chosen? Press Continue and I'll email you a code." : "Press Continue and I'll email you a code."}
                    >
                      Continue
                    </Button>
                    {consent}
                  </>
                ) : !isOTPTriggered ? (
                  <>
                    <label htmlFor="phone-input" className="ln2-label">Mobile number</label>
                    <Form.Item
                      name="Mobile_Number"
                      rules={[{ required: true, message: "Enter your mobile number" }]}
                      validateStatus={!phoneNumValid || fieldProblem ? "error" : undefined}
                      help={fieldProblem || (!phoneNumValid ? "Enter a valid 10-digit mobile number" : null)}
                    >
                      <Input
                        id="phone-input"
                        type="tel"
                        data-robot-tip="Your 10-digit mobile number. No need to type +91."
                        inputMode="numeric"
                        autoComplete="tel-national"
                        prefix={<span className="ln2-cc">+91</span>}
                        value={phoneNumber}
                        placeholder="98765 43210"
                        className="ln2-input ln2-input--phone"
                        onWheel={e => e.target.blur()}
                        onPressEnter={e => { e.preventDefault(); handleSendOtp(); }}
                        onChange={e => {
                          setPhoneNumber(normalizePhoneInput(e.target.value));
                          if (!phoneNumValid) setphoneNumValid(true);
                          if (fieldProblem) setFieldProblem(null);
                          // The accounts listed belong to the number they were looked up for: editing it used to keep
                          // them, and Continue then asked for the code with the old list's choice.
                          if (accountChoices.length) { setAccountChoices([]); setSelectedChoiceId(null); choiceKeyRef.current = null; }
                          if (domainAccountError) setDomainAccountError(null);
                        }}
                      />
                    </Form.Item>

                    {domainAccountError === "NO_ACCOUNT_FOR_DOMAIN" && !accountChoices.length && (
                      <a className="ln2-link" href={globalLoginUrl} data-robot-tip="Not sure this is your college's page? The main sign-in page works for everyone.">Use the main sign-in page (42lms.com)</a>
                    )}
                    {accountPicker}

                    {/* Looks muted until the number is complete, but stays clickable so a tap still says what's missing. */}
                    <Button
                      type="primary"
                      block
                      className={`ln2-btn${isValidPhoneNumber(normalizePhoneInput(phoneNumber)) ? "" : " ln2-btn--waiting"}`}
                      loading={loading}
                      onClick={handleSendOtp}
                      htmlType="button"
                      data-robot-tip={accountChoices.length ? "Chosen? Press Continue and I'll text you a code." : "Press Continue and I'll text you a code."}
                    >
                      Continue
                    </Button>
                    {consent}
                  </>
                ) : (
                  <>
                    <label htmlFor="otp-input" className="ln2-label">One-time code</label>
                    <Form.Item name="OTP" rules={[{ required: true, message: "Enter the code we sent you" }, { pattern: /^\d{4,6}$/, message: "The code is 4 to 6 digits" }]}>
                      <Input
                        id="otp-input"
                        type="text"
                        data-robot-tip={otpChannel === "email" ? "Type the code from the email we sent you. I won't look!" : "Type the code from your text message. I won't look!"}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        maxLength={6}
                        className="ln2-input ln2-input--otp"
                        placeholder="Enter the code"
                        onWheel={e => e.target.blur()}
                        autoFocus
                      />
                    </Form.Item>

                    {!attemptId ? (
                      <p className="ln2-hint ln2-hint--warn">This code can&apos;t be used any more. Ask for a new one to continue.</p>
                    ) : null}

                    <div className="ln2-otp-actions">
                      <button
                        type="button"
                        className="ln2-inline-link"
                        onClick={handleResendOtp}
                        disabled={loading || resendCooldownSeconds > 0}
                        data-robot-tip={resendCooldownSeconds > 0 ? "Codes can take a moment. You can ask for a new one when the timer ends." : "Didn't get it? I'll send a new code."}
                      >
                        {resendLabel}
                      </button>
                      {attemptId && otpChannel !== "email" ? (
                        <button type="button" className="ln2-inline-link" onClick={handleUseEmailInstead} disabled={loading} data-robot-tip="No text message? I can email the code to you instead.">
                          Get the code by email
                        </button>
                      ) : null}
                    </div>

                    <Form.Item className="ln2-submit">
                      <Button type="primary" block className="ln2-btn" loading={loading} htmlType="submit" data-robot-tip="Typed the code? Press this and you're in.">
                        Verify and sign in
                      </Button>
                    </Form.Item>
                    {consent}
                  </>
                )}
              </Form>
            </div>

            <footer className="ln2-footer">
              <p className="ln2-footer__legal">
                {collegeName ? <>Powered by <strong>42LMS</strong> · </> : <>© {year} 42LMS · JRSPF Technologies Pvt. Ltd. ·{" "}</>}
                <a href="/assets/static/privacy-policy-view.html" target="_blank" rel="noopener noreferrer">Privacy</a>{" · "}
                <a href="/assets/static/terms-and-conditions-view.html" target="_blank" rel="noopener noreferrer">Terms</a>
              </p>
            </footer>
          </div>
        </section>
      ) : (
        <div className="ln-page-loader">
          <Loader />
        </div>
      )}
    </>
  );

  async function VerifyOTP(values) {
    if (verifyingRef.current) return;
    const flowSeq = ++loginFlowSeqRef.current;
    verifyingRef.current = true;
    setLoading(true);
    try {
      const otpValue = values?.OTP != null ? String(values.OTP) : "";
      if (!attemptId) {
        setOTPTriggered(false);
        clearSavedLoginAttempt();
        messageApi.error({ content: loginErrorMessage("OTP_EXPIRED"), duration: 4 });
        setLoading(false);
        verifyingRef.current = false;
        return;
      }
      const res = otpChannel === "email"
        ? await mobileAuthEmailFallbackVerify(attemptId, otpValue)
        : await mobileAuthVerify(attemptId, otpValue);
      if (flowSeq !== loginFlowSeqRef.current) return;
      const out = res?.data?.data ?? res?.data ?? res;
      const payload = out?.data ?? out;
      const auth = payload?.auth;
      const defaultHost = payload?.defaultHost;
      const ht = payload?.handoffToken;
      const memberships = payload?.memberships;

      const userData = storeAuthResponse(auth);
      const loginData = userData || auth?.user || auth;

      // Remember the most relevant membership without letting a follow-up lookup
      // break the successful OTP verification flow on global/non-tenant hosts.
      try {
        const membershipFromPayload = Array.isArray(memberships) && memberships.length > 0
          ? memberships.find((m) => m?.hostPrimary) || memberships[0]
          : null;
        const currentKeyFromPayload = typeof membershipFromPayload?.key === "string" ? membershipFromPayload.key.trim() : "";
        if (currentKeyFromPayload) {
          localStorage.setItem(LAST_MEMBERSHIP_KEY, currentKeyFromPayload);
        } else {
          getMemberships()
            .then((memRes) => {
              const currentKey = memRes?.data?.currentMembershipKey ?? memRes?.data?.data?.currentMembershipKey ?? null;
              if (typeof currentKey === "string" && currentKey.trim()) {
                localStorage.setItem(LAST_MEMBERSHIP_KEY, currentKey.trim());
              }
            })
            .catch(() => {});
        }
      } catch (_) {}
      if (flowSeq !== loginFlowSeqRef.current) return;
      dispatch(loginUserAction.setIsUserLoggedIn(true));
      dispatch(loginUserAction.handleUserData(loginData));
      clearSavedLoginAttempt();

      // UX: never ask the user to choose twice. If multiple memberships exist, the chosen account
      // (during "Send OTP") should already imply the tenant domain. Here we only redirect if needed.
      // If we are on a different host than defaultHost, do cross-domain handoff.
      let targetHost = typeof defaultHost === "string" && defaultHost.trim() ? defaultHost.trim() : null;
      if (!targetHost && Array.isArray(memberships)) {
        const hosts = memberships
          .map((m) => (typeof m?.host === "string" ? m.host.trim() : ""))
          .filter(Boolean);
        const unique = Array.from(new Set(hosts));
        if (unique.length === 1) targetHost = unique[0];
      }

      const postLoginPath = getPostLoginPath(loginData);

      if (!nativeAppShell && typeof window !== "undefined" && typeof targetHost === "string" && targetHost.trim()) {
        const currentHost = normalizeHostOnly(window.location.host);
        const currentIsLocalDevHost = isLocalDevelopmentHost(currentHost);
        const targetHostOnly = normalizeHostOnly(targetHost);
        const targetHostForUrl = String(targetHost)
          .trim()
          .replace(/^https?:\/\//i, "")
          .split("/")[0];
        if (!currentIsLocalDevHost && currentHost && targetHostOnly && currentHost !== targetHostOnly) {
          const currentHostMatchesMembership = Array.isArray(memberships) && memberships.some((membership) => {
            const membershipHost = normalizeHostOnly(membership?.host);
            return membershipHost && membershipHost === currentHost;
          });
          const userCollegeId = getUserCollegeId(loginData);
          const currentTenantCollegeId = Number(tenantCollegeId);
          const currentHostMatchesCollege =
            Number.isFinite(currentTenantCollegeId) &&
            currentTenantCollegeId > 0 &&
            userCollegeId != null &&
            currentTenantCollegeId === userCollegeId;

          if (!currentHostMatchesMembership && !currentHostMatchesCollege && typeof ht === "string" && ht) {
            const nextPath = typeof postLoginPath === "string" && postLoginPath ? postLoginPath : "/";
            window.location.href = `${window.location.protocol}//${targetHostForUrl}/auth/handoff?token=${encodeURIComponent(ht)}&next=${encodeURIComponent(nextPath)}`;
            return;
          }
          if (!currentHostMatchesMembership && !currentHostMatchesCollege) {
            messageApi.error({
              content: "We could not finish sign-in for the selected workspace. Please try again.",
              duration: 4,
            });
            setLoading(false);
            verifyingRef.current = false;
            return;
          }
        }
      }

      if (typeof window !== "undefined") {
        // A short wave from the robot before the page changes.
        window.dispatchEvent(new CustomEvent("ln2-robot", { detail: "happy" }));
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        window.location.replace(postLoginPath);
        return;
      }

      await router.replace({ pathname: postLoginPath });
      setLoading(false);
      verifyingRef.current = false;
      return;
    } catch (error) {
      if (flowSeq !== loginFlowSeqRef.current) return;
      const errCode = error?.response?.data?.error || error?.code || null;
      if (nativeAppShell && errCode === "INVALID_ATTEMPT") {
        setAttemptId(null);
        clearSavedLoginAttempt();
        try {
          const normalizedPhone = normalizePhoneInput(phoneNumber);
          if (!isValidPhoneNumber(normalizedPhone)) {
            setOTPTriggered(false);
            setphoneNumValid(false);
            messageApi.error({ content: "Your OTP session expired. Please enter your mobile number again.", duration: 4 });
            return;
          }
          const nextResponse = Array.isArray(accountChoices) && accountChoices.length > 0 && selectedChoiceId
            ? await mobileAuthSend(normalizedPhone, selectedChoiceId, choiceKeyRef.current)
            : await mobileAuthStart(normalizedPhone);

          if (nextResponse?.mode === "OTP_SENT") {
            setAttemptId(nextResponse?.attemptId || null);
            persistLoginAttempt(nextResponse?.attemptId || null, selectedChoiceId ?? nextResponse?.choice?.choiceId ?? null, normalizedPhone);
            setOtpChannel("mobile");
            setOtpEmailTarget("");
            setOTPTriggered(true);
            setResendCooldownUntilMs(Date.now() + 30 * 1000);
            messageApi.warning({
              content: "That OTP session was interrupted. We sent a fresh OTP. Please enter the newest code.",
              duration: 5,
            });
            return;
          }

          if (nextResponse?.mode === "CHOOSE_ACCOUNT") {
            setOTPTriggered(false);
            setAccountChoices(Array.isArray(nextResponse?.choices) ? nextResponse.choices : []);
            messageApi.warning({ content: "Your OTP session expired. Please choose your account and request OTP again.", duration: 5 });
            return;
          }
        } catch (_) {
          setOTPTriggered(false);
          messageApi.error({ content: "Your OTP session expired. Please request a new OTP.", duration: 4 });
          return;
        } finally {
          setLoading(false);
          verifyingRef.current = false;
        }
      }
      const msg = loginErrorMessage(errCode, { channel: otpChannel === "email" ? "email" : "phone" });
      // A used-up attempt (expired, too many wrong codes) can't be retried: the code screen stays, with
      // "Resend code" ready at once. OTP_ATTEMPTS_EXCEEDED used to leave a dead attempt that answered
      // "too many attempts" to every code. A suspended account or another college's address go back to the start.
      if (DEAD_ATTEMPT.has(errCode)) {
        setAttemptId(null);
        setResendCooldownUntilMs(0);
        clearSavedLoginAttempt();
        if (errCode === "ACCOUNT_SUSPENDED" || errCode === "WRONG_TENANT") setOTPTriggered(false);
      }
      messageApi.error({ content: msg, duration: 5 });
      setLoading(false);
      verifyingRef.current = false;
    }
  }


  /** recruiter V1 §10/§2: no phone step at all — one call starts the attempt and sends the code, then the existing email-OTP screen below takes over. */
  async function handleEmailLogin() {
    if (sendingRef.current) return;
    const email = loginEmail.trim().toLowerCase();
    if (!EMAIL_SHAPE.test(email)) {
      setEmailValid(false);
      return;
    }
    setEmailValid(true);
    setFieldProblem(null);
    const flowSeq = ++loginFlowSeqRef.current;
    sendingRef.current = true;
    setLoading(true);
    try {
      setDomainAccountError(null);
      let response;
      if (Array.isArray(accountChoices) && accountChoices.length > 0) {
        if (!selectedChoiceId) {
          messageApi.warning({ content: "Choose the account to sign in to.", duration: 3 });
          return;
        }
        const chosenEmail = accountChoices.find((c) => c && String(c.choiceId) === String(selectedChoiceId)) || null;
        choiceKeyRef.current = chosenEmail?.key || null;
        response = await emailLoginSend(email, selectedChoiceId, choiceKeyRef.current);
      } else {
        clearSavedLoginAttempt();
        response = await emailLoginStart(email);
      }
      if (flowSeq !== loginFlowSeqRef.current) return;
      if (response?.mode === "CHOOSE_ACCOUNT") {
        const list = Array.isArray(response?.choices) ? response.choices : [];
        setAccountChoices(list);
        let preferred = null;
        try {
          const lastKey = localStorage.getItem(LAST_MEMBERSHIP_KEY);
          const match = lastKey ? list.find((c) => c && !c.suspended && String(c.key) === String(lastKey).trim()) : null;
          if (match?.choiceId != null) preferred = match.choiceId;
        } catch (_) {}
        if (!preferred) preferred = (list.find((c) => c && !c.suspended && typeof c.host === "string" && c.host.trim()) || list.find((c) => c && !c.suspended))?.choiceId ?? null;
        setSelectedChoiceId(preferred);
        choiceKeyRef.current = list.find((c) => c && c.choiceId === preferred)?.key || null;
        return;
      }
      const nextAttemptId = response?.attemptId || null;
      const maskedEmail = response?.maskedEmail || email;
      if (response?.choice?.key) choiceKeyRef.current = response.choice.key;
      setAttemptId(nextAttemptId);
      setOtpChannel("email");
      setOtpEmailTarget(maskedEmail);
      setOTPTriggered(true);
      setResendCooldownUntilMs(Date.now() + 30 * 1000);
      persistLoginAttempt(nextAttemptId, response?.choice?.choiceId ?? null, "", "email", maskedEmail);
      setSelectedChoiceId(response?.choice?.choiceId ?? selectedChoiceId ?? null);
    } catch (error) {
      if (flowSeq !== loginFlowSeqRef.current) return;
      const errCode = error?.code || null;
      clearSavedLoginAttempt();
      if (errCode === "NOT_REGISTERED" || errCode === "NO_ACCOUNT_FOR_DOMAIN" || errCode === "INVALID_EMAIL") {
        setDomainAccountError(errCode === "NO_ACCOUNT_FOR_DOMAIN" ? "NO_ACCOUNT_FOR_DOMAIN" : null);
        setFieldProblem(loginErrorMessage(errCode, { channel: "email" }));
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ln2-robot", { detail: "oops" }));
        return;
      }
      if (errCode === "INVALID_CHOICE") {
        setAccountChoices([]);
        setSelectedChoiceId(null);
      }
      if (errCode === "LOGIN_METHOD_DISABLED" && methodOrder.includes("phone")) setEmailMode(false);
      messageApi.error({ content: loginErrorMessage(errCode, { channel: "email" }), duration: errCode === "RECRUITER_COLLEGE_ADDRESS" ? 8 : 5 });
    } finally {
      if (flowSeq === loginFlowSeqRef.current) {
        setLoading(false);
        sendingRef.current = false;
      }
    }
  }

  async function handleSendOtp() {
    if (sendingRef.current) return;
    const flowSeq = ++loginFlowSeqRef.current;
    sendingRef.current = true;
    setLoading(true);
    setphoneNumValid(true);
    setFieldProblem(null);
    try {
      setDomainAccountError(null);
      const normalizedPhone = normalizePhoneInput(phoneNumber);
      if (!isValidPhoneNumber(normalizedPhone)) {
        if (flowSeq !== loginFlowSeqRef.current) return;
        setphoneNumValid(false); // shown under the field; no toast on top of it
        return;
      }
      setPhoneNumber(normalizedPhone);
      if (flowSeq !== loginFlowSeqRef.current) return;

      if (Array.isArray(accountChoices) && accountChoices.length > 0) {
        if (!selectedChoiceId) {
          messageApi.warning({ content: "Choose the account to sign in to.", duration: 3 });
          return;
        }
        const chosen = accountChoices.find((c) => c && String(c.choiceId) === String(selectedChoiceId)) || null;
        if (chosen?.suspended) {
          messageApi.error({ content: loginErrorMessage("ACCOUNT_SUSPENDED"), duration: 5 });
          return;
        }
        choiceKeyRef.current = chosen?.key || null;
        const sent = await mobileAuthSend(normalizedPhone, selectedChoiceId, choiceKeyRef.current);
        if (flowSeq !== loginFlowSeqRef.current) return;
        setAttemptId(sent?.attemptId || null);
        setOtpChannel("mobile");
        setOtpEmailTarget("");
        setOTPTriggered(true);
        setResendCooldownUntilMs(Date.now() + 30 * 1000);
        persistLoginAttempt(sent?.attemptId || null, selectedChoiceId, normalizedPhone);
        return;
      }

      clearSavedLoginAttempt();
      setAttemptId(null);
      setOTPTriggered(false);
      const started = await mobileAuthStart(normalizedPhone);
      if (flowSeq !== loginFlowSeqRef.current) return;
      if (started?.mode === "CHOOSE_ACCOUNT") {
        const list = Array.isArray(started?.choices) ? started.choices : [];
        if (list.length === 0) {
          setFieldProblem(loginErrorMessage("NOT_REGISTERED", { channel: "phone" }));
          return;
        }
        setAccountChoices(list);
        // Auto-select last used membership (best default), otherwise choose first with a domain.
        let preferredChoiceId = null;
        // A recruiter (industry recruiter) signing in on the global host starts in their Global view
        // (all their colleges); the backend only offers that choice on the global host.
        const recruiterGlobalChoice = list.find((c) => c && isRecruiterType(c.userType) && c.collegeId == null);
        if (recruiterGlobalChoice?.choiceId != null) preferredChoiceId = recruiterGlobalChoice.choiceId;
        if (!preferredChoiceId) try {
          const lastKey = localStorage.getItem(LAST_MEMBERSHIP_KEY);
          if (lastKey && String(lastKey).trim()) {
            const match = list.find((c) => c && !c.suspended && String(c.key) === String(lastKey).trim());
            if (match?.choiceId != null) preferredChoiceId = match.choiceId;
          }
        } catch (_) {}
        if (!preferredChoiceId) {
          // Prefer an account with its college's own address; never a suspended one.
          preferredChoiceId = (list.find((c) => c && !c.suspended && typeof c.host === "string" && c.host.trim()) || list.find((c) => c && !c.suspended))?.choiceId ?? null;
        }
        setSelectedChoiceId(preferredChoiceId);
        choiceKeyRef.current = list.find((c) => c && c.choiceId === preferredChoiceId)?.key || null;
        return; // the list itself says the number is registered in more than one place
      }

      if (started?.mode === "OTP_SENT") {
        setAttemptId(started?.attemptId || null);
        setOtpChannel("mobile");
        setOtpEmailTarget("");
        setOTPTriggered(true);
        setResendCooldownUntilMs(Date.now() + 30 * 1000);
        setSelectedChoiceId(started?.choice?.choiceId ?? null);
        choiceKeyRef.current = started?.choice?.key || null;
        persistLoginAttempt(started?.attemptId || null, started?.choice?.choiceId ?? null, normalizedPhone);
        return;
      }

      messageApi.error({ content: loginErrorMessage(null), duration: 4 });
    } catch (e) {
      if (flowSeq !== loginFlowSeqRef.current) return;
      const errCode = e?.code || null;
      clearSavedLoginAttempt();
      if (errCode === "NOT_REGISTERED" || errCode === "NO_ACCOUNT_FOR_DOMAIN") {
        // About the number itself: said under the field (one place), and the robot looks sorry.
        setDomainAccountError(errCode === "NO_ACCOUNT_FOR_DOMAIN" ? "NO_ACCOUNT_FOR_DOMAIN" : null);
        setFieldProblem(loginErrorMessage(errCode, { channel: "phone" }));
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ln2-robot", { detail: "oops" }));
        return;
      }
      if (errCode === "INVALID_CHOICE") {
        // The number's accounts changed since the list was shown: Continue looks them up again.
        setAccountChoices([]);
        setSelectedChoiceId(null);
      }
      if (errCode === "LOGIN_METHOD_DISABLED" && methodOrder.includes("email")) setEmailMode(true);
      messageApi.error({ content: loginErrorMessage(errCode, { channel: "phone" }), duration: 5 });
    } finally {
      if (flowSeq === loginFlowSeqRef.current) {
        setLoading(false);
        sendingRef.current = false;
      }
    }
  }

  async function handleResendOtp() {
    if (loading) return;
    if (resendCooldownSeconds > 0) return;
    const flowSeq = ++loginFlowSeqRef.current;
    setLoading(true);
    try {
      if (otpChannel === "email" && !attemptId && !normalizePhoneInput(phoneNumber)) {
        // An email-first sign-in whose attempt is used up: start again from the email address.
        setOTPTriggered(false);
        setEmailMode(true);
        messageApi.info({ content: "Press Continue to get a new code.", duration: 4 });
        return;
      }
      if (otpChannel === "email" && attemptId) {
        const response = await mobileAuthEmailFallbackSend(attemptId);
        if (flowSeq !== loginFlowSeqRef.current) return;
        const maskedEmail = response?.maskedEmail || response?.data?.maskedEmail || response?.data?.data?.maskedEmail || otpEmailTarget || "";
        setOtpChannel("email");
        setOtpEmailTarget(maskedEmail);
        persistLoginAttempt(attemptId, selectedChoiceId, normalizePhoneInput(phoneNumber), "email", maskedEmail);
        setResendCooldownUntilMs(Date.now() + 30 * 1000);
        messageApi.success({
          content: maskedEmail ? `A new code was sent to ${maskedEmail}.` : "A new code was sent to your email.",
          duration: 2,
        });
        return;
      }

      const normalizedPhone = normalizePhoneInput(phoneNumber);
      let nextResponse = null;
      // The chosen account is remembered across a refresh, the list is not: resend to that account. Starting over
      // sent someone with several accounts back to the list after a refresh.
      if (selectedChoiceId) {
        nextResponse = await mobileAuthSend(normalizedPhone, selectedChoiceId, choiceKeyRef.current);
      } else {
        nextResponse = await mobileAuthStart(normalizedPhone);
      }
      if (flowSeq !== loginFlowSeqRef.current) return;

      if (nextResponse?.mode === "CHOOSE_ACCOUNT") {
        setOTPTriggered(false);
        setAttemptId(null);
        clearSavedLoginAttempt();
        setAccountChoices(Array.isArray(nextResponse?.choices) ? nextResponse.choices : []);
        messageApi.info({ content: "Choose the account to sign in to.", duration: 3 });
        return;
      }

      if (nextResponse?.mode === "OTP_SENT") {
        const nextAttemptId = nextResponse?.attemptId || null;
        setAttemptId(nextAttemptId);
        setOtpChannel("mobile");
        setOtpEmailTarget("");
        setOTPTriggered(true);
        setResendCooldownUntilMs(Date.now() + 30 * 1000);
        persistLoginAttempt(nextAttemptId, selectedChoiceId ?? nextResponse?.choice?.choiceId ?? null, normalizedPhone);
        messageApi.success({ content: "A new code is on its way.", duration: 2 });
        return;
      }

      messageApi.error({ content: loginErrorMessage(null), duration: 4 });
    } catch (error) {
      if (flowSeq !== loginFlowSeqRef.current) return;
      const errCode = error?.code || null;
      if (errCode === "INVALID_CHOICE") {
        backToLogin();
      } else if (errCode === "OTP_EXPIRED" || errCode === "INVALID_ATTEMPT") {
        setAttemptId(null);
        setOTPTriggered(false);
        clearSavedLoginAttempt();
      }
      messageApi.error({ content: loginErrorMessage(errCode, { channel: otpChannel === "email" ? "email" : "phone" }), duration: 5 });
    } finally {
      if (flowSeq === loginFlowSeqRef.current) {
        setLoading(false);
      }
    }
  }

  async function handleUseEmailInstead() {
    if (loading || !attemptId) return;
    const flowSeq = ++loginFlowSeqRef.current;
    setLoading(true);
    try {
      const response = await mobileAuthEmailFallbackSend(attemptId);
      if (flowSeq !== loginFlowSeqRef.current) return;
      const maskedEmail = response?.maskedEmail || response?.data?.maskedEmail || response?.data?.data?.maskedEmail || "";
      setOtpChannel("email");
      setOtpEmailTarget(maskedEmail);
      persistLoginAttempt(attemptId, selectedChoiceId, normalizePhoneInput(phoneNumber), "email", maskedEmail);
      setResendCooldownUntilMs(Date.now() + 30 * 1000);
    } catch (error) {
      if (flowSeq !== loginFlowSeqRef.current) return;
      const errCode = error?.code || null;
      if (errCode === "OTP_EXPIRED" || errCode === "INVALID_ATTEMPT") {
        setAttemptId(null);
        setOTPTriggered(false);
        clearSavedLoginAttempt();
      }
      messageApi.error({ content: loginErrorMessage(errCode, { channel: "email" }), duration: 5 });
    } finally {
      if (flowSeq === loginFlowSeqRef.current) {
        setLoading(false);
      }
    }
  }
};

export default LoginPage;



