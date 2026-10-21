import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Alert, Button, message, Typography, Input, Select, Tabs, Pagination } from "antd";

import {
  CloseCircleOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  HeartOutlined,
  HeartFilled,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import moment from "moment";
import {
  getSavedJobIds,
  getSavedJobs,
  saveJob,
  unsaveJob,
  getAllJobsWithEligibility,
  getLearnerApplications,
} from "@/api/Services/jobService";
import { getJobTypeTag, getApplicationStatusTag, getJobAccentColor, parseJobDate, formatPostedAgo } from "@/utils/jobTagUtils";
import { ensureArray } from "@/utils/learnerApiUtils";
import { getApplyChecks } from "@/api/Services/TpoHubService";
import { descriptionText } from "@/utils/driveDescription";
import PlacementsCompanyAvatar from "./PlacementsCompanyAvatar";
import { RefreshStatus } from "@/components/Common/Skeletons";
import { withReturnTo } from "@/utils/navigationContext";

const { Text } = Typography;

// Decoded before tags are removed: an older description stored escaped ("&lt;p&gt;Everything&lt;/p&gt;") showed its tags in
// the card (night audit 13 Oct 2026). Same reading as the drive forms (src/utils/driveDescription.js).
const stripHtml = (html) => {
  if (typeof html !== "string") return "";
  return (descriptionText(html) || "").replace(/•\s*/g, "").replace(/\s+/g, " ").trim();
};

const JOB_TYPE_FILTER_ALL = "all";
const LOCATION_FILTER_ALL = "all";
const SORT_DEADLINE = "deadline";
const SORT_NEWEST = "newest";
const SORT_CTC = "ctc";
const DEFAULT_SORT = SORT_DEADLINE;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 220;

const SORT_OPTIONS = [
  { value: SORT_DEADLINE, label: "Deadline soonest" },
  { value: SORT_NEWEST, label: "Newest first" },
  { value: SORT_CTC, label: "Highest CTC" },
];

const KNOWN_JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Freelance", "Remote"];

function isApplicationClosed(applicationDeadline) {
  const m = parseJobDate(applicationDeadline);
  return m ? m.isBefore(moment(), "minute") : false;
}

/**
 * Deadline urgency, encoded in BOTH text and tone so colour is never the only signal.
 * tone: "closed" | "urgent" (<=3 days) | "soon" (<=7 days) | "normal" | "none"
 */
function getDeadlineInfo(applicationDeadline) {
  const m = parseJobDate(applicationDeadline);
  if (!m) return { tone: "none", label: "No deadline set", short: "No deadline", closed: false, date: null, daysLeft: null };
  if (m.isBefore(moment(), "minute")) {
    return { tone: "closed", label: `Closed ${m.format("D MMM YYYY")}`, short: "Closed", closed: true, date: m, daysLeft: -1 };
  }
  const daysLeft = m.clone().startOf("day").diff(moment().startOf("day"), "days");
  if (daysLeft <= 0) return { tone: "urgent", label: "Closes today", short: "Closes today", closed: false, date: m, daysLeft: 0 };
  if (daysLeft === 1) return { tone: "urgent", label: "Closes tomorrow", short: "Closes tomorrow", closed: false, date: m, daysLeft };
  if (daysLeft <= 3) return { tone: "urgent", label: `Closes in ${daysLeft} days`, short: `${daysLeft} days left`, closed: false, date: m, daysLeft };
  if (daysLeft <= 7) return { tone: "soon", label: `Closes in ${daysLeft} days`, short: `${daysLeft} days left`, closed: false, date: m, daysLeft };
  return { tone: "normal", label: `Apply by ${m.format("D MMM YYYY")}`, short: m.format("D MMM"), closed: false, date: m, daysLeft };
}

/** Numeric key for CTC sorting — reads the highest number in strings like "6-10 LPA". */
function ctcSortValue(ctcRange) {
  if (!ctcRange || typeof ctcRange !== "string") return -1;
  const nums = ctcRange.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return -1;
  return Math.max(...nums.map(Number).filter(Number.isFinite));
}

/** Splits a comma separated location string into individual place tokens. */
function splitLocations(location) {
  if (!location || typeof location !== "string") return [];
  return location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

// Jobs empty illustration — Design System aligned
function JobsEmptyIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="learn-jobs-empty-illus" aria-hidden>
      <defs>
        <linearGradient id="jobEmptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#26bac7" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#d97706" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="20" y="10" width="80" height="55" rx="8" fill="url(#jobEmptyGrad)" stroke="#26bac7" strokeWidth="1.5" strokeOpacity="0.35" />
      <rect x="30" y="25" width="45" height="6" rx="2" fill="#26bac7" fillOpacity="0.4" />
      <rect x="30" y="38" width="30" height="4" rx="2" fill="#26bac7" fillOpacity="0.25" />
      <rect x="30" y="48" width="35" height="4" rx="2" fill="#d97706" fillOpacity="0.2" />
      <circle cx="85" cy="38" r="14" fill="rgba(38,186,199,0.12)" stroke="#26bac7" strokeWidth="2" strokeOpacity="0.5" />
      <path d="M81 38 L84 41 L90 35" fill="none" stroke="#26bac7" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Job row card.
 *
 * Interaction model: the *title* is the only card-level link. It stretches over the whole
 * card with a `::after` overlay (`.learn-jobs-card__link`), so a card contributes exactly two
 * tab stops — the title link and the save button — instead of the previous three-plus.
 * Ineligible jobs still link through: the detail page renders its own read-only /
 * eligibility-blocked state, which is far more useful than swallowing the click.
 */
function JobListItem({
  job,
  index,
  isSaved,
  onToggleSave,
  onNavigate,
  href,
  saveError,
  saveDisabled,
  descriptionSnippet,
  application,
}) {
  const posted = formatPostedAgo(job.postedDate);
  const deadline = getDeadlineInfo(job.applicationDeadline);
  const closed = deadline.closed || job.isActive === false;
  const ineligible = job.isVisible === false;
  const applied = Boolean(application);
  const accent = getJobAccentColor(job?.id, index);

  const state = ineligible ? "ineligible" : closed ? "closed" : applied ? "applied" : "open";

  return (
    <article
      className="learn-jobs-card"
      data-state={state}
      style={{ "--jobs-card-accent": accent }}
    >
      <span className="learn-jobs-card__accent" aria-hidden="true" />

      <div className="learn-jobs-card__avatar">
        <PlacementsCompanyAvatar companyName={job.companyName} companyLogo={job.companyLogo} size={48} className="learn-jobs" />
      </div>

      <div className="learn-jobs-card__body">
        <div className="learn-jobs-card__badges">
          {getJobTypeTag(job.jobType)}
          {applied && getApplicationStatusTag(application.status || "APPLIED")}
          {ineligible && (
            <span className="learn-jobs-card__chip learn-jobs-card__chip--blocked">Not open to you</span>
          )}
          {!ineligible && closed && (
            <span className="learn-jobs-card__chip learn-jobs-card__chip--closed">Applications closed</span>
          )}
        </div>

        <h3 className="learn-jobs-card__title ln-lto-bold">
          <a
            className="learn-jobs-card__link"
            href={href}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onNavigate(job?.id);
            }}
          >
            {job.jobTitle}
          </a>
        </h3>

        <p className="learn-jobs-card__company ln-lto-reg">{job.companyName}</p>

        {descriptionSnippet && <p className="learn-jobs-card__snippet ln-lto-reg">{descriptionSnippet}</p>}

        {ineligible && (
          <p className="learn-jobs-card__notice ln-lto-reg">
            <CloseCircleOutlined aria-hidden="true" />
            <span>
              {job.visibilityReason || "This drive is for a different branch, program or batch."} Open it to see its rules, or ask
              your placement cell if you think this is wrong.
            </span>
          </p>
        )}

        {!ineligible && closed && (
          <p className="learn-jobs-card__notice learn-jobs-card__notice--muted ln-lto-reg">
            <ClockCircleOutlined aria-hidden="true" />
            <span>
              Applications closed{deadline.date ? ` on ${deadline.date.format("D MMM YYYY")}` : ""}. You can still read the
              role description.
            </span>
          </p>
        )}

        {posted && <p className="learn-jobs-card__posted ln-lto-reg">Posted {posted}</p>}
      </div>

      {/* Fixed comparison column — CTC / Deadline / Location always in the same order,
          vertically aligned row-to-row so the eye can scan straight down. */}
      <dl className="learn-jobs-card__facts">
        <div className="learn-jobs-card__fact">
          <dt className="learn-jobs-card__fact-label">
            <WalletOutlined aria-hidden="true" /> CTC
          </dt>
          <dd className={`learn-jobs-card__fact-value${job.ctcRange ? "" : " learn-jobs-card__fact-value--empty"}`}>
            {job.ctcRange || "Not disclosed"}
          </dd>
        </div>
        <div className="learn-jobs-card__fact">
          <dt className="learn-jobs-card__fact-label">
            <CalendarOutlined aria-hidden="true" /> Deadline
          </dt>
          <dd className="learn-jobs-card__fact-value">
            <span className="learn-jobs-card__deadline" data-tone={deadline.tone}>
              {deadline.label}
            </span>
          </dd>
        </div>
        <div className="learn-jobs-card__fact">
          <dt className="learn-jobs-card__fact-label">
            <EnvironmentOutlined aria-hidden="true" /> Location
          </dt>
          <dd className={`learn-jobs-card__fact-value${job.location ? "" : " learn-jobs-card__fact-value--empty"}`}>
            {job.location || "Not specified"}
          </dd>
        </div>
      </dl>

      <div className="learn-jobs-card__actions">
        <button
          type="button"
          className="learn-jobs-card__save"
          disabled={saveDisabled}
          title={saveDisabled ? "Saved drives are temporarily unavailable; retry loading." : undefined}
          data-saved={isSaved ? "true" : "false"}
          onClick={(e) => onToggleSave(e, job?.id)}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${job.jobTitle} from saved drives` : `Save ${job.jobTitle} for later`}
        >
          {isSaved ? <HeartFilled aria-hidden="true" /> : <HeartOutlined aria-hidden="true" />}
        </button>
        {saveError && (
          <span className="learn-jobs-card__save-error" role="alert">
            {saveError}
          </span>
        )}
      </div>
    </article>
  );
}

/**
 * Skeleton hand-built from the card's own grid so nothing shifts sideways when data lands:
 * same avatar tile, same badge row, same three-slot facts column, same actions column.
 */
function JobListSkeleton() {
  return (
    <div className="learn-jobs-card learn-jobs-card--skeleton" aria-hidden="true">
      <span className="learn-jobs-card__accent" />
      <div className="learn-jobs-card__avatar">
        <span className="learn-jobs-sk learn-jobs-sk--avatar" />
      </div>
      <div className="learn-jobs-card__body">
        <div className="learn-jobs-card__badges">
          <span className="learn-jobs-sk learn-jobs-sk--chip" />
          <span className="learn-jobs-sk learn-jobs-sk--chip learn-jobs-sk--chip-sm" />
        </div>
        <span className="learn-jobs-sk learn-jobs-sk--title" />
        <span className="learn-jobs-sk learn-jobs-sk--company" />
        <span className="learn-jobs-sk learn-jobs-sk--line" />
        <span className="learn-jobs-sk learn-jobs-sk--line learn-jobs-sk--line-short" />
      </div>
      <div className="learn-jobs-card__facts">
        <span className="learn-jobs-sk learn-jobs-sk--fact" />
        <span className="learn-jobs-sk learn-jobs-sk--fact" />
        <span className="learn-jobs-sk learn-jobs-sk--fact" />
      </div>
      <div className="learn-jobs-card__actions">
        <span className="learn-jobs-sk learn-jobs-sk--save" />
      </div>
    </div>
  );
}

/**
 * Reusable Jobs list content — dashboard layout, Design System aligned
 */
export default function JobsListContent({ basePath = "/learn" }) {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const [jobs, setJobs] = useState([]);
  const [savedJobsFull, setSavedJobsFull] = useState([]);
  const [applicationsByJobId, setApplicationsByJobId] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [saveErrors, setSaveErrors] = useState({});
  const [supportErrors, setSupportErrors] = useState({ savedIds: false, savedJobs: false, applications: false });
  const [notOpenExpanded, setNotOpenExpanded] = useState(false);
  const saveInFlightRef = useRef(new Set());
  const abortControllerRef = useRef(null);
  const jobsRef = useRef([]);
  const searchHydratedRef = useRef(false);

  useEffect(() => { jobsRef.current = jobs; }, [jobs]);

  const jobsPath = `${basePath.replace(/\/$/, "")}/jobs`;

  // -------------------------------------------------------------------------
  // Filter / sort / page state lives in the URL alongside ?tab= so a filtered
  // view is shareable, survives a refresh, and restores on browser back.
  // -------------------------------------------------------------------------
  const query = router.query || {};
  const activeTab = query.tab === "saved" ? "saved" : "all";
  const searchText = String(query.q ?? "");
  const jobTypeFilter = String(query.type ?? JOB_TYPE_FILTER_ALL);
  const locationFilter = String(query.loc ?? LOCATION_FILTER_ALL);
  const sortBy = SORT_OPTIONS.some((o) => o.value === query.sort) ? String(query.sort) : DEFAULT_SORT;
  const eligibleOnly = query.eligible === "1";
  const closingSoon = query.soon === "1";
  const currentPage = Math.max(1, Number(query.page) || 1);

  const updateQuery = useCallback(
    (patch) => {
      const next = { ...(router.query || {}), ...patch };
      // Any filter change resets paging — otherwise you land on an empty page 4.
      if (!("page" in patch)) delete next.page;
      const defaults = {
        q: "",
        type: JOB_TYPE_FILTER_ALL,
        loc: LOCATION_FILTER_ALL,
        sort: DEFAULT_SORT,
        eligible: "0",
        soon: "0",
        tab: "all",
        page: "1",
      };
      Object.keys(next).forEach((key) => {
        const val = next[key];
        if (val == null || val === "" || String(val) === defaults[key]) delete next[key];
      });
      router.replace({ pathname: jobsPath, query: next }, undefined, { shallow: true });
    },
    [router, jobsPath]
  );

  const setTabAndUrl = useCallback((key) => updateQuery({ tab: key }), [updateQuery]);

  // Keep the search box synchronized with browser Back/Forward and external links.
  useEffect(() => {
    if (!router.isReady) return;
    searchHydratedRef.current = true;
    setSearchInput(String(router.query?.q ?? ""));
  }, [router.isReady, router.query?.q]);

  // Debounced search — typing no longer re-filters (or re-renders the list) per keystroke.
  useEffect(() => {
    if (!router.isReady || !searchHydratedRef.current) return;
    if (searchInput === searchText) return;
    const timer = setTimeout(() => updateQuery({ q: searchInput }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, searchText, router.isReady, updateQuery]);

  const fetchJobs = useCallback(async () => {
    if (!loginUser?.id) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setFetchError(null);
    try {
      const [jobsRes, savedIdsRes, savedJobsRes, applicationsRes] = await Promise.all([
        getAllJobsWithEligibility(loginUser.id, { signal }),
        getSavedJobIds(loginUser.id).catch(() => null),
        // Full saved job records so a saved job that later closes still renders (in "Expired")
        // instead of silently vanishing from the Saved tab.
        getSavedJobs(loginUser.id).catch(() => null),
        // Applied state is not on the list endpoint — derive it by joining the learner's
        // applications on jobId.
        getLearnerApplications(loginUser.id, { signal }).catch(() => null),
      ]);
      const response = jobsRes;
      const savedData = savedIdsRes?.data?.data;
      const savedIdsOk = savedIdsRes?.data?.status === "success" && Array.isArray(savedData);
      const savedJobsOk = savedJobsRes?.data?.status === "success" && Array.isArray(savedJobsRes?.data?.data);
      const applicationsOk = applicationsRes?.data?.status === "success" && Array.isArray(applicationsRes?.data?.data);
      setSupportErrors({ savedIds: !savedIdsOk, savedJobs: !savedJobsOk, applications: !applicationsOk });
      if (savedIdsOk) setSavedJobIds(new Set(savedData.map(Number).filter(Number.isFinite)));

      const savedFull = ensureArray(savedJobsRes?.data?.data)
        .map((item) => (item && typeof item === "object" ? item.job ?? item : null))
        .filter((item) => item && item.id != null);
      setSavedJobsFull(savedFull);

      const appMap = new Map();
      ensureArray(applicationsRes?.data?.data).forEach((item) => {
        if (!item || typeof item !== "object") return;
        const app = item.application ?? item;
        const jobId = app?.job?.id ?? item?.job?.id ?? app?.jobId ?? item?.jobId;
        const numericId = Number(jobId);
        if (!Number.isFinite(numericId)) return;
        // The applications API returns the status field as applicationStatus, not status — this
        // was always undefined, so getApplicationStatusTag(application.status || "APPLIED")
        // silently fell back to "Applied" for every job, regardless of actual pipeline stage
        // (shortlisted, interviewed, offered, rejected all showed a plain "Applied" badge).
        appMap.set(numericId, { status: app?.applicationStatus ?? app?.status, appliedAt: app?.appliedAt });
      });
      setApplicationsByJobId(appMap);

      if (response?.data?.status === "success") {
        const list = ensureArray(response.data.data);
        setJobs(list);
        // The college's own gate per drive (registration, the drive's rules, held offers): a placed student was shown drives
        // as "open" that their offer kept them out of (student audit, 14 Oct 2026). A drive that fails it moves to "Not open to
        // you" with the reason; a failed check changes nothing (the drive page checks again before Apply).
        const ask = list.filter((j) => j?.id != null && j.isVisible !== false && !appMap.has(Number(j.id))).map((j) => j.id).slice(0, 100);
        if (ask.length) {
          getApplyChecks(ask).then((r) => {
            const checks = r?.data || {};
            if (signal?.aborted) return;
            setJobs((cur) => cur.map((j) => {
              const c = checks[String(j?.id)];
              return c && c.canApply === false && c.code !== "DRIVE_CLOSED" ? { ...j, isVisible: false, visibilityReason: c.reason } : j;
            }));
          }).catch(() => {});
        }
      } else {
        if (jobsRef.current.length === 0) setJobs([]);
        setFetchError("Failed to fetch drives");
      }
    } catch (err) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      // A retry/background refresh must not make already-visible opportunities disappear.
      // Keep the last successful list and pair it with a persistent inline warning.
      if (jobsRef.current.length === 0) setJobs([]);
      setFetchError("Failed to load drives. Please try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [loginUser?.id]);

  useEffect(() => {
    if (!loginUser?.id) {
      message.warning("Please log in to view drives", 2);
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    fetchJobs();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loginUser?.id, router, fetchJobs]);

  /**
   * Optimistic save: the icon flips immediately and the filled heart is the confirmation —
   * no success toast. A failure rolls the icon back and shows an inline message on the card.
   */
  const handleToggleSave = useCallback(
    async (e, jobId) => {
      e.preventDefault();
      e.stopPropagation();
      if (!loginUser?.id || !jobId || supportErrors.savedIds || saveInFlightRef.current.has(jobId)) return;
      // Guard synchronously: two rapid taps can arrive before React re-renders.
      saveInFlightRef.current.add(jobId);
      const wasSaved = savedJobIds.has(jobId);
      setSaveErrors((prev) => (prev[jobId] ? { ...prev, [jobId]: null } : prev));
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(jobId);
        else next.add(jobId);
        return next;
      });

      try {
        if (wasSaved) await unsaveJob(jobId, loginUser.id);
        else await saveJob(jobId, loginUser.id);
      } catch (err) {
        // Roll back to the pre-click state and explain inline, next to the control.
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
        setSaveErrors((prev) => ({
          ...prev,
          [jobId]: err?.response?.data?.message || (wasSaved ? "Couldn't remove — try again" : "Couldn't save — try again"),
        }));
      } finally {
        saveInFlightRef.current.delete(jobId);
      }
    },
    [loginUser?.id, savedJobIds, supportErrors.savedIds]
  );

  // Every saved job we know about, whether or not it is still in the active list.
  const savedJobsPool = useMemo(() => {
    const map = new Map();
    savedJobsFull.forEach((job) => {
      if (job?.id != null) map.set(job.id, job);
    });
    // The active list carries eligibility fields the saved endpoint doesn't — merge them on top.
    jobs.forEach((job) => {
      if (job?.id == null) return;
      map.set(job.id, map.has(job.id) ? { ...map.get(job.id), ...job } : job);
    });
    return map;
  }, [savedJobsFull, jobs]);

  const savedBaseJobs = useMemo(() => {
    const out = [];
    savedJobIds.forEach((id) => {
      const job = savedJobsPool.get(id);
      if (job) out.push(job);
    });
    return out;
  }, [savedJobIds, savedJobsPool]);

  const savedCount = savedBaseJobs.length;
  const baseJobs = activeTab === "saved" ? savedBaseJobs : jobs;

  // Precompute the searchable blob + plain-text description once per job, keyed on the
  // source arrays — stripHtml no longer runs six regexes per job per keystroke or render.
  const jobTextIndex = useMemo(() => {
    const map = new Map();
    const add = (job) => {
      if (!job || job.id == null || map.has(job.id)) return;
      const plain = stripHtml(job.jobDescription || "");
      map.set(job.id, {
        plain,
        blob: [job.jobTitle, job.companyName, job.location, job.jobType, job.ctcRange, plain]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    };
    jobs.forEach(add);
    savedJobsFull.forEach(add);
    return map;
  }, [jobs, savedJobsFull]);

  const typeCounts = useMemo(() => {
    const counts = {};
    baseJobs.forEach((job) => {
      const t = job.jobType || "Other";
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [baseJobs]);

  const locationCounts = useMemo(() => {
    const counts = {};
    baseJobs.forEach((job) => {
      splitLocations(job.location).forEach((loc) => {
        counts[loc] = (counts[loc] || 0) + 1;
      });
    });
    return counts;
  }, [baseJobs]);

  const eligibleCount = useMemo(() => baseJobs.filter((job) => job.isVisible !== false).length, [baseJobs]);

  const closingSoonCount = useMemo(
    () =>
      baseJobs.filter((job) => {
        const info = getDeadlineInfo(job.applicationDeadline);
        return !info.closed && info.daysLeft != null && info.daysLeft <= 7;
      }).length,
    [baseJobs]
  );

  const jobTypeOptions = useMemo(() => {
    const present = Object.keys(typeCounts).sort((a, b) => a.localeCompare(b));
    const ordered = [
      ...KNOWN_JOB_TYPES.filter((t) => present.includes(t)),
      ...present.filter((t) => !KNOWN_JOB_TYPES.includes(t)),
    ];
    return [
      { value: JOB_TYPE_FILTER_ALL, label: `All types (${baseJobs.length})` },
      ...ordered.map((t) => ({ value: t, label: `${t} (${typeCounts[t]})` })),
    ];
  }, [typeCounts, baseJobs.length]);

  const locationOptions = useMemo(() => {
    const names = Object.keys(locationCounts).sort((a, b) => a.localeCompare(b));
    return [
      { value: LOCATION_FILTER_ALL, label: "All locations" },
      ...names.map((n) => ({ value: n, label: `${n} (${locationCounts[n]})` })),
    ];
  }, [locationCounts]);

  const filteredJobs = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    const result = baseJobs.filter((job) => {
      if (needle) {
        const blob = jobTextIndex.get(job?.id)?.blob || "";
        if (!blob.includes(needle)) return false;
      }
      if (jobTypeFilter !== JOB_TYPE_FILTER_ALL && (job.jobType || "Other") !== jobTypeFilter) return false;
      if (locationFilter !== LOCATION_FILTER_ALL && !splitLocations(job.location).includes(locationFilter)) return false;
      if (eligibleOnly && job.isVisible === false) return false;
      if (closingSoon) {
        const info = getDeadlineInfo(job.applicationDeadline);
        if (info.closed || info.daysLeft == null || info.daysLeft > 7) return false;
      }
      return true;
    });

    const sorted = [...result];
    if (sortBy === SORT_NEWEST) {
      sorted.sort((a, b) => {
        const da = parseJobDate(a.postedDate);
        const db = parseJobDate(b.postedDate);
        return (db ? db.valueOf() : -Infinity) - (da ? da.valueOf() : -Infinity);
      });
    } else if (sortBy === SORT_CTC) {
      sorted.sort((a, b) => ctcSortValue(b.ctcRange) - ctcSortValue(a.ctcRange));
    } else {
      // Deadline soonest — open roles first (nearest deadline), then no-deadline, then closed.
      const rank = (job) => {
        const info = getDeadlineInfo(job.applicationDeadline);
        if (info.closed) return { group: 2, at: info.date ? -info.date.valueOf() : 0 };
        if (!info.date) return { group: 1, at: 0 };
        return { group: 0, at: info.date.valueOf() };
      };
      sorted.sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        return ra.group !== rb.group ? ra.group - rb.group : ra.at - rb.at;
      });
    }
    return sorted;
  }, [baseJobs, jobTextIndex, searchText, jobTypeFilter, locationFilter, eligibleOnly, closingSoon, sortBy]);

  // Saved tab: keep expired saves visible in their own section instead of dropping them.
  const isExpiredJob = useCallback(
    (job) => isApplicationClosed(job.applicationDeadline) || job.isActive === false,
    []
  );
  // "Open to me" is the default view on the Drives tab: a role the college hasn't targeted at
  // this student's college/department/batch moves into a collapsed "Not open to you (N)" section
  // instead of sitting inline in the main, paginated list — the per-card reason (visibilityReason)
  // is unchanged and still renders inside that section's cards. The "Eligible only" facet chip
  // still works exactly as before (it empties this section rather than just collapsing it).
  const liveJobs = useMemo(
    () =>
      activeTab === "saved"
        ? filteredJobs.filter((j) => !isExpiredJob(j))
        : filteredJobs.filter((j) => j.isVisible !== false),
    [filteredJobs, activeTab, isExpiredJob]
  );
  const expiredSavedJobs = useMemo(
    () => (activeTab === "saved" ? filteredJobs.filter(isExpiredJob) : []),
    [filteredJobs, activeTab, isExpiredJob]
  );
  const notOpenJobs = useMemo(
    () => (activeTab === "saved" ? [] : filteredJobs.filter((j) => j.isVisible === false)),
    [filteredJobs, activeTab]
  );

  const totalRows = liveJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedJobs = useMemo(
    () => liveJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [liveJobs, safePage]
  );

  const handleNavigate = useCallback(
    (id) => {
      if (id == null) return;
      router.push(withReturnTo(`${jobsPath}/${id}`, router.asPath));
    },
    [router, jobsPath]
  );

  const isFiltered =
    Boolean(searchText) ||
    jobTypeFilter !== JOB_TYPE_FILTER_ALL ||
    locationFilter !== LOCATION_FILTER_ALL ||
    eligibleOnly ||
    closingSoon;

  const clearFilters = useCallback(() => {
    setSearchInput("");
    updateQuery({
      q: "",
      type: JOB_TYPE_FILTER_ALL,
      loc: LOCATION_FILTER_ALL,
      eligible: "0",
      soon: "0",
    });
  }, [updateQuery]);

  const filterSummary = useMemo(() => {
    const parts = [];
    if (searchText) parts.push(`“${searchText}”`);
    if (jobTypeFilter !== JOB_TYPE_FILTER_ALL) parts.push(jobTypeFilter);
    if (locationFilter !== LOCATION_FILTER_ALL) parts.push(locationFilter);
    if (eligibleOnly) parts.push("eligible only");
    if (closingSoon) parts.push("closing within 7 days");
    return parts.join(" · ");
  }, [searchText, jobTypeFilter, locationFilter, eligibleOnly, closingSoon]);

  const renderToolbar = () => (
    <div className="learn-jobs-toolbar">
      <div className="learn-jobs-toolbar__row">
        <Input
          id="jobs-search"
          className="learn-jobs-toolbar__search"
          placeholder="Search by title, company, location…"
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          prefix={<SearchOutlined aria-hidden="true" />}
          aria-label="Search drives by title, company, or location"
        />
        <label className="learn-jobs-toolbar__field">
          <span className="learn-jobs-toolbar__field-label">Sort</span>
          <Select
            className="learn-jobs-toolbar__select"
            value={sortBy}
            onChange={(val) => updateQuery({ sort: val })}
            options={SORT_OPTIONS}
            aria-label="Sort drives"
          />
        </label>
        <label className="learn-jobs-toolbar__field">
          <span className="learn-jobs-toolbar__field-label">Type</span>
          <Select
            className="learn-jobs-toolbar__select"
            value={jobTypeFilter}
            onChange={(val) => updateQuery({ type: val })}
            options={jobTypeOptions}
            aria-label="Filter by drive type"
          />
        </label>
        <label className="learn-jobs-toolbar__field">
          <span className="learn-jobs-toolbar__field-label">Location</span>
          <Select
            className="learn-jobs-toolbar__select"
            value={locationFilter}
            onChange={(val) => updateQuery({ loc: val })}
            options={locationOptions}
            aria-label="Filter by location"
          />
        </label>
      </div>
      <div className="learn-jobs-toolbar__facets">
        <button
          type="button"
          className="learn-jobs-facet"
          aria-pressed={eligibleOnly}
          onClick={() => updateQuery({ eligible: eligibleOnly ? "0" : "1" })}
        >
          Eligible only <span className="learn-jobs-facet__count">{eligibleCount}</span>
        </button>
        <button
          type="button"
          className="learn-jobs-facet"
          aria-pressed={closingSoon}
          onClick={() => updateQuery({ soon: closingSoon ? "0" : "1" })}
        >
          Closing in 7 days <span className="learn-jobs-facet__count">{closingSoonCount}</span>
        </button>
        {isFiltered && (
          <Button type="link" size="small" className="learn-jobs-facet__clear" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );

  const renderList = () => (
    <>
      {activeTab !== "saved" && pagedJobs.length === 0 && notOpenJobs.length > 0 && !isFiltered && (
        <p className="learn-jobs-empty__subtitle ln-lto-reg" data-testid="jobs.none-open">
          No drive is open to you right now. The drives below show why each one isn&apos;t.
        </p>
      )}
      <ul className="learn-jobs-list">
        {pagedJobs.map((job, index) => (
          <li key={job?.id ?? `job-${index}`} className="learn-jobs-list__item">
            <JobListItem
              job={job}
              index={(safePage - 1) * PAGE_SIZE + index}
              href={`${jobsPath}/${job?.id}`}
              isSaved={savedJobIds.has(job?.id)}
              onToggleSave={handleToggleSave}
              onNavigate={handleNavigate}
              saveError={saveErrors[job?.id]}
              saveDisabled={supportErrors.savedIds || saveInFlightRef.current.has(job?.id)}
              descriptionSnippet={jobTextIndex.get(job?.id)?.plain || ""}
              application={applicationsByJobId.get(Number(job?.id))}
            />
          </li>
        ))}
      </ul>

      {totalRows > PAGE_SIZE && (
        <nav className="learn-jobs-pagination" aria-label="Job list pages">
          <Pagination
            current={safePage}
            pageSize={PAGE_SIZE}
            total={totalRows}
            showSizeChanger={false}
            onChange={(page) => {
              updateQuery({ page: String(page) });
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          />
        </nav>
      )}

      {expiredSavedJobs.length > 0 && (
        <section className="learn-jobs-expired" aria-label="Expired saved jobs">
          <h3 className="learn-jobs-expired__title ln-lto-bold">
            Expired <span className="learn-jobs-expired__count">{expiredSavedJobs.length}</span>
          </h3>
          <p className="learn-jobs-expired__note ln-lto-reg">
            These saved roles have closed. They stay here until you unsave them.
          </p>
          <ul className="learn-jobs-list">
            {expiredSavedJobs.map((job, index) => (
              <li key={job?.id ?? `expired-${index}`} className="learn-jobs-list__item">
                <JobListItem
                  job={job}
                  index={index}
                  href={`${jobsPath}/${job?.id}`}
                  isSaved={savedJobIds.has(job?.id)}
                  onToggleSave={handleToggleSave}
                  onNavigate={handleNavigate}
                  saveError={saveErrors[job?.id]}
                  saveDisabled={supportErrors.savedIds || saveInFlightRef.current.has(job?.id)}
                  descriptionSnippet={jobTextIndex.get(job?.id)?.plain || ""}
                  application={applicationsByJobId.get(Number(job?.id))}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {notOpenJobs.length > 0 && (
        <section className="learn-jobs-not-open" aria-label="Not open to you">
          <button
            type="button"
            className="learn-jobs-not-open__toggle"
            aria-expanded={notOpenExpanded}
            aria-controls="learn-jobs-not-open-list"
            onClick={() => setNotOpenExpanded((v) => !v)}
          >
            {notOpenExpanded ? <DownOutlined aria-hidden="true" /> : <RightOutlined aria-hidden="true" />}
            <span>
              Not open to you <span className="learn-jobs-not-open__count">{notOpenJobs.length}</span>
            </span>
          </button>
          {notOpenExpanded && (
            <ul id="learn-jobs-not-open-list" className="learn-jobs-list">
              {notOpenJobs.map((job, index) => (
                <li key={job?.id ?? `not-open-${index}`} className="learn-jobs-list__item">
                  <JobListItem
                    job={job}
                    index={index}
                    href={`${jobsPath}/${job?.id}`}
                    isSaved={savedJobIds.has(job?.id)}
                    onToggleSave={handleToggleSave}
                    onNavigate={handleNavigate}
                    saveError={saveErrors[job?.id]}
                    saveDisabled={supportErrors.savedIds || saveInFlightRef.current.has(job?.id)}
                    descriptionSnippet={jobTextIndex.get(job?.id)?.plain || ""}
                    application={applicationsByJobId.get(Number(job?.id))}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );

  const renderBody = () => {
    if (loading && jobs.length === 0) {
      return (
        <div className="learn-jobs-list">
          {[1, 2, 3, 4, 5].map((i) => (
            <JobListSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (jobs.length === 0 && savedBaseJobs.length === 0) {
      return (
        <div className="learn-jobs-empty learn-jobs-empty--rich">
          <div className="learn-jobs-empty__illustration">
            <JobsEmptyIllustration />
          </div>
          <h4 className="learn-jobs-empty__title ln-lto-bold">No open jobs right now</h4>
          <p className="learn-jobs-empty__subtitle ln-lto-reg">
            New opportunities are added regularly. Check back soon or contact your placement cell.
          </p>
        </div>
      );
    }

    if (activeTab === "saved" && (supportErrors.savedIds || supportErrors.savedJobs)) {
      return (
        <div className="learn-jobs-error-card" role="alert">
          <Text className="learn-jobs-error-text ln-lto-reg">Your saved jobs could not be fully loaded. This is not an empty saved list.</Text>
          <Button type="primary" onClick={fetchJobs} className="learn-jobs-cta-btn">Retry saved jobs</Button>
        </div>
      );
    }

    if (activeTab === "saved" && baseJobs.length === 0) {
      return (
        <div className="learn-jobs-empty learn-jobs-empty--rich">
          <div className="learn-jobs-empty__illustration">
            <JobsEmptyIllustration />
          </div>
          <h4 className="learn-jobs-empty__title ln-lto-bold">No saved drives yet</h4>
          <p className="learn-jobs-empty__subtitle ln-lto-reg">
            Save drives from All Drives by tapping the heart. They will appear here.
          </p>
          <Button type="primary" className="learn-jobs-empty__cta" onClick={() => setTabAndUrl("all")}>
            Browse all jobs
          </Button>
        </div>
      );
    }

    if (filteredJobs.length === 0) {
      return (
        <div className="learn-jobs-empty learn-jobs-empty--rich">
          <div className="learn-jobs-empty__illustration">
            <JobsEmptyIllustration />
          </div>
          <h4 className="learn-jobs-empty__title ln-lto-bold">No jobs match {filterSummary || "these filters"}</h4>
          <p className="learn-jobs-empty__subtitle ln-lto-reg">
            Nothing in the {baseJobs.length} {baseJobs.length === 1 ? "role" : "roles"} on this tab matches. Try a broader
            search, or clear the filters to start again.
          </p>
          <div className="learn-jobs-empty__actions">
            <Button type="primary" className="learn-jobs-empty__cta" onClick={clearFilters}>
              Clear filters
            </Button>
            <Button
              className="learn-jobs-empty__cta"
              onClick={() => {
                setSearchInput("");
                updateQuery({
                  q: "",
                  type: JOB_TYPE_FILTER_ALL,
                  loc: LOCATION_FILTER_ALL,
                  eligible: "0",
                  soon: "0",
                  tab: "all",
                });
              }}
            >
              Show all {jobs.length} jobs
            </Button>
          </div>
        </div>
      );
    }

    return renderList();
  };

  // PageShell (the layout's shared frame — see src/components/Common/PageShell.jsx) already
  // provides the outer card; this used to wrap its own scroll-container > ln-module-card around
  // the same content a second time.
  if (fetchError && jobs.length === 0) {
    return (
      <div className="learn-placements-dashboard__body">
        <section className="learn-placements-dashboard__overview">
          <div className="learn-jobs-header">
            <div className="learn-jobs-header__left">
              <h2 className="learn-jobs-header__title ln-lto-bold">Drives</h2>
            </div>
          </div>
        </section>
        <div className="learn-jobs-error-card">
          <CloseCircleOutlined className="learn-jobs-error-icon" aria-hidden="true" />
          <Text className="learn-jobs-error-text ln-lto-reg">{fetchError}</Text>
          <Button type="primary" onClick={() => fetchJobs()} className="learn-jobs-cta-btn">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-placements-dashboard__body">
      <section className="learn-placements-dashboard__overview" aria-label="Drives overview">
            <div className="learn-jobs-header">
              <div className="learn-jobs-header__left">
                <h2 className="learn-jobs-header__title ln-lto-bold">Drives</h2>
                <p className="learn-jobs-header__metrics ln-lto-reg">
                  <span className="learn-jobs-metric">
                    <FileTextOutlined aria-hidden="true" /> {jobs.length} {jobs.length === 1 ? "drive" : "drives"}
                  </span>
                  {savedCount > 0 && (
                    <button
                      type="button"
                      className="learn-jobs-metric learn-jobs-metric--action"
                      onClick={() => setTabAndUrl("saved")}
                    >
                      <HeartOutlined aria-hidden="true" /> {savedCount} saved
                    </button>
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="learn-jobs-grid-section" aria-label="Job listings"
            aria-busy={loading ? "true" : undefined}>
            <div className="learn-jobs-section__tabs">
              <Tabs
                activeKey={activeTab}
                onChange={setTabAndUrl}
                items={[
                  { key: "all", label: "All drives" },
                  {
                    key: "saved",
                    label: (
                      <span className="learn-jobs-tab-saved">
                        Saved
                        {savedCount > 0 && <span className="learn-jobs-tab-badge">{savedCount}</span>}
                      </span>
                    ),
                  },
                ]}
                className="learn-jobs-tabs"
                size="middle"
              />
            </div>

            {renderToolbar()}

            {loading && jobs.length > 0 && (
              <RefreshStatus label="Refreshing drive listings…" />
            )}

            <p className="learn-jobs-results-info ln-lto-reg" aria-live="polite">
              {isFiltered
                ? `Showing ${filteredJobs.length} of ${baseJobs.length} drives`
                : `${baseJobs.length} ${baseJobs.length === 1 ? "drive" : "drives"}`}
            </p>

            {(supportErrors.savedIds || supportErrors.savedJobs || supportErrors.applications) && (
              <Alert
                className="learn-jobs-alert"
                type="warning"
                showIcon
                message="Some drive details could not be loaded"
                description={[
                  (supportErrors.savedIds || supportErrors.savedJobs) ? "Saved drives and heart icons may be incomplete." : null,
                  supportErrors.applications ? "Application-stage badges may be missing." : null,
                ].filter(Boolean).join(" ")}
                action={<Button size="small" onClick={fetchJobs}>Retry</Button>}
              />
            )}

            {fetchError && jobs.length > 0 && (
              <Alert
                className="learn-jobs-alert"
                type="warning"
                showIcon
                message="Couldn't refresh drive listings"
                description="Showing the last results we loaded."
                action={
                  <Button size="small" onClick={fetchJobs}>
                    Retry
                  </Button>
                }
              />
            )}

        <div className="learn-jobs-list-wrap">{renderBody()}</div>
      </section>
    </div>
  );
}
