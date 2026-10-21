import { getApplyCheck } from "@/api/Services/TpoHubService";
import DriveEligibilityPanel from "./DriveEligibilityPanel";
import DriveJourney from "./student/DriveJourney";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import { safeHref } from "@/utils/safeHref";
import { getSafeInternalReturnPath } from "@/utils/navigationContext";
import { Button, message, Modal, Skeleton, Tooltip } from "antd";
import Link from "next/link";
import {
  CheckCircleOutlined, EnvironmentOutlined,
  FileTextOutlined, InfoCircleOutlined,
  ClockCircleOutlined, CalendarOutlined, LeftOutlined, HeartOutlined, HeartFilled,
  ExclamationCircleOutlined, ArrowRightOutlined, SafetyCertificateOutlined,
  RightOutlined, EyeOutlined, FireOutlined, StopOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import moment from "moment";
import { applyToJob, checkIfApplied, withdrawApplication, saveJob, unsaveJob, getSavedJobIds, getLearnerApplications, getApplicationById } from "@/api/Services/jobService";
import { getStudentDetails } from "@/api/Services/UserServices";
import Api from "@/api/ApiMethod";
import { validateJobId } from "@/utils/learnerValidation";
import { getJobTypeTag, getApplicationStatusLabel, parseJobDate, formatPostedAgo } from "@/utils/jobTagUtils";
import { findPlacementJourneyByApplicationId } from "@/utils/placementApplicationIdentity";
import {
  isValidResumeUrl,
} from "@/utils/resumeUploadUtils";
import { classifyApplicationLookup } from "@/utils/placementsStudentActionPolicy";
import RichTextDisplay from "@/components/Global/RichTextEditor/RichTextDisplay";
import PlacementsCompanyAvatar from "./PlacementsCompanyAvatar";

const isAbortError = (e) => e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError';

function isApplicationClosed(applicationDeadline) {
  const m = parseJobDate(applicationDeadline);
  return m ? m.isBefore(moment(), "minute") : false;
}

/**
 * Deadline urgency, escalating as the date nears. Tone drives colour AND an icon +
 * wording change, so urgency is never carried by colour alone.
 */
function deadlineState(deadlineMoment, closed) {
  if (closed) return { tone: "closed", text: "Applications closed", sub: null };
  if (!deadlineMoment) return null;
  if (deadlineMoment.isBefore(moment(), "minute")) {
    return { tone: "closed", text: "Closed", sub: deadlineMoment.format("D MMM YYYY") };
  }
  const days = deadlineMoment.diff(moment().startOf("day"), "days");
  const dateText = deadlineMoment.format("D MMM YYYY");
  if (days <= 0) return { tone: "urgent", text: "Closes today", sub: dateText };
  if (days === 1) return { tone: "urgent", text: "1 day left", sub: dateText };
  if (days <= 3) return { tone: "urgent", text: `${days} days left`, sub: dateText };
  if (days <= 7) return { tone: "soon", text: `${days} days left`, sub: dateText };
  if (days <= 14) return { tone: "soon", text: `${days} days left`, sub: dateText };
  return { tone: "calm", text: dateText, sub: `${days} days left` };
}

/** Best-effort display name for a stored resume — the storage key keeps the original name. */
function resumeFileName(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const path = new URL(url).pathname;
    const base = decodeURIComponent(path.split("/").filter(Boolean).pop() || "");
    if (!base) return null;
    // Uploads are stored under a random id ("43aae73f-…-70af702ebf99.pdf"): that is no name to show a student.
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(base)) return "Your resume";
    return base.length > 48 ? `${base.slice(0, 45)}…` : base;
  } catch {
    return null;
  }
}

function formatBytes(bytes) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfUrl(url) {
  if (!url) return false;
  try {
    return /\.pdf$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** Split a requirement value into chips when it reads like a list. */
function toChipList(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parts = raw
    .split(/\s*[,;|/]\s*|\s+·\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  if (parts.some((p) => p.length > 34)) return null;
  return parts;
}

/** Persistent, control-anchored error. Never auto-dismisses. */
function InlineError({ title, detail, onDismiss, onRetry, retryLabel = "Retry" }) {
  if (!detail && !title) return null;
  return (
    <div className="ljd-inline-error" role="alert">
      <span className="ljd-inline-error__icon" aria-hidden="true">
        <ExclamationCircleOutlined />
      </span>
      <div className="ljd-inline-error__body">
        {title && <strong className="ljd-inline-error__title">{title}</strong>}
        {detail && <span className="ljd-inline-error__detail">{detail}</span>}
        <span className="ljd-inline-error__actions">
          {onRetry && (
            <button type="button" className="ljd-textlink" onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          {onDismiss && (
            <button type="button" className="ljd-textlink ljd-textlink--muted" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Reusable Job detail content.
 * @param {Object} props
 * @param {string} [props.basePath="/learn"] - Base path for links (e.g. /learn or /learn/my-placements)
 */
export default function JobDetailContent({ basePath = "/learn" }) {
  const router = useRouter();
  const { isReady } = router;
  const { jobId } = router.query;
  const loginUser = useSelector((state) => state.loginUser);
  const [job, setJob] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  // #7: a failed /applied lookup must not be treated as "not applied" — that risks showing an
  // active Apply button (and, since handleConfirmApply's own fresh check hits the same endpoint,
  // a real duplicate-application attempt) to a learner who may have already applied. This tracks
  // "we don't know yet", independent of hasApplied, and blocks Apply until a lookup succeeds.
  const [appliedStatusUnknown, setAppliedStatusUnknown] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const withdrawInProgressRef = useRef(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [uploadedResumeMeta, setUploadedResumeMeta] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState(null);
  const [profileResumeUrl, setProfileResumeUrl] = useState(null);
  const [profileResumeLoading, setProfileResumeLoading] = useState(false);
  const [resumeChoice, setResumeChoice] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [saveLoading, setSaveLoading] = useState(false);
  const [nextInterviewForJob, setNextInterviewForJob] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [privacyNoticeExpanded, setPrivacyNoticeExpanded] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [withdrawError, setWithdrawError] = useState(null);
  const [recentlyWithdrawn, setRecentlyWithdrawn] = useState(false);
  const [resumeError, setResumeError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const applyInProgressRef = useRef(false);
  const fetchAbortRef = useRef(null);

  // Every real caller passes basePath="/learn/my-placements" — see the equivalent comment in
  // ApplicationsContent.jsx.
  const normalizedBase = basePath.replace(/\/$/, "");
  const jobsPath = `${normalizedBase}/jobs`;
  const placementsPath = normalizedBase;
  const applicationsPath = `${normalizedBase}/applications`;
  const interviewsPath = `${normalizedBase}/schedule`;

  const validatedJobId = useMemo(() => validateJobId(jobId), [jobId]);
  const isSaved = job?.id != null && savedJobIds.has(job.id);

  useEffect(() => {
    setJob(null);
    setEligibility(null);
    setHasApplied(false);
    setAppliedStatusUnknown(true);
    setApplicationStatus(null);
    setApplicationId(null);
    setReceipt(null);
    setResumeUrl(null);
    setUploadedResumeMeta(null);
    setResumeChoice(null);
    setProfileResumeUrl(null);
    setNextInterviewForJob(null);
    setLoadError(false);
    setUnavailableReason(null);
    setApplying(false);
    setWithdrawing(false);
    setWithdrawConfirmOpen(false);
    withdrawInProgressRef.current = false;
    setConfirmOpen(false);
    setJustApplied(false);
    setApplyError(null);
    setWithdrawError(null);
    setRecentlyWithdrawn(false);
    setResumeError(null);
    setPreviewUrl(null);
    applyInProgressRef.current = false;
  }, [jobId]);

  const fetchJobDetails = useCallback(async (numericJobId) => {
    if (numericJobId == null || !loginUser?.id) return;
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const { signal } = controller;
    setLoading(true);
    setLoadError(false);
    setUnavailableReason(null);
    setAppliedStatusUnknown(true);
    try {
      const response = await Api.get(`/api/v1/jobs/${numericJobId}/visibility/${loginUser.id}`, { signal });
      if (response?.data?.status === "success") {
        const data = response.data.data || {};
        setJob(data.job ?? null);
        setEligibility({
          isEligible: data.isVisible,
          reason: data.visibilityReason,
        });
        // The same gate the server applies (registration, the drive's rules, held offers): said on the button instead of the
        // student finding out after clicking Apply. The older check here covered only the drive's rules (night audit 13 Oct 2026).
        if (data.isVisible && data.job) {
          getApplyCheck(numericJobId).then((r) => {
            const gate = r?.data;
            if (signal.aborted || !gate || gate.canApply !== false) return;
            setEligibility({ isEligible: false, reason: gate.reason || "You can't apply to this drive.", action: gate.action || null });
          }).catch(() => {
            // BE-0012: if the drive's rules can't be checked, Apply waits (fails closed) rather than inviting an
            // application the student may not be allowed to make.
            if (signal.aborted) return;
            setEligibility({ isEligible: false, reason: "We couldn't check this drive's rules just now. Refresh the page to try again." });
          });
        }
        if (!data.job) {
          setUnavailableReason(!data.visibilityReason || /not found or not active/i.test(data.visibilityReason) ? "This drive is no longer open." : data.visibilityReason);
          setHasApplied(false);
          setApplicationStatus(null);
          return;
        }
        try {
          const appliedRes = await Api.get(`/api/v1/jobs/${numericJobId}/applied/${loginUser.id}`, { signal });
          const lookup = classifyApplicationLookup(appliedRes);
          if (lookup === "applied") {
            setHasApplied(true);
            setApplicationStatus(appliedRes.data.data.applicationStatus ?? appliedRes.data.data.status ?? null);
            setApplicationId(appliedRes.data.data.applicationId ?? null);
            setAppliedStatusUnknown(false);
          } else if (lookup === "not-applied") {
            setHasApplied(false);
            setApplicationStatus(null);
            setApplicationId(null);
            setAppliedStatusUnknown(false);
          } else {
            setAppliedStatusUnknown(true);
          }
        } catch (appliedErr) {
          if (isAbortError(appliedErr)) return;
          setAppliedStatusUnknown(true);
        }
      } else {
        // No toast: the error state below is persistent and carries a retry.
        setLoadError(true);
      }
    } catch (err) {
      if (isAbortError(err)) return;
      const raw = err?.response?.data?.message;
      // The server's "Job not found or not active" read like a broken page; a cancelled drive is explained above it.
      const errorMessage = !raw || /not found or not active/i.test(raw) ? "This drive is no longer open." : raw;
      setUnavailableReason(errorMessage);
      setLoadError(true);
    } finally {
      if (fetchAbortRef.current === controller) fetchAbortRef.current = null;
      setLoading(false);
    }
  }, [loginUser?.id]);

  useEffect(() => {
    if (!loginUser?.id) {
      message.warning("Please log in to view this job", 2);
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      setLoading(false);
      return;
    }
    if (!validatedJobId.valid) {
      if (jobId != null && jobId !== "") setLoadError(true);
      setLoading(false);
      return;
    }
    fetchJobDetails(validatedJobId.value);
    return () => {
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
        fetchAbortRef.current = null;
      }
    };
  }, [loginUser?.id, jobId, validatedJobId.valid, validatedJobId.value, router, fetchJobDetails]);

  // Durable receipt for an application submitted in an earlier session: the
  // /applied endpoint only carries the id + status, so the detail record supplies
  // the submitted timestamp and the resume that was actually sent.
  useEffect(() => {
    if (!hasApplied || applicationId == null || receipt) return;
    let cancelled = false;
    getApplicationById(applicationId)
      .then((res) => {
        if (cancelled) return;
        const app = res?.data?.data ?? res?.data;
        if (!app) return;
        setReceipt({
          id: app.id ?? applicationId,
          appliedAt: app.appliedAt ?? app.createdAt ?? null,
          resumeUrl: app.resumeUrl ?? null,
        });
      })
      .catch(() => {
        // Non-fatal: fall back to the reference number we already have.
        if (!cancelled) setReceipt({ id: applicationId, appliedAt: null, resumeUrl: null });
      });
    return () => { cancelled = true; };
  }, [hasApplied, applicationId, receipt]);

  useEffect(() => {
    if (hasApplied || !job || !loginUser?.id) return;
    let cancelled = false;
    setProfileResumeLoading(true);
    getStudentDetails({ learnerId: loginUser.id })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data ?? res?.data;
        const url = data?.resumeUrl ?? data?.resume_url ?? null;
        const safe = url && typeof url === "string" && isValidResumeUrl(url) ? url.trim() : null;
        setProfileResumeUrl(safe);
      })
      .catch(() => { if (!cancelled) setProfileResumeUrl(null); })
      .finally(() => { if (!cancelled) setProfileResumeLoading(false); });
    return () => { cancelled = true; };
  }, [hasApplied, job, loginUser?.id]);

  // The application carries the profile resume when there is one, and none otherwise.
  useEffect(() => {
    setResumeChoice(profileResumeUrl ? "profile" : "none");
  }, [profileResumeUrl]);

  useEffect(() => {
    if (!hasApplied || !loginUser?.id || !jobId) return;
    if (!hasApplied || !job?.id || !loginUser?.id) {
      if (!hasApplied) setNextInterviewForJob(null);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    getLearnerApplications(loginUser.id, { signal: controller.signal })
      .then((res) => {
        if (cancelled) return;
        const raw = Array.isArray(res?.data?.data) ? res.data.data : [];
        // The application lookup above already gave us the authoritative applicationId.
        // Match this journey by that identity, never merely by jobId; otherwise a stale/legacy
        // duplicate journey for the same job can surface another application's interview.
        const item = findPlacementJourneyByApplicationId(raw, applicationId);
        const next = item?.nextInterview ?? item?.application?.nextInterview ?? null;
        setNextInterviewForJob(next || null);
      })
      .catch((e) => {
        if (cancelled || e?.code === 'ERR_CANCELED') return;
        setNextInterviewForJob(null);
      });
    return () => { cancelled = true; controller.abort(); };
  }, [hasApplied, job?.id, loginUser?.id, applicationId]);

  useEffect(() => {
    if (!loginUser?.id) return;
    let cancelled = false;
    getSavedJobIds(loginUser.id)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data ?? res?.data;
        const ids = Array.isArray(data) ? data : (data?.jobIds ?? []);
        setSavedJobIds(new Set(ids.map((id) => Number(id)).filter(Number.isFinite)));
      })
      .catch(() => { if (!cancelled) setSavedJobIds(new Set()); });
    return () => { cancelled = true; };
  }, [loginUser?.id]);

  // Saving is low-stakes and instantly reversible — a toast is the right weight here.
  const handleToggleSave = async (e) => {
    e?.stopPropagation?.();
    if (!job?.id || !loginUser?.id || saveLoading) return;
    setSaveLoading(true);
    try {
      if (isSaved) {
        await unsaveJob(job.id, loginUser.id);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
        message.success("Removed from saved jobs");
      } else {
        await saveJob(job.id, loginUser.id);
        setSavedJobIds((prev) => new Set([...prev, job.id]));
        message.success("Saved for later");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update saved job");
    } finally {
      setSaveLoading(false);
    }
  };

  const resumeUrlToSend = useMemo(() => {
    if (resumeChoice === "none") return null;
    if (resumeChoice === "new") return resumeUrl;
    if (resumeChoice === "profile") return profileResumeUrl;
    if (resumeUrl) return resumeUrl;
    return profileResumeUrl;
  }, [resumeChoice, resumeUrl, profileResumeUrl]);

  const handleWithdraw = () => {
    if (!validatedJobId.valid || !validatedJobId.value || withdrawing || withdrawInProgressRef.current) return;
    setWithdrawError(null);
    setWithdrawConfirmOpen(true);
  };

  const handleWithdrawCancel = () => {
    if (withdrawing || withdrawInProgressRef.current) return;
    setWithdrawConfirmOpen(false);
  };

  const handleConfirmWithdraw = async () => {
    if (!validatedJobId.valid || !validatedJobId.value || withdrawing || withdrawInProgressRef.current) return;
    // BE-0011: withdrawal is by application, not by job. The job id used to be sent, so the server looked up the wrong row.
    if (applicationId == null) {
      setWithdrawError("We couldn't find your application for this drive. Refresh the page and try again.");
      return;
    }
    withdrawInProgressRef.current = true;
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      const response = await withdrawApplication(applicationId, loginUser.id);
      if (response?.data?.status === "success") {
        message.success("Application withdrawn successfully");
        setRecentlyWithdrawn(true);
        setHasApplied(false);
        setApplicationStatus(null);
        setJustApplied(false);
        setReceipt(null);
        setApplicationId(null);
        setNextInterviewForJob(null);
        setWithdrawConfirmOpen(false);
      } else {
        setWithdrawError(response?.data?.message || "The withdrawal did not go through. Your application is still active.");
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        setWithdrawError(error.response.data?.message || "This application cannot be withdrawn from its current stage.");
      } else {
        setWithdrawError(error?.response?.data?.message || "We couldn't confirm whether the withdrawal succeeded. Check your applications before trying again.");
      }
    } finally {
      withdrawInProgressRef.current = false;
      setWithdrawing(false);
    }
  };

  const handleApply = () => {
    if (applyInProgressRef.current) return;
    applyInProgressRef.current = true;
    setApplyError(null);
    if (uploadingResume || appliedStatusUnknown) {
      setApplyError(uploadingResume
        ? "Wait for your resume to finish uploading before applying."
        : "We couldn't check your existing application. Check the status before applying.");
      applyInProgressRef.current = false;
      return;
    }
    if (!eligibility?.isEligible) {
      setApplyError("You are not eligible for this job, so the application can't be submitted.");
      applyInProgressRef.current = false;
      return;
    }
    if (job && isApplicationClosed(job.applicationDeadline)) {
      setApplyError("Applications for this role are closed.");
      applyInProgressRef.current = false;
      return;
    }
    if (!validatedJobId.valid || !validatedJobId.value) {
      setApplyError("This job link isn't valid. Open the job from the jobs list and try again.");
      applyInProgressRef.current = false;
      return;
    }
    setPrivacyNoticeExpanded(false);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    if (applying) return;
    setConfirmOpen(false);
    applyInProgressRef.current = false;
  };

  const handleConfirmApply = async () => {
    if (uploadingResume || appliedStatusUnknown) {
      setApplyError("Wait for the resume upload and verify your application status first.");
      return;
    }
    // The deadline can pass after the confirmation dialog opens. Re-check immediately before
    // the write so a stale modal cannot send an application the client already knows is invalid.
    if (job && isApplicationClosed(job.applicationDeadline)) {
      setApplyError("Applications for this role are closed.");
      setConfirmOpen(false);
      applyInProgressRef.current = false;
      return;
    }
    if (!validatedJobId.valid || !validatedJobId.value) {
      setConfirmOpen(false);
      applyInProgressRef.current = false;
      return;
    }
    const id = validatedJobId.value;
    let applicationRequestStarted = false;
    setApplying(true);
    setApplyError(null);
    try {
      const freshCheck = await checkIfApplied(id, loginUser.id);
      if (classifyApplicationLookup(freshCheck) === "unknown") {
        setAppliedStatusUnknown(true);
        setConfirmOpen(false);
        setApplyError("We couldn't verify whether you already applied. Check status before submitting.");
        return;
      }
      if (classifyApplicationLookup(freshCheck) === "applied") {
        setHasApplied(true);
        setApplicationStatus(freshCheck?.data?.data?.applicationStatus ?? null);
        setApplicationId(freshCheck?.data?.data?.applicationId ?? null);
        setConfirmOpen(false);
        applyInProgressRef.current = false;
        setApplying(false);
        return;
      }
      if (resumeChoice === "profile" && !profileResumeUrl) {
        setApplyError("No profile resume was found. Upload a resume, or choose to apply without one.");
        setApplying(false);
        applyInProgressRef.current = false;
        return;
      }
      if (resumeUrlToSend && !/^https?:\/\/.+/.test(String(resumeUrlToSend).trim())) {
        setApplyError("The attached resume address isn't a valid http or https link. Upload the file again.");
        setApplying(false);
        applyInProgressRef.current = false;
        return;
      }
      applicationRequestStarted = true;
      const response = await applyToJob(id, loginUser.id, resumeUrlToSend);
      if (response?.data?.status === "success") {
        const app = response?.data?.data ?? null;
        setReceipt({
          id: app?.id ?? null,
          appliedAt: app?.appliedAt ?? app?.createdAt ?? new Date().toISOString(),
          resumeUrl: app?.resumeUrl ?? resumeUrlToSend ?? null,
          resumeName: resumeChoice === "new"
            ? (uploadedResumeMeta?.name ?? resumeFileName(resumeUrlToSend))
            : resumeFileName(resumeUrlToSend),
        });
        setApplicationId(app?.id ?? null);
        setApplicationStatus(app?.applicationStatus ?? "APPLIED");
        setConfirmOpen(false);
        setHasApplied(true);
        setAppliedStatusUnknown(false);
        setJustApplied(true);
        setRecentlyWithdrawn(false);
        setResumeUrl(null);
        setUploadedResumeMeta(null);
        setResumeChoice(null);
      } else {
        // A non-success response may follow a committed write; reconcile below.
        throw new Error(response?.data?.message || "The application response was not successful.");
      }
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message;
      if (applicationRequestStarted) {
        // The response may have been lost after the server committed the application.
        try {
          const reconciled = await checkIfApplied(id, loginUser.id);
          const outcome = classifyApplicationLookup(reconciled);
          if (outcome === "applied") {
            setHasApplied(true);
            setApplicationStatus(reconciled.data.data.applicationStatus ?? reconciled.data.data.status ?? null);
            setApplicationId(reconciled.data.data.applicationId ?? null);
            setAppliedStatusUnknown(false);
            setConfirmOpen(false);
          } else if (outcome === "not-applied") {
            setApplyError(msg || error?.message || "The application was not accepted. Please review and try again.");
          } else {
            setAppliedStatusUnknown(true);
            setConfirmOpen(false);
            setApplyError("We couldn't verify whether your application was submitted. Check its status before trying again.");
          }
        } catch {
          setAppliedStatusUnknown(true);
          setConfirmOpen(false);
          setApplyError("We couldn't verify whether your application was submitted. Check its status before trying again.");
        }
      } else {
        setAppliedStatusUnknown(true);
        setConfirmOpen(false);
        setApplyError(msg || "We couldn't check your existing application. Check status before submitting.");
      }
    } finally {
      setApplying(false);
      applyInProgressRef.current = false;
    }
  };

  /** Parsed requirement rows, or null when nothing to show. */
  const requirements = useMemo(() => {
    const prefs = job?.candidatePreferences || job?.eligibilityRules;
    if (!prefs || (typeof prefs === "object" && Object.keys(prefs).length === 0)) return null;
    try {
      const rules = typeof prefs === "string" ? JSON.parse(prefs) : prefs;
      const degree = rules.preferredDegree ?? rules.degree;
      const specialization = rules.preferredSpecialization ?? rules.specialization;
      const graduationYear = rules.preferredGraduationYear ?? rules.graduationYear;
      const gpa = rules.preferredGpa ?? rules.minGpa;
      const city = rules.preferredCity ?? rules.cityPreference;
      const customRulesList = Array.isArray(rules.customRules) ? rules.customRules : [];

      const rows = [];
      if (degree) rows.push({ label: "Preferred degree", value: degree });
      if (specialization) rows.push({ label: "Preferred specialization", value: specialization });
      if (graduationYear) rows.push({ label: "Graduation year", value: graduationYear });
      if (gpa != null && gpa !== "") rows.push({ label: "Preferred GPA", value: gpa });
      if (city) rows.push({ label: "Preferred city", value: city });
      customRulesList.forEach((r, i) => {
        const label = (r?.label || "").trim();
        const value = (r?.value || "").trim();
        if (!label && !value) return;
        rows.push({ key: `custom-${i}`, label: label || "Additional requirement", value: value || "—" });
      });

      if (rows.length === 0) return null;
      return rows;
    } catch {
      return null;
    }
  }, [job?.candidatePreferences, job?.eligibilityRules]);

  /**
   * Student V1 §"Drives list/detail": pay next to CTC. Each package's own CTC, fixed/variable split, joining bonus and
   * stipend. (The bond was removed on 8 Oct 2026; older drives may still store it and it is not shown.)
   */
  const payDetails = useMemo(() => {
    const raw = job?.roleOptionsJson;
    if (!raw) return null;
    try {
      const options = Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : null);
      if (!Array.isArray(options) || options.length === 0) return null;
      return options
        .map((o, i) => {
          if (!o || typeof o !== "object") return null;
          return {
            key: o.name || `option-${i}`,
            name: o.name || (options.length > 1 ? `Package ${i + 1}` : null),
            ctcLpa: o.ctcLpa,
            fixedLpa: o.fixedLpa,
            variableLpa: o.variableLpa,
            joiningBonusLpa: o.joiningBonusLpa,
            stipendPerMonth: o.stipendPerMonth,
          };
        })
        .filter(Boolean);
    } catch {
      return null;
    }
  }, [job?.roleOptionsJson]);

  /** Key dates from the job payload, newest-first-safe and de-duplicated. */
  const keyDates = useMemo(() => {
    const raw = job?.importantDates || job?.important_dates;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        const label = (item?.label || "").trim();
        const m = parseJobDate(item?.date);
        if (!label || !m) return null;
        return { label, moment: m };
      })
      .filter(Boolean)
      .sort((a, b) => a.moment.valueOf() - b.moment.valueOf());
  }, [job?.importantDates, job?.important_dates]);

  // Labelled navigation must land where the label says, whatever the history stack
  // holds — deep links and notifications routinely have no jobs page behind them.
  const goToJobs = () =>
    router.push(
      getSafeInternalReturnPath(router.query?.returnTo, {
        fallback: jobsPath,
        allowedPrefixes: [jobsPath],
      })
    );

  const pageTitle = job?.jobTitle
    ? `${job.jobTitle}${job.companyName ? ` at ${job.companyName}` : ""} – Drives`
    : "Drive – Drives";
  const pageDescription = job
    ? [
      job.jobTitle && job.companyName ? `${job.jobTitle} at ${job.companyName}.` : job.jobTitle,
      job.location ? `Location: ${job.location}.` : null,
      job.jobType ? `${job.jobType}.` : null,
    ].filter(Boolean).join(" ")
    : "View this job opening and apply through your placements dashboard.";

  const head = (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {job?.companyLogo ? <meta property="og:image" content={job.companyLogo} /> : null}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
    </Head>
  );

  // One consistent navigation block, used by every state on this page.
  const renderNav = (currentLabel) => (
    <nav className="ljd-backbar" aria-label="Breadcrumb">
      <button type="button" className="ljd-back" onClick={goToJobs}>
        <LeftOutlined aria-hidden="true" />
        <span className="ljd-back__label">Back to drives</span>
      </button>
      <ol className="ljd-crumbs">
        <li>
          <button type="button" className="ljd-crumb" onClick={() => router.push(placementsPath)}>Placements</button>
          <RightOutlined className="ljd-crumb__sep" aria-hidden="true" />
        </li>
        <li>
          <button type="button" className="ljd-crumb" onClick={goToJobs}>Drives</button>
          <RightOutlined className="ljd-crumb__sep" aria-hidden="true" />
        </li>
        <li>
          <span className="ljd-crumb ljd-crumb--current" aria-current="page">{currentLabel}</span>
        </li>
      </ol>
    </nav>
  );

  const renderShell = (children, currentLabel = "Drive", extraClass = "") => (
    <div className={`learn-job-detail-page ljd ${extraClass}`.trim()}>
      {head}
      {renderNav(currentLabel)}
      {children}
    </div>
  );

  // A single skeleton, mirroring the loaded layout block-for-block (hero + fact strip,
  // eligibility, description, requirements, and the apply rail).
  const pageSkeleton = (
    <main className="ljd-layout" aria-busy="true" aria-live="polite">
      <p className="ljd-sr-only">Loading job details</p>
      <div className="ljd-main">
        <section className="ljd-card ljd-hero ljd-hero--skeleton">
          <div className="ljd-hero__top">
            <Skeleton.Avatar active shape="square" size={56} />
            <div className="ljd-hero__headings">
              <Skeleton active title={{ width: "58%" }} paragraph={{ rows: 1, width: ["44%"] }} />
            </div>
          </div>
          <div className="ljd-facts ljd-facts--skeleton" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div className="ljd-facts__item" key={`fact-sk-${i}`}>
                <Skeleton.Button active size="small" className="ljd-facts__skel" />
              </div>
            ))}
          </div>
        </section>
        <section className="ljd-card">
          <Skeleton active avatar={{ shape: "square", size: 36 }} title={{ width: "40%" }} paragraph={{ rows: 1, width: ["84%"] }} />
        </section>
        <section className="ljd-card">
          <Skeleton active title={{ width: "28%" }} paragraph={{ rows: 5, width: ["100%", "94%", "97%", "84%", "60%"] }} />
        </section>
        <section className="ljd-card">
          <Skeleton active title={{ width: "34%" }} paragraph={{ rows: 3, width: ["70%", "64%", "58%"] }} />
        </section>
      </div>
      <aside className="ljd-rail">
        <section className="ljd-card ljd-apply">
          <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 4, width: ["100%", "88%", "100%", "70%"] }} />
        </section>
      </aside>
    </main>
  );

  if (!isReady) {
    return renderShell(pageSkeleton);
  }

  if (!validatedJobId.valid && jobId != null && jobId !== "") {
    return renderShell(
      <main className="ljd-layout ljd-layout--single learn-job-detail-empty-actions">
        {validatedJobId.valid && <DriveJourney jobId={validatedJobId.value} unavailable />}
        <section className="ljd-card ljd-state">
          <span className="ljd-state__icon ljd-state__icon--warn" aria-hidden="true">
            <ExclamationCircleOutlined />
          </span>
          <h1 className="ljd-state__title">This job link isn&apos;t valid</h1>
          <p className="ljd-state__desc">
            The job ID in the address doesn&apos;t look right. Open the job from the jobs list and it will load correctly.
          </p>
          <div className="ljd-state__actions">
            <Button type="primary" onClick={goToJobs} className="ljd-cta learn-job-detail-cta-touch">
              Browse drives
            </Button>
          </div>
        </section>
      </main>
    );
  }

  if (loading || (jobId == null && !loadError)) {
    return renderShell(pageSkeleton);
  }

  if (!job && !loading) {
    const isLoadError = loadError && validatedJobId.valid;
    const emptyTitle = unavailableReason ? "This drive can't be shown" : loadError ? "We couldn't load this drive" : "Drive not found";
    const emptyDescription = unavailableReason
      || (loadError
        ? "We could not load this drive. It may have been removed, or it may not be open to you."
        : "This drive does not exist or is no longer open.");
    return renderShell(
      <main className="ljd-layout ljd-layout--single learn-job-detail-empty-actions">
        <section className="ljd-card ljd-state">
          <span className="ljd-state__icon ljd-state__icon--warn" aria-hidden="true">
            <InfoCircleOutlined />
          </span>
          <h1 className="ljd-state__title">{emptyTitle}</h1>
          <p className="ljd-state__desc">{emptyDescription}</p>
          <div className="ljd-state__actions">
            {isLoadError && (
              <Button type="primary" onClick={() => fetchJobDetails(validatedJobId.value)} className="ljd-cta learn-job-detail-cta-touch">
                Retry
              </Button>
            )}
            <Button onClick={goToJobs} className="ljd-cta learn-job-detail-cta-touch">
              Browse drives
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const jobTypeTag = getJobTypeTag(job.jobType);
  const posted = formatPostedAgo(job.postedDate);
  const appDeadline = parseJobDate(job.applicationDeadline);
  const applicationClosed = !hasApplied && isApplicationClosed(job.applicationDeadline);
  const deadline = deadlineState(appDeadline, applicationClosed);
  const isEligible = Boolean(eligibility?.isEligible);

  const interviewsLink = nextInterviewForJob?.id
    ? interviewsPath
    : interviewsPath;

  const applyDisabled = !isEligible || applying || uploadingResume || appliedStatusUnknown || applicationClosed;
  const applyLabel = applying
    ? "Submitting…"
    : uploadingResume
      ? "Uploading resume…"
    : appliedStatusUnknown
      ? "Can't confirm application status"
    : applicationClosed
        ? "Applications closed"
        : isEligible
          ? "Apply now"
          : "Not eligible to apply";

  // ---- Resume presentation -------------------------------------------------
  const profileResumeName = resumeFileName(profileResumeUrl) || "Resume on your profile";
  const uploadedResumeName = uploadedResumeMeta?.name || resumeFileName(resumeUrl) || "Uploaded resume";
  const uploadedResumeSize = formatBytes(uploadedResumeMeta?.size);
  const selectedResumeUrl = resumeChoice === "new" ? resumeUrl : resumeChoice === "profile" ? profileResumeUrl : null;
  const selectedResumeName = resumeChoice === "new" ? uploadedResumeName : resumeChoice === "profile" ? profileResumeName : null;

  const receiptMoment = receipt?.appliedAt ? parseJobDate(receipt.appliedAt) : null;
  const receiptResumeName = receipt?.resumeName || resumeFileName(receipt?.resumeUrl);

  const applyCard = hasApplied ? (
    <section
      className={`ljd-card ljd-applied${justApplied ? " ljd-applied--celebrate" : ""}`}
      aria-labelledby="ljd-applied-heading"
      aria-live="polite"
    >
      <span className="ljd-applied__icon" aria-hidden="true">
        <CheckCircleOutlined />
      </span>
      <h2 id="ljd-applied-heading" className="ljd-applied__title">
        {justApplied ? "You're in — application sent" : "Application submitted"}
      </h2>
      <p className="ljd-applied__role">
        {job.jobTitle}
        {job.companyName ? <span className="ljd-applied__company"> · {job.companyName}</span> : null}
      </p>

      {/* Durable receipt — the thing students screenshot. */}
      <dl className="ljd-receipt">
        {receipt?.id != null && (
          <div className="ljd-receipt__row">
            <dt>Reference</dt>
            <dd className="ljd-receipt__mono">APP-{receipt.id}</dd>
          </div>
        )}
        <div className="ljd-receipt__row">
          <dt>Submitted</dt>
          <dd>
            {receiptMoment
              ? <time dateTime={receiptMoment.toISOString()}>{receiptMoment.format("D MMM YYYY, h:mm A")}</time>
              : <span className="ljd-receipt__muted">Timestamp unavailable</span>}
          </dd>
        </div>
        <div className="ljd-receipt__row">
          <dt>Resume sent</dt>
          <dd>
            {receipt?.resumeUrl ? (
              <button type="button" className="ljd-textlink ljd-receipt__file" onClick={() => setPreviewUrl(receipt.resumeUrl)}>
                <FileTextOutlined aria-hidden="true" />
                {receiptResumeName || "View resume"}
              </button>
            ) : (
              <span className="ljd-receipt__muted">No resume attached</span>
            )}
          </dd>
        </div>
        {/* No "Status" row: it said "Interview" while Your progress said "Booked: Aptitude test" (student UX audit, 20 Oct 2026).
            Where they stand is Your progress, in the student's words. */}
      </dl>

      {/* Students get email only for sign-in and interviews; everything else is a notice here. */}
      <p className="ljd-applied__tertiary">
        When you are booked for a round or your application moves, you get a notice here. Interview bookings are also emailed.
      </p>

      {nextInterviewForJob && (
        <Button
          type="primary"
          size="large"
          block
          icon={<CalendarOutlined />}
          onClick={() => router.push(interviewsLink)}
          className="ljd-cta ljd-cta--primary learn-job-detail-cta-touch"
        >
          View your interview
        </Button>
      )}
      <div className="ljd-applied__actions">
        <Button
          type={nextInterviewForJob ? "default" : "primary"}
          size="large"
          block
          icon={<ArrowRightOutlined />}
          onClick={() => router.push(applicationsPath)}
          className="ljd-cta ljd-cta--primary learn-job-detail-cta-touch"
        >
          View applications
        </Button>
        <Button block onClick={goToJobs} className="ljd-cta ljd-cta--secondary learn-job-detail-cta-touch">
          Browse more drives
        </Button>
      </div>

      <InlineError
        title={withdrawError ? "Your application was not withdrawn" : null}
        detail={withdrawError}
        onDismiss={() => setWithdrawError(null)}
      />

      {applicationStatus === "APPLIED" && (
        <p className="ljd-applied__tertiary">
          <button
            type="button"
            className="ljd-textlink ljd-textlink--danger"
            onClick={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? "Withdrawing…" : "Withdraw this application"}
          </button>
        </p>
      )}
    </section>
  ) : (
    <section className="ljd-card ljd-apply" aria-labelledby="ljd-apply-heading">
      <h2 id="ljd-apply-heading" className="ljd-apply__title">Apply to this role</h2>

      {profileResumeLoading ? (
        <div className="ljd-resume-skeleton">
          <Skeleton.Button active block className="ljd-resume-skeleton__item" />
          <Skeleton.Button active block className="ljd-resume-skeleton__item" />
        </div>
      ) : (
        <fieldset className="ljd-fieldset">
          <legend className="ljd-fieldset__legend">Resume</legend>
          {/* The resume always comes from the profile (no per-drive upload): one resume to keep current, the one the
              placement cell and companies see everywhere. */}
          {profileResumeUrl ? (
            <div className="ljd-doc" data-testid="ljd.profile-resume">
              <span className="ljd-doc__icon" aria-hidden="true"><FileTextOutlined /></span>
              <span className="ljd-doc__text">
                <span className="ljd-doc__name">{profileResumeName}</span>
                <span className="ljd-doc__meta">Your profile resume is sent with this application</span>
              </span>
              <Button size="small" className="ljd-smallbtn" icon={<EyeOutlined />} onClick={() => setPreviewUrl(profileResumeUrl)}>Preview</Button>
            </div>
          ) : (
            <p className="ljd-apply__noresume" data-testid="ljd.no-resume">
              You have no resume on your profile. Recruiters shortlist from it, so add one first; you can still apply without it.
            </p>
          )}
          <Link className="ljd-textlink" href="/learn/profile">{profileResumeUrl ? "Update the resume on your profile" : "Add a resume on your profile"}</Link>
        </fieldset>
      )}

      {applicationClosed && (
        <p className="ljd-apply__closed" role="status">
          <ClockCircleOutlined aria-hidden="true" />
          The deadline for this role has passed, so applications are no longer accepted.
        </p>
      )}

      {appliedStatusUnknown && (
        <InlineError
          title="We couldn't confirm whether you've already applied"
          detail="Applying is blocked until we can check — this avoids submitting a duplicate application. Try again, or come back in a moment."
          onRetry={() => fetchJobDetails(validatedJobId.value)}
        />
      )}

      {recentlyWithdrawn && (
        <p className="ljd-apply__closed" role="status">
          Your previous application was withdrawn. Applying again may be allowed for an early-stage withdrawal, but is not guaranteed. If a new application is rejected, contact the placement team.
        </p>
      )}

      {/* Failures stay on screen, anchored to the button that failed. */}
      <InlineError
        title={applyError ? "Your application was not submitted" : null}
        detail={applyError}
        onDismiss={() => setApplyError(null)}
      />

      <Button
        type={applyDisabled ? "default" : "primary"}
        size="large"
        block
        onClick={handleApply}
        loading={applying}
        disabled={applyDisabled}
        aria-describedby={!isEligible && eligibility?.reason ? "job-eligibility-reason" : undefined}
        icon={!applying && applicationClosed ? <ClockCircleOutlined /> : !applying && !isEligible ? <InfoCircleOutlined /> : undefined}
        className="ljd-cta ljd-cta--apply learn-job-detail-cta-touch"
      >
        {applyLabel}
      </Button>
      {!isEligible && !applicationClosed && (
        <p className="ljd-apply__hint">
          Ask your placement cell if you think this is wrong.
        </p>
      )}
    </section>
  );

  return (
    <div className={`learn-job-detail-page ljd${hasApplied ? " ljd--applied learn-job-detail-page--applied" : ""}`}>
      {head}
      {renderNav(job.jobTitle || "Drive")}
      <main className="ljd-layout" id="learn-job-detail-main">
        <div className="ljd-main">
          <header className="ljd-card ljd-hero">
            <div className="ljd-hero__top">
              <div className="ljd-hero__avatar"><PlacementsCompanyAvatar companyName={job.companyName} companyLogo={job.companyLogo} size={56} className="learn-jobs" /></div>
              <div className="ljd-hero__headings">
                <h1 className="ljd-hero__title">{job.jobTitle}</h1>
                <p className="ljd-hero__org">
                  <span className="ljd-hero__company">{job.companyName}</span>
                  {job.location && (
                    <>
                      <span className="ljd-hero__sep" aria-hidden="true">·</span>
                      <span className="ljd-hero__location">
                        <EnvironmentOutlined aria-hidden="true" />
                        {job.location}
                      </span>
                    </>
                  )}
                </p>
              </div>
              {job?.id && loginUser?.id && (
                <Tooltip title={isSaved ? "Saved" : "Save for later"}>
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    disabled={saveLoading}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Remove from saved jobs" : "Save for later"}
                    className="learn-job-detail-save-btn ljd-save"
                  >
                    {isSaved ? <HeartFilled className="ln-icon-teal" /> : <HeartOutlined className="ln-icon-muted" />}
                  </button>
                </Tooltip>
              )}
            </div>

            {/* Fact strip: aligned label/value pairs, with the deadline given its own weight. */}
            <dl className="ljd-facts" aria-label="Job summary">
              {job.driveMode && (
                <div className="ljd-facts__item" data-testid="job.drive-mode">
                  <dt className="ljd-facts__label">Where</dt>
                  <dd className="ljd-facts__value">
                    {job.driveMode === "POOL" ? `Pool drive at ${job.hostCollegeName || "another college"}`
                      : job.driveMode === "OFF_CAMPUS" ? "Off campus" : "On campus"}
                    {job.driveMode === "POOL" && job.reportingAt && parseJobDate(job.reportingAt) && (
                      <span className="ljd-facts__sub">Report by {parseJobDate(job.reportingAt).format("D MMM, h:mm A")}</span>
                    )}
                    {job.driveMode === "POOL" && job.travelNote && <span className="ljd-facts__sub">{job.travelNote}</span>}
                    {job.driveMode === "OFF_CAMPUS" && safeHref(job.externalApplyUrl) && (
                      <span className="ljd-facts__sub">
                        Apply on the company&apos;s site: <a href={safeHref(job.externalApplyUrl)} target="_blank" rel="noopener noreferrer">open the application</a>.
                        {" "}Then apply here too, so the placement cell can follow up.
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {jobTypeTag && (
                <div className="ljd-facts__item">
                  <dt className="ljd-facts__label">Job type</dt>
                  <dd className="ljd-facts__value ljd-facts__value--tag">{jobTypeTag}</dd>
                </div>
              )}
              {/* One pay line: the package list when the drive has one (it repeated the same CTC above it). */}
              {job.ctcRange && !(payDetails && payDetails.length > 0) && (
                <div className="ljd-facts__item">
                  <dt className="ljd-facts__label">Compensation</dt>
                  <dd className="ljd-facts__value">{job.ctcRange}</dd>
                </div>
              )}
              {payDetails && payDetails.length > 0 && (
                <div className="ljd-facts__item ljd-facts__item--pay">
                  <dt className="ljd-facts__label">Pay</dt>
                  <dd className="ljd-facts__value">
                    <ul className="ljd-pay-list">
                      {payDetails.map((p) => (
                        <li key={p.key} className="ljd-pay-list__row">
                          {/* One package needs no name: the form calls it "Default", which read "Default: 8.5 LPA" (student UX audit, 20 Oct 2026). */}
                          {p.name && payDetails.length > 1 && <span className="ljd-pay-list__name">{p.name}: </span>}
                          {p.ctcLpa != null && <span>{p.ctcLpa} LPA</span>}
                          {(p.fixedLpa != null || p.variableLpa != null) && (
                            <span className="ljd-pay-list__split">
                              {" "}({p.fixedLpa != null ? `${p.fixedLpa} fixed` : ""}
                              {p.fixedLpa != null && p.variableLpa != null ? " + " : ""}
                              {p.variableLpa != null ? `${p.variableLpa} variable` : ""})
                            </span>
                          )}
                          {p.joiningBonusLpa != null && (
                            <span className="ljd-pay-list__bonus"> · Joining bonus {p.joiningBonusLpa} LPA</span>
                          )}
                          {p.stipendPerMonth != null && (
                            <span> Stipend {"₹"}{p.stipendPerMonth}/month</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {posted && (
                <div className="ljd-facts__item">
                  <dt className="ljd-facts__label">Posted</dt>
                  <dd className="ljd-facts__value">{posted}</dd>
                </div>
              )}
              {deadline && (
                <div className="ljd-facts__item ljd-facts__item--deadline">
                  <dt className="ljd-facts__label">Applications close</dt>
                  <dd className="ljd-facts__value">
                    <span className="ljd-deadline" data-tone={deadline.tone}>
                      {deadline.tone === "urgent" ? <FireOutlined aria-hidden="true" />
                        : deadline.tone === "closed" ? <StopOutlined aria-hidden="true" />
                          : <CalendarOutlined aria-hidden="true" />}
                      {deadline.text}
                    </span>
                    {deadline.sub && <span className="ljd-facts__sub">{deadline.sub}</span>}
                  </dd>
                </div>
              )}
            </dl>
          </header>

          {/* Once applied, "can you apply" is answered: the card gave way to their progress (it still said "you can apply"). */}
          {!hasApplied && (
          <section
            className={`ljd-card ljd-eligibility ljd-eligibility--${isEligible ? "ok" : "blocked"}`}
            aria-labelledby="ljd-eligibility-heading"
          >
            <div className="ljd-eligibility__head">
              <span className="ljd-eligibility__icon" aria-hidden="true">
                {isEligible ? <SafetyCertificateOutlined /> : <InfoCircleOutlined />}
              </span>
              <div>
                <h2 id="ljd-eligibility-heading" className="ljd-eligibility__title">
                  {isEligible ? "You can apply" : "You can't apply to this drive"}
                </h2>
                <p className="ljd-eligibility__desc" id="job-eligibility-reason">
                  {isEligible
                    ? "You meet this drive's rules."
                    : (eligibility?.reason || "This drive isn't open to your branch or batch.")}
                </p>
                {!isEligible && eligibility?.action === "REGISTER" && (
                  <Button type="primary" size="small" style={{ marginBottom: 8 }} onClick={() => router.push("/learn/my-placements/placement")}>
                    Register in Placement cell
                  </Button>
                )}
                <DriveEligibilityPanel jobId={job.id} />
                <Button type="link" size="small" style={{ padding: 0, height: "auto" }}
                  onClick={() => router.push("/learn/my-placements/placement#rules")}>
                  Your college&apos;s placement rules
                </Button>
              </div>
            </div>
          </section>
          )}

          <DriveJourney jobId={job.id} />

          <section className="ljd-card ljd-about" aria-labelledby="ljd-about-heading">
            <h2 id="ljd-about-heading" className="ljd-section-title">About this role</h2>
            {job.jobDescription ? (
              <div className="ljd-about__body">
                <RichTextDisplay content={job.jobDescription} />
                {job.jdUrl && safeHref(job.jdUrl) ? <p><a href={safeHref(job.jdUrl)} target="_blank" rel="noopener noreferrer">Download the full job description</a></p> : null}
              </div>
            ) : job.jdUrl && safeHref(job.jdUrl) ? (
              <div className="ljd-about__body"><p><a href={safeHref(job.jdUrl)} target="_blank" rel="noopener noreferrer">Download the full job description</a></p></div>
            ) : (
              <p className="ljd-empty-note">
                No description has been added for this role yet. You can still apply and ask the recruiter for details.
              </p>
            )}
          </section>

          {requirements && (
            <section className="ljd-card ljd-req" aria-labelledby="ljd-req-heading">
              <h2 id="ljd-req-heading" className="ljd-section-title">Requirements &amp; preferences</h2>
              <dl className="ljd-req__list">
                {requirements.map((r, i) => {
                  const chips = toChipList(r.value);
                  return (
                    <div className="ljd-req__row" key={r.key || `req-${i}`}>
                      <dt className="ljd-req__label">{r.label}</dt>
                      <dd className="ljd-req__value">
                        {chips ? (
                          <span className="ljd-chips">
                            {chips.map((c, ci) => (
                              <span className="ljd-chip" key={`${c}-${ci}`}>{c}</span>
                            ))}
                          </span>
                        ) : (
                          <span className="ljd-req__text">{String(r.value)}</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}

          {keyDates.length > 0 && (
            <section className="ljd-card ljd-dates" aria-labelledby="ljd-dates-heading">
              <h2 id="ljd-dates-heading" className="ljd-section-title">Key dates</h2>
              <ol className="ljd-dates__list">
                {keyDates.map((d, i) => {
                  const past = d.moment.isBefore(moment(), "day");
                  return (
                    <li className={`ljd-dates__item${past ? " ljd-dates__item--past" : ""}`} key={`${d.label}-${i}`}>
                      <span className="ljd-dates__marker" aria-hidden="true" />
                      <span className="ljd-dates__label">{d.label}</span>
                      <time className="ljd-dates__date" dateTime={d.moment.format("YYYY-MM-DD")}>
                        {d.moment.format("D MMM YYYY")}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>

        <aside className="ljd-rail" aria-label="Application">
          {applyCard}
        </aside>
      </main>

      {!hasApplied && (
        <div className="ljd-mobilebar" role="group" aria-label="Apply to this job">
          <div className="ljd-mobilebar__meta">
            <span className="ljd-mobilebar__title">{job.jobTitle}</span>
            <span className="ljd-mobilebar__sub">
              {deadline ? deadline.text : job.companyName}
            </span>
          </div>
          <Button
            type={applyDisabled ? "default" : "primary"}
            size="large"
            onClick={handleApply}
            loading={applying}
            disabled={applyDisabled}
            className="ljd-cta ljd-cta--apply learn-job-detail-cta-touch"
          >
            {applyLabel}
          </Button>
        </div>
      )}

      <Modal
        open={withdrawConfirmOpen}
        onOk={handleConfirmWithdraw}
        onCancel={handleWithdrawCancel}
        title="Withdraw Application"
        className="ljd-modal ljd-modal--danger"
        okText={withdrawing ? "Withdrawing…" : "Withdraw"}
        okButtonProps={{ danger: true, disabled: withdrawing }}
        cancelText="Cancel"
        cancelButtonProps={{ disabled: withdrawing }}
        confirmLoading={withdrawing}
        closable={!withdrawing}
        maskClosable={!withdrawing}
        keyboard={!withdrawing}
        destroyOnClose
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <ExclamationCircleOutlined style={{ marginTop: 4, color: "#d4380d" }} />
          <div>
            <p>
              Withdrawing closes this application. Whether you can apply again depends on how far your application progressed.
              Contact your placement team if you need help.
            </p>
            {withdrawError ? (
              <div role="alert" style={{ color: "#cf1322", marginTop: 8 }}>
                {withdrawError}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onCancel={handleConfirmCancel}
        onOk={handleConfirmApply}
        okText={applying ? "Submitting…" : "Confirm & apply"}
        cancelText="Not yet"
        confirmLoading={applying}
        maskClosable={!applying}
        closable={!applying}
        centered
        width={440}
        className="ljd-modal ljd-modal--apply"
        title={null}
        okButtonProps={{ size: "large", className: "ljd-cta ljd-cta--apply" }}
        cancelButtonProps={{ size: "large", disabled: applying }}
      >
        <div className="ljd-confirm">
          <span className="ljd-confirm__icon" aria-hidden="true">
            <SafetyCertificateOutlined />
          </span>
          <h2 className="ljd-confirm__title">Ready to apply?</h2>
          <p className="ljd-confirm__lede">
            We&apos;ll send your profile to the recruiter. You can withdraw later from Applications.
          </p>
          <button
            type="button"
            className="ljd-confirm__disclosure-toggle"
            aria-expanded={privacyNoticeExpanded}
            aria-controls="job-application-privacy-details"
            onClick={() => setPrivacyNoticeExpanded((v) => !v)}
          >
            {privacyNoticeExpanded ? "Hide what gets shared" : "What exactly gets shared?"}
          </button>
          {privacyNoticeExpanded && (
            <ul id="job-application-privacy-details" className="ljd-confirm__disclosure">
              <li>Your resume and contact details go to this company once you apply.</li>
              <li>Your academic record (CGPA and percentages) is checked to confirm eligibility, not sent to the company.</li>
              <li>Your placement cell can see this application and its status at any time.</li>
            </ul>
          )}
          <dl className="ljd-confirm__summary">
            <div>
              <dt>Role</dt>
              <dd>{job.jobTitle ?? "This job"}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{job.companyName ?? "This company"}</dd>
            </div>
            <div>
              <dt>Resume</dt>
              <dd>{selectedResumeName || "No resume attached"}</dd>
            </div>
          </dl>
          <InlineError
            title={applyError ? "Application status needs attention" : null}
            detail={applyError}
            onDismiss={() => setApplyError(null)}
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(previewUrl)}
        onCancel={() => setPreviewUrl(null)}
        footer={null}
        centered
        width={860}
        title="Resume preview"
        className="ljd-modal ljd-modal--preview"
        destroyOnClose
      >
        {isPdfUrl(previewUrl) ? (
          <iframe className="ljd-preview__frame" src={previewUrl} title="Resume preview" sandbox="allow-same-origin allow-scripts" />
        ) : (
          <p className="ljd-preview__fallback">
            <InfoCircleOutlined aria-hidden="true" />
            Word documents can&apos;t be previewed in the browser. Open the file to check it.
          </p>
        )}
        {previewUrl && (
          <p className="ljd-preview__actions">
            <a className="ljd-textlink" href={previewUrl} target="_blank" rel="noopener noreferrer">
              Open in a new tab
            </a>
          </p>
        )}
      </Modal>
    </div>
  );
}
