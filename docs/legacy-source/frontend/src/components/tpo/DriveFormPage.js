import JdUpload from "@/components/tpo/JdUpload";
import CompanyPicker from "@/components/tpo/drive/CompanyPicker";
import InviteReviewer from "@/components/tpo/drive/InviteReviewer";
import { descriptionHtml, descriptionText, unescapeStoredHtml } from "@/utils/driveDescription";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Router, { useRouter } from "next/router";
import {
  Alert, Button, Card, Checkbox, Col, DatePicker, Divider, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Tag, Typography, message,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { dj, serverTime } from "@/components/tpo/dj";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { label } from "@/components/tpo/ui/labels";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getBatches } from "@/api/Services/BatchesService";
import { createDrive, getDrive, getDriveRounds, listDrives, publishDrive, updateDrive } from "@/api/Services/TpoService";
import { cloneDrive, getCgpaRule, getCompanies, getCompanyHistory, getEligibilityPreview, getStudentsTable, getWorkspaceApplicants } from "@/api/Services/TpoHubService";
import { ELIGIBILITY_PRESETS, cgpaAsPct, optionsFromStudents } from "./eligibilityPresets";
import useChoices from "@/hooks/useChoices";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const KINDS = [{ value: "TALK", label: "Talk" }, { value: "TEST", label: "Test" }, { value: "VENDOR_TEST", label: "Vendor test" }, { value: "GD", label: "Group discussion" }, { value: "INTERVIEW", label: "Interview" }];
const PRESETS = {
  "Talk, Test, Interview": [["TALK", "Company talk"], ["TEST", "Online test"], ["INTERVIEW", "Interview"]],
  "Test, Technical, HR": [["TEST", "Aptitude test"], ["INTERVIEW", "Technical interview"], ["INTERVIEW", "HR interview"]],
  "Test, GD, Interview": [["TEST", "Written test"], ["GD", "Group discussion"], ["INTERVIEW", "Interview"]],
};
const dt = (d) => serverTime(d); // UTC, as dj() reads it back (it used to send India time: the deadline moved 5h30m on every save)

// Thresholds must exactly match TpoDriveService.deriveCategory on the backend - this used to say
// >=10 Super-dream / >=6 Dream, disagreeing with the server's >=20 / >=10. A TPO could see one
// category while editing and a different one after the server saved it.
/** Derives Regular / Dream / Super-dream from the highest CTC, same thresholds the server uses. */
export function categoryFromCtc(options) {
  const max = Math.max(0, ...(options || []).map((o) => Number(o?.ctcLpa) || 0));
  return max >= 20 ? "SUPER_DREAM" : max >= 10 ? "DREAM" : "REGULAR";
}

/**
 * Create drive / Edit drive: one page that saves itself (TPO V1 - Locked.docx §4). Start from a company, a past drive or blank.
 * Mode, pay packages (CTC, split, joining bonus, stipend), the full eligibility set, category,
 * company portal, rounds, and a live "who is eligible" panel. Validation is light until Publish.
 */
// "Clone a past drive": what the copy is told about itself, kept for the new draft's page (it opens on a new address).
const CLONE_NOTE_KEY = (id) => `tpo-drive-cloned:${id}`;
// Drives a TPO can copy: their own drives, not a recruiter's request still waiting, sent back or declined.
const NOT_CLONABLE = ["REQUEST", "SENT_BACK", "REJECTED"];
/** "Closed · Sep 2026": enough to tell two drives of the same company and role apart. */
export const cloneOptionMeta = (d) => [label("drive", d.lifecycleStatus), dj(d.applicationDeadline || d.postedDate || d.createdAt).isValid()
  ? dj(d.applicationDeadline || d.postedDate || d.createdAt).format("MMM YYYY") : null].filter(Boolean).join(" · ");
/** The past drives to offer, newest first. */
export const clonableDrives = (drives) => (drives || []).filter((d) => !NOT_CLONABLE.includes(d.lifecycleStatus))
  .sort((a, b) => dj(b.postedDate || b.createdAt).valueOf() - dj(a.postedDate || a.createdAt).valueOf());

/** The pay category as people say it (the backend stores REGULAR / DREAM / SUPER_DREAM). */
const CATEGORY_LABEL = { REGULAR: "Regular", DREAM: "Dream", SUPER_DREAM: "Super dream" };

export default function DriveFormPage({ editId }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [jobId, setJobId] = useState(editId || null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [elig, setElig] = useState(null);
  const [eligError, setEligError] = useState(false);
  const [eligLoading, setEligLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [studentChoices, setChoices] = useState({ branches: [], years: [] });
  // Branches: the college's own list (one source) plus anything the students have that it does not.
  const shared = useChoices();
  const choices = useMemo(() => ({
    branches: [...new Set([...shared.branches.map((o) => String(o.value)), ...studentChoices.branches])].sort(),
    // The rule compares the student's passing year (a number), so only real passing years are offered; batch names are not years.
    years: shared.passingYears.map((o) => Number(o.value)).filter(Number.isFinite),
  }), [shared, studentChoices]);
  const [cgpaRule, setCgpaRule] = useState(null); // how a CGPA counts as a % (Settings > Placement rules)
  const minCgpa = Form.useWatch(["eligibility", "minCgpa"], form);
  const [batchOptions, setBatchOptions] = useState([]); // batches in placements, for "Batches" (replaces the season)
  const [pastDrives, setPastDrives] = useState([]);
  const [duplicate, setDuplicate] = useState(null);
  const [cloning, setCloning] = useState(false);
  const cloningRef = useRef(false);
  const [cloneNote, setCloneNote] = useState(null); // { sourceName, droppedBatches, droppedPassingYears, wasRecordedOutside, wasFromRecruiter }
  // "Company Memory": the picked company's own history at this college, surfaced without the TPO
  // having to go dig through old drives - fetched once, when they pick from "Start from", not on
  // every keystroke in the plain Company input.
  const [companyHistory, setCompanyHistory] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  // "Last saved by {name} at HH:MM DD MMM YYYY" (recruiter phase 1, N10), from the server after each save.
  const [lastSaved, setLastSaved] = useState(null); // { by, at }
  const [hasRecruiter, setHasRecruiter] = useState(false);
  const timer = useRef(null);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [supportErrors, setSupportErrors] = useState([]);
  const [supportRetry, setSupportRetry] = useState(0);
  const [livePrompt, setLivePrompt] = useState(null);
  const [liveImpactLoading, setLiveImpactLoading] = useState(false);
  const creating = useRef(false);
  const savingRef = useRef(false);
  const liveSaveRef = useRef(false);
  const liveImpactRef = useRef(false);
  const initializedEditIdRef = useRef(null);
  // BE-0037: an existing drive is read only until its own record has loaded. The form used to be live (and autosave) while
  // still blank, so a keystroke or browser autofill during a slow or failed load wrote a half-empty form over the drive.
  const [hydration, setHydration] = useState(editId ? "loading" : "ready"); // loading | ready | error
  const hydrationRef = useRef(editId ? "loading" : "ready");
  // The company the drive was saved with: an older drive recorded by name alone may keep it until someone changes it.
  const loadedCompanyRef = useRef(null);
  const setHydrated = (state) => { hydrationRef.current = state; setHydration(state); };
  const mode = Form.useWatch("driveMode", form);
  const roleOptions = Form.useWatch("roleOptions", form);
  const portal = Form.useWatch("requiresExternalRegistration", form);
  const categoryOverride = Form.useWatch("categoryOverride", form);
  const companyName = Form.useWatch("companyName", form);
  const jobTitle = Form.useWatch("jobTitle", form);
  const applicationDeadline = Form.useWatch("applicationDeadline", form);
  const rounds = Form.useWatch("rounds", form) || [];
  const recorded = Boolean(Form.useWatch("recordedOutside", form));
  const setupProgress = [
    Boolean(companyName?.trim() && jobTitle?.trim()?.length >= 3),
    Boolean(roleOptions?.length),
    Boolean(applicationDeadline) || recorded,
    Boolean(rounds.length),
  ].filter(Boolean).length;

  const jobType = Form.useWatch("jobType", form);
  // The college's job types (Settings > Job types). A drive keeps a type that was switched off or came from an older page.
  const jobTypeOptions = useMemo(() => (jobType && !shared.jobTypes.some((t) => t.value === jobType)
    ? [...shared.jobTypes, { value: jobType, label: `${jobType} (not in your list)` }] : shared.jobTypes), [shared.jobTypes, jobType]);
  const pickedType = shared.jobTypes.find((t) => t.value === jobType);
  const jobTypeNote = pickedType && pickedType.countsAsPlaced === false ? `Offers from ${jobType} drives do not count as placed.`
    : jobType === "Internship + full-time" ? "Counts as placed once the full-time offer is made." : undefined;
  // The description is HTML on the drive and plain text in this form (src/utils/driveDescription.js). Left untouched, the drive keeps
  // its own HTML (lists, bold from older pages); edited, the text becomes paragraphs.
  const loadedDescriptionRef = useRef("");
  const descriptionForSave = (text) => {
    const loaded = loadedDescriptionRef.current;
    if (loaded && (text || "") === (descriptionText(loaded) || "")) return loaded;
    return descriptionHtml(text);
  };
  const toFormValues = useCallback((job, rounds) => {
    const e = job.eligibilityJson || {};
    loadedDescriptionRef.current = unescapeStoredHtml(job.jobDescription) || "";
    return {
      companyName: job.companyName, companyId: job.companyId || null, jobTitle: job.jobTitle, jobDescription: descriptionText(loadedDescriptionRef.current), jdUrl: job.jdUrl, location: job.location, driveMode: job.driveMode || "ON_CAMPUS",
      recordedOutside: Boolean(job.recordedOutside), jobType: job.jobType || undefined, // a type switched off later (or an older one) stays on the drive
      hostCollegeName: job.hostCollegeName, reportingAt: job.reportingAt ? dj(job.reportingAt) : null, travelNote: job.travelNote, externalApplyUrl: job.externalApplyUrl,
      requiresExternalRegistration: Boolean(job.requiresExternalRegistration), externalPortalName: job.externalPortalName, externalPortalUrl: job.externalPortalUrl,
      applicationDeadline: job.applicationDeadline ? dj(job.applicationDeadline) : null,
      categoryOverride: Boolean(job.categoryOverrideReason), category: job.category, categoryOverrideReason: job.categoryOverrideReason,
      roleOptions: (Array.isArray(job.roleOptionsJson) && job.roleOptionsJson.length ? job.roleOptionsJson : [{ name: "Default" }]).map(({ bond, bondNone, bondMonths, bondAmount, ...o }) => o), // the bond was removed (8 Oct 2026)
      eligibility: { ...e, branches: e.branches || [], passingYears: e.passingYears || [], batchIds: e.batchIds || [], verifiedMarksOnly: Boolean(e.verifiedMarksOnly) },
      wantedSkills: Array.isArray(job.candidatePreferences?.preferredSkills) ? job.candidatePreferences.preferredSkills : [],
      rounds: (rounds || []).map((r) => ({ ...r, scheduledDate: r.scheduledDate ? dj(r.scheduledDate) : null, resultsDue: r.resultsDue ? dj(r.resultsDue) : null })),
    };
  }, []);

  // Load an existing drive (edit) and the lists used by "Start from".
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cRes, dRes, sRes, bRes, rRes] = await Promise.all([fetchWithErrorHandling(getCompanies()), fetchWithErrorHandling(listDrives()), fetchWithErrorHandling(getStudentsTable()),
        fetchWithErrorHandling(getBatches()), fetchWithErrorHandling(getCgpaRule())]);
      if (cancelled) return;
      const failed = [];
      if (rRes.success) setCgpaRule(rRes.data); else failed.push("placement CGPA rule");
      if (sRes.success) setChoices(optionsFromStudents(sRes.data?.students)); else failed.push("student eligibility choices");
      if (bRes.success) setBatchOptions((bRes.data?.batches || []).filter((b) => b.state !== "FINISHED").map((b) => ({ value: b.batchId, label: `${b.name} · ${Number(b.eligible) || 0} eligible` }))); else failed.push("batches");
      if (cRes.success && Array.isArray(cRes.data)) setCompanies(cRes.data); else failed.push("companies");
      if (dRes.success && Array.isArray(dRes.data)) setPastDrives(dRes.data); else failed.push("past drives");
      const initKey = editId || "new";
      if (initializedEditIdRef.current !== initKey) {
        if (editId) {
          const [j, r] = await Promise.all([fetchWithErrorHandling(getDrive(editId)), fetchWithErrorHandling(getDriveRounds(editId))]);
          if (cancelled) return;
          if (!j.success) { setHydrated("error"); message.error(errorText(j, "Drive not found")); return; }
          if (!r.success || !Array.isArray(r.data)) failed.push("drive rounds");
          setLifecycle(j.data.lifecycleStatus);
          if (j.data.lastSavedAt) setLastSaved({ by: j.data.lastSavedByName, at: j.data.lastSavedAt });
          setHasRecruiter(Boolean(j.data.recruiterId));
          loadedCompanyRef.current = j.data?.companyName || null;
          form.setFieldsValue(toFormValues(j.data, r.success && Array.isArray(r.data) ? r.data : []));
          setHydrated("ready");
          const el = await fetchWithErrorHandling(getEligibilityPreview(editId));
          if (cancelled) return;
          if (el.success && el.data) {
            setElig(el.data);
            setEligError(false);
          } else {
            setElig(null);
            setEligError(true);
          }
        } else {
          form.setFieldsValue({ driveMode: "ON_CAMPUS", roleOptions: [{ name: "Default" }], eligibility: { branches: [], passingYears: [], batchIds: [] }, rounds: [], requiresExternalRegistration: false,
            ...(typeof router.query.company === "string" && router.query.company ? { companyName: router.query.company } : {}) });
        }
        initializedEditIdRef.current = initKey;
      }
      setSupportErrors(failed);
    })();
    return () => { cancelled = true; };
  }, [editId, form, toFormValues, supportRetry]);

  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };
  const markClean = () => {
    dirtyRef.current = false;
    setDirty(false);
  };

  useEffect(() => {
    if (!dirty || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (!dirtyRef.current) return;
      if (window.confirm("You have drive changes that have not been saved yet. Leave without saving them?")) {
        dirtyRef.current = false;
        return;
      }
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved drive changes.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [dirty]);

    const buildBody = () => {
    const v = form.getFieldsValue(true);
    const opts = (v.roleOptions || []).map((o) => ({
      name: o.name || "Default", ctcLpa: o.ctcLpa, fixedLpa: o.fixedLpa, variableLpa: o.variableLpa, joiningBonusLpa: o.joiningBonusLpa,
      stipendPerMonth: o.stipendPerMonth, stipendMonths: o.stipendMonths,
    }));
    const e = v.eligibility || {};
    return {
      companyName: v.companyName, companyId: v.companyId || null, jobTitle: v.jobTitle, jobDescription: descriptionForSave(v.jobDescription), jdUrl: v.jdUrl || "", location: v.location, driveMode: v.driveMode || "ON_CAMPUS",
      hostCollegeName: v.driveMode === "POOL" ? v.hostCollegeName : null, reportingAt: v.driveMode === "POOL" ? dt(v.reportingAt) : null, travelNote: v.driveMode === "POOL" ? v.travelNote : null,
      externalApplyUrl: v.driveMode === "OFF_CAMPUS" ? v.externalApplyUrl : null,
      // A drive recorded outside the LMS has no application window or student registration: never save a stale one.
      requiresExternalRegistration: !v.recordedOutside && Boolean(v.requiresExternalRegistration),
      externalPortalName: !v.recordedOutside && v.requiresExternalRegistration ? v.externalPortalName : null,
      externalPortalUrl: !v.recordedOutside && v.requiresExternalRegistration ? v.externalPortalUrl : null,
      applicationDeadline: v.recordedOutside ? null : dt(v.applicationDeadline),
      // Chosen, never assumed: it decides whether offers count as placed (intern drives used to default to Full-time).
      jobType: v.jobType || undefined,
      recordedOutside: Boolean(v.recordedOutside),
      category: v.categoryOverride ? v.category : null, categoryOverrideReason: v.categoryOverride ? v.categoryOverrideReason : null,
      roleOptions: opts,
      // Backlog and education-gap rules are gone (no source in the profile): drop them from older drives when they are saved.
      // The skills the company wants: only the Applicants tab's skill match uses them; they never decide who can apply.
      wantedSkills: (v.wantedSkills || []).map((x) => String(x).trim()).filter(Boolean),
      eligibility: { ...e, minPctThroughout: e.minPctThroughout || undefined, minCgpa: e.minCgpa || undefined, verifiedMarksOnly: Boolean(e.verifiedMarksOnly), maxActiveBacklogs: undefined, maxPastBacklogs: undefined, maxGapYears: undefined },
      // Rounds are only sent while the draft is being created; afterwards they are edited on the drive page so autosave never duplicates them.
      ...(jobId ? {} : { rounds: (v.rounds || []).filter((r) => r?.name && r?.kind).map((r) => ({ kind: r.kind, name: r.name, mode: r.mode || "ON_CAMPUS", scheduledDate: dt(r.scheduledDate), venue: r.venue, meetingUrl: r.meetingUrl, whatToBring: r.whatToBring, platform: r.platform, testLink: r.testLink, durationMinutes: r.durationMinutes, resultsDue: dt(r.resultsDue) })) }),
    };
  };

  const refreshElig = useCallback(async (id) => {
    if (!id) return;
    setEligLoading(true);
    setEligError(false);
    const res = await fetchWithErrorHandling(getEligibilityPreview(id));
    if (res.success) {
      setElig(res.data);
    } else {
      // Eligibility counts influence who the TPO believes a drive will reach. Never leave a
      // previous preview on screen after a refresh fails; stale counts look authoritative.
      setElig(null);
      setEligError(true);
    }
    setEligLoading(false);
  }, []);

  const save = useCallback(async () => {
    if (savingRef.current) return false;
    if (hydrationRef.current !== "ready") return false; // never write an existing drive before it has loaded
    const v = form.getFieldsValue(true);
    if (!v.companyName?.trim() || !v.jobTitle || v.jobTitle.trim().length < 3) return false; // nothing to save yet
    if (creating.current) return false;
    savingRef.current = true;
    setSaveState("saving");
    try {
      let res;
      if (jobId) res = await fetchWithErrorHandling(updateDrive(jobId, buildBody()));
      else { creating.current = true; res = await fetchWithErrorHandling(createDrive(buildBody())); creating.current = false; }
      if (!res.success) { setSaveState("error"); message.error(errorText(res, "Could not save")); return false; }
      if (!jobId) {
        setJobId(res.data.id);
        setLifecycle(res.data.lifecycleStatus);
        const r = await fetchWithErrorHandling(getDriveRounds(res.data.id));
        form.setFieldsValue({ rounds: (r.data || []).map((x) => ({ ...x, scheduledDate: x.scheduledDate ? dj(x.scheduledDate) : null, resultsDue: x.resultsDue ? dj(x.resultsDue) : null })) });
        markClean();
        router.replace(`/tpo/drives/${res.data.id}/edit`, undefined, { shallow: true });
      }
      setSaveState("saved");
      if (res.data?.lastSavedAt) setLastSaved({ by: res.data.lastSavedByName, at: res.data.lastSavedAt });
      markClean();
      refreshElig(jobId || res.data.id);
      return res.data?.id || jobId || editId;
    } catch (e) { creating.current = false; setSaveState("error"); return false; }
    finally { savingRef.current = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, form, refreshElig, router]);

  const isLive = lifecycle === "PUBLISHED";
  // A closed, cancelled or declined drive is history: nothing here saves (the server refuses it too).
  const frozen = ["CLOSED", "CANCELLED", "REJECTED"].includes(lifecycle);
  const scheduleSave = () => {
    clearTimeout(timer.current);
    if (frozen || hydrationRef.current !== "ready") return;
    markDirty();
    // A live drive never saves itself: changing it can affect people who already applied, so the TPO confirms first.
    if (isLive) { setSaveState("idle"); return; }
    setSaveState("idle");
    timer.current = setTimeout(save, 1200);
  };
  const askLiveSave = async () => {
    if (liveImpactRef.current) return;
    liveImpactRef.current = true;
    setLiveImpactLoading(true);
    try {
      const res = await fetchWithErrorHandling(getWorkspaceApplicants(jobId));
      if (!res.success || !Array.isArray(res.data)) {
        // This count is the consequence preview for editing a live drive. A failed lookup is
        // unknown impact, never "0 applicants".
        message.error(errorText(res, "Could not verify how many applicants this change affects. Retry before saving."));
        return;
      }
      setLivePrompt({ count: res.data.filter((a) => !["REJECTED", "WITHDRAWN"].includes(a.stage)).length });
    } finally {
      liveImpactRef.current = false;
      setLiveImpactLoading(false);
    }
  };
  const saveLive = async (notify) => {
    if (liveSaveRef.current) return;
    liveSaveRef.current = true;
    setLivePrompt(null);
    setSaveState("saving");
    try {
      const res = await fetchWithErrorHandling(updateDrive(jobId, { ...buildBody(), notifyApplicants: notify }));
      if (!res.success) { setSaveState("error"); message.error(errorText(res, "Could not save")); return; }
      setSaveState("saved"); markClean(); refreshElig(jobId);
    } finally {
      liveSaveRef.current = false;
    }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!editId || typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(CLONE_NOTE_KEY(editId));
      setCloneNote(raw ? JSON.parse(raw) : null);
    } catch (_) { setCloneNote(null); }
  }, [editId]);
  const dismissCloneNote = () => {
    try { window.sessionStorage.removeItem(CLONE_NOTE_KEY(editId)); } catch (_) { /* nothing kept */ }
    setCloneNote(null);
  };

  // Duplicate warning: same company and role already in this college.
  useEffect(() => {
    const v = form.getFieldsValue(true);
    const dup = pastDrives.find((d) => d.id !== jobId && d.companyName?.toLowerCase() === v.companyName?.trim().toLowerCase() && d.jobTitle?.toLowerCase() === v.jobTitle?.trim().toLowerCase() && !["CLOSED", "CANCELLED", "REJECTED"].includes(d.lifecycleStatus));
    setDuplicate(dup || null);
  }, [saveState, pastDrives, jobId, form]);

  // Cloning makes a new draft at once, so it asks first and says what comes across. It used to create the draft the moment a
  // drive was picked (a wrong pick left a stray draft), and a half-typed form could still autosave a second draft behind it.
  const runClone = async (source) => {
    if (cloningRef.current) return;
    cloningRef.current = true;
    setCloning(true);
    clearTimeout(timer.current);
    try {
      const res = await fetchWithErrorHandling(cloneDrive(source.id));
      if (!res.success) { message.error(errorText(res, "Could not copy this drive")); return; }
      const d = res.data || {};
      try {
        window.sessionStorage.setItem(CLONE_NOTE_KEY(d.id), JSON.stringify({
          sourceName: d.sourceName || `${source.companyName} · ${source.jobTitle}`, droppedBatches: d.droppedBatches || 0,
          droppedPassingYears: d.droppedPassingYears || [], wasRecordedOutside: Boolean(d.wasRecordedOutside), wasFromRecruiter: Boolean(d.wasFromRecruiter),
        }));
      } catch (_) { /* the note is a courtesy */ }
      markClean(); // what was typed here is replaced by the copy, as the confirmation said
      message.success("Copy made. Set the dates, check it and publish.");
      router.replace(`/tpo/drives/${d.id}/edit`);
    } finally {
      cloningRef.current = false;
      setCloning(false);
    }
  };
  const startFrom = async (kind, value) => {
    if (kind === "clone") {
      const source = pastDrives.find((d) => d.id === value);
      if (!source || cloningRef.current || savingRef.current || creating.current) return;
      const v = form.getFieldsValue(true);
      const typed = Boolean(v.companyName?.trim() || v.jobTitle?.trim() || v.jobDescription?.trim());
      Modal.confirm({
        title: `Copy ${source.companyName} · ${source.jobTitle}?`,
        width: 520,
        content: (
          <div className="tpo-drive-form__clone-confirm" data-testid="drive.clone-confirm">
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>{cloneOptionMeta(source)}</Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 6 }}>A new draft is made with its company, role, description, pay, eligibility, wanted skills and rounds.</Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 6 }}>Not copied: the deadline, round dates and links, applicants, results and offers. Batches that have finished and past passing years are left out.</Typography.Paragraph>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>Nothing is published or sent to students.{typed ? " What you typed on this page is replaced by the copy." : ""}</Typography.Paragraph>
          </div>
        ),
        okText: "Make a copy",
        cancelText: "Cancel",
        onOk: () => runClone(source),
      });
    } else if (kind === "company") {
      form.setFieldsValue({ companyName: value });
      setCompanyHistory(null);
      if (value) {
        const res = await fetchWithErrorHandling(getCompanyHistory(value));
        if (res.success) setCompanyHistory(res.data);
      }
    }
  };

  const publish = async () => {
    const v = form.getFieldsValue(true);
    const problems = []; // [field name path, message]
    if (!v.companyName?.trim()) problems.push([["companyName"], "Add the company"]);
    else if (!v.companyId && v.companyName?.trim() !== loadedCompanyRef.current) problems.push([["companyName"], "Pick the company from the list, or choose \"Add other\""]);
    if (!v.jobTitle || v.jobTitle.trim().length < 3) problems.push([["jobTitle"], "Add the role (at least 3 characters)"]);
    if (!v.jobType) problems.push([["jobType"], "Choose the job type: it decides whether offers count as placed"]);
    if (!(v.roleOptions || []).some((o) => o?.ctcLpa != null || o?.stipendPerMonth != null)) problems.push([["roleOptions", 0, "ctcLpa"], "Set the pay (CTC or stipend) for at least one role"]);
    // A drive recorded after it happened outside needs neither: nobody applies to it.
    if (!v.recordedOutside) {
      if (!v.applicationDeadline) problems.push([["applicationDeadline"], "Students need to know when applications close"]);
      else if (dj(v.applicationDeadline).isBefore(dj())) problems.push([["applicationDeadline"], "This deadline has already passed"]);
      if (v.driveMode === "OFF_CAMPUS" && !v.externalApplyUrl) problems.push([["externalApplyUrl"], "Add the company application link"]);
      else if (v.driveMode === "OFF_CAMPUS" && !/^https?:\/\/\S+\.\S+/i.test(String(v.externalApplyUrl).trim())) problems.push([["externalApplyUrl"], "The link must start with https:// (copy it from the company's site)"]);
    }
    if (problems.length) {
      form.setFields(problems.map(([name, msg]) => ({ name, errors: [msg] })));
      form.scrollToField(problems[0][0], { behavior: "smooth", block: "center" });
      message.error(problems.length === 1 ? "One thing is missing before publishing" : `${problems.length} things are missing before publishing`);
      return;
    }
    const savedId = await save();
    if (!savedId) {
      message.error("The drive is not fully saved yet. Fix the save error and retry publishing.");
      return;
    }
    // Use the id returned by this save. On first creation React has not painted setJobId yet, so
    // reading jobId here would still be null and would navigate to an invalid /drives/undefined URL.
    router.push(`/tpo/drives/${savedId}?publish=1`);
  };

  const autoCategory = useMemo(() => categoryFromCtc(roleOptions), [roleOptions]);
  const readOnly = lifecycle && !["DRAFT", "REQUEST", "SENT_BACK"].includes(lifecycle);

  return (
    <div className="scroll-container tpo-drive-form" data-testid="tpo.drive.form">
      <Modal open={Boolean(livePrompt)} title="Save changes to a live drive?" onCancel={() => setLivePrompt(null)} footer={livePrompt?.count ? [
        <Button key="c" onClick={() => setLivePrompt(null)}>Cancel</Button>,
        <Button key="q" onClick={() => saveLive(false)}>Save without telling anyone</Button>,
        <Button key="n" type="primary" onClick={() => saveLive(true)}>Save and notify {livePrompt.count === 1 ? "1 applicant" : `${livePrompt.count} applicants`}</Button>,
      ] : [
        <Button key="c" onClick={() => setLivePrompt(null)}>Cancel</Button>,
        <Button key="s" type="primary" onClick={() => saveLive(false)}>Save changes</Button>,
      ]}>
        <Typography.Paragraph>{livePrompt?.count ? `${livePrompt.count === 1 ? "1 person has" : `${livePrompt.count} people have`} applied. If this change matters to them, notify them.` : "Nobody has applied yet, so there is nobody to tell."}</Typography.Paragraph>
        <Typography.Paragraph type="secondary">On a drive a recruiter asked for, the company owns the CTC, pay packages and location, and you cannot loosen eligibility. You can tighten it.</Typography.Paragraph>
      </Modal>
      <PageShell>
        <ListingPageHeader
          className="tpo-drive-form__header"
          title={editId || jobId ? "Edit drive" : "Create drive"}
          subtitle={
            <div className="tpo-drive-form__save-state">
              <span className={`tpo-drive-form__save-dot tpo-drive-form__save-dot--${saveState}`} />
              <Typography.Text type="secondary">{saveState === "saving" ? "Saving changes…" : saveState === "error" ? "Changes not saved" : lastSaved ? `Last saved${lastSaved.by ? ` by ${lastSaved.by}` : ""} at ${dj(lastSaved.at).format("HH:mm D MMM YYYY")}` : saveState === "saved" ? "All changes saved" : isLive ? "Changes wait for confirmation" : "Not saved yet"}</Typography.Text>
            </div>
          }
          rightContent={
            <Space className="tpo-drive-form__header-actions" wrap>
              <Button onClick={() => router.push(jobId ? `/tpo/drives/${jobId}` : "/tpo/drives")}>{jobId ? "Open drive page" : "Back to drives"}</Button>
              {frozen ? null : isLive
                ? <Button type="primary" disabled={!dirty} loading={liveImpactLoading} onClick={askLiveSave}>Save changes</Button>
                : <>
                  {jobId && !hasRecruiter && hydration === "ready" && (
                    <InviteReviewer jobId={jobId} companyName={companyName} defaultEmail={form.getFieldValue("inviteRecruiterEmail")} onDone={() => setHasRecruiter(true)} />
                  )}
                  <Button type="primary" disabled={!jobId || hydration !== "ready"} onClick={publish}>Publish</Button>
                </>}
            </Space>
          }
        />
        {supportErrors.length > 0 && (
          <Alert
            className="tpo-drive-form__alert"
            type="warning"
            showIcon
            message="Some drive setup data could not be loaded"
            description={`Unavailable: ${supportErrors.join(", ")}. Existing form values are kept, but related pickers/history may be incomplete until you retry.`}
            action={<Button size="small" onClick={() => setSupportRetry((value) => value + 1)}>Retry setup data</Button>}
          />
        )}
                {hydration === "loading" && <Alert className="tpo-drive-form__alert" type="info" showIcon data-testid="drive.form-loading" message="Loading this drive. You can edit it once it has loaded." />}
                {hydration === "error" && (
                  <Alert className="tpo-drive-form__alert" type="error" showIcon data-testid="drive.form-load-error"
                    message="This drive could not be loaded, so it can't be edited here."
                    action={<Button size="small" onClick={() => { initializedEditIdRef.current = null; setHydrated("loading"); setSupportRetry((v) => v + 1); }}>Retry</Button>} />
                )}
                {frozen ? <Alert className="tpo-drive-form__alert" type="info" showIcon data-testid="drive.form-frozen"
                  message={`This drive is ${label("drive", lifecycle).toLowerCase()}: nothing here can be changed.`}
                  description="To run it again, open Create drive and pick it under Clone a past drive." />
                  : readOnly && <Alert className="tpo-drive-form__alert" type="warning" showIcon message="This drive is live. Nothing saves by itself. Press Save changes and choose whether to tell the people who already applied." />}
        {cloneNote && (
          <Alert className="tpo-drive-form__alert" type="info" showIcon closable onClose={dismissCloneNote} data-testid="drive.clone-note"
            message={`Copied from ${cloneNote.sourceName}`}
            description={(
              <ul className="tpo-drive-form__clone-list">
                <li>The deadline and round dates were cleared: set them before you publish.</li>
                {cloneNote.droppedBatches > 0 && <li>{cloneNote.droppedBatches === 1 ? "1 batch has" : `${cloneNote.droppedBatches} batches have`} finished placements and {cloneNote.droppedBatches === 1 ? "was" : "were"} taken out of eligibility.</li>}
                {cloneNote.droppedPassingYears?.length > 0 && <li>Past passing year{cloneNote.droppedPassingYears.length === 1 ? "" : "s"} {cloneNote.droppedPassingYears.join(", ")} {cloneNote.droppedPassingYears.length === 1 ? "was" : "were"} taken out of eligibility.</li>}
                {cloneNote.wasRecordedOutside && <li>The original was recorded after it happened outside. This copy is a normal drive students apply to.</li>}
                {cloneNote.wasFromRecruiter && <li>The original came from a recruiter. This copy is yours: the recruiter is not linked to it.</li>}
              </ul>
            )} />
        )}
        {duplicate && <Alert className="tpo-drive-form__alert" type="warning" showIcon message={`A drive for ${duplicate.companyName} · ${duplicate.jobTitle} already exists (${label("drive", duplicate.lifecycleStatus)}).`} action={<Button size="small" onClick={() => router.push(`/tpo/drives/${duplicate.id}`)}>Open it</Button>} />}

        <div className="tpo-drive-form__intro">
          <div>
            <Typography.Text className="tpo-drive-form__eyebrow">Drive setup</Typography.Text>
            <Typography.Title level={4}>{isLive ? "Update the live opportunity carefully" : "Build the opportunity students will see"}</Typography.Title>
            <Typography.Text type="secondary">Move from company and role details into pay, eligibility and rounds. The review rail stays visible while you work.</Typography.Text>
          </div>
          <div className="tpo-drive-form__progress">
            <strong>{setupProgress}/4</strong>
            <span>steps ready</span>
          </div>
        </div>

        <Row className="tpo-drive-form__layout" gutter={[18, 18]}>
          <Col xs={24} lg={16}>
            <Form form={form} layout="vertical" onValuesChange={scheduleSave} disabled={frozen || hydration !== "ready"}>
              {!jobId && (
                <Card className="tpo-drive-form__section tpo-drive-form__start" size="small" title="Start from">
                  <Space wrap>
                    <Select placeholder="A company" showSearch style={{ width: 220 }} onChange={(v) => startFrom("company", v)} options={companies.map((c) => ({ value: c.name, label: c.name }))} allowClear />
                    <Select placeholder="Clone a past drive" showSearch style={{ width: 300 }} value={null} loading={cloning} disabled={cloning}
                      onChange={(v) => startFrom("clone", v)} data-testid="drive.clone-select" popupMatchSelectWidth={380}
                      notFoundContent="No past drives to copy yet"
                      filterOption={(input, o) => o.searchText.includes(input.trim().toLowerCase())}
                      options={clonableDrives(pastDrives).map((d) => ({ value: d.id, title: `${d.companyName} · ${d.jobTitle}`,
                        searchText: `${d.companyName} ${d.jobTitle} ${cloneOptionMeta(d)}`.toLowerCase(),
                        label: <span className="tpo-drive-form__clone-option"><span>{d.companyName} · {d.jobTitle}</span><Typography.Text type="secondary">{cloneOptionMeta(d)}</Typography.Text></span> }))} />
                    <Typography.Text type="secondary">or just fill it in below</Typography.Text>
                  </Space>
                  {companyHistory && companyHistory.driveCount > 0 && (
                    <Alert style={{ marginTop: 12 }} type="info" showIcon message={`${companyHistory.driveCount} past drive${companyHistory.driveCount === 1 ? "" : "s"} here · ${companyHistory.hired} hired${companyHistory.lastDriveAt ? ` · last drive ${dj(companyHistory.lastDriveAt).format("MMM YYYY")}` : ""}`}
                      description={companyHistory.recentRoles?.length > 0 && (
                        <Space direction="vertical" size={0}>
                          {companyHistory.recentRoles.map((r, i) => (
                            <Typography.Text key={i} type="secondary">{r.jobTitle}{r.ctcRange ? ` · ${r.ctcRange}` : ""}{r.createdAt ? ` · ${dj(r.createdAt).format("YYYY")}` : ""}</Typography.Text>
                          ))}
                        </Space>
                      )} />
                  )}
                </Card>
              )}
              <Card className="tpo-drive-form__section" size="small" title="The drive">
                <Form.Item name="companyId" hidden><Input /></Form.Item>
                <Form.Item name="companyName" label="Company" rules={[{ required: true, message: "Add the company" }]}><CompanyPicker form={form} /></Form.Item>
                <Form.Item name="jobTitle" label="Role" rules={[{ required: true, min: 3, message: "At least 3 characters" }]}><Input placeholder="e.g. Systems Engineer" /></Form.Item>
                <Form.Item name="jobDescription" label="Description"><Input.TextArea rows={3} /></Form.Item>
                <Form.Item name="jdUrl" label="Job description file" extra="Optional. PDF or Word, up to 5 MB. Students see it as a link."><JdUpload /></Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item name="jobType" label="Job type" extra={jobTypeNote}>
                      <Select options={jobTypeOptions} placeholder="Choose: Full-time, Internship…" data-testid="drive-form.job-type" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}><Form.Item name="driveMode" label="Mode" extra={{ ON_CAMPUS: "Students apply here; rounds at your college or online.", POOL: "Held at another college; your students travel there.", OFF_CAMPUS: "Students apply on the company's site; you track them here." }[mode || "ON_CAMPUS"]}><Select options={[{ value: "ON_CAMPUS", label: "On campus" }, { value: "POOL", label: "Pool (at another college)" }, { value: "OFF_CAMPUS", label: "Off campus (company's site)" }]} /></Form.Item></Col>
                  <Col xs={24} md={8}><Form.Item name="location" label="Location"><Input /></Form.Item></Col>
                  <Col xs={24} md={8}><Form.Item name="applicationDeadline" label="Application deadline"><DatePicker showTime={{ format: "h:mm A", defaultValue: dj().hour(23).minute(59).second(0) }} format="D MMM YYYY, h:mm A" style={{ width: "100%" }} disabledDate={(d) => d && d.isBefore(dj().startOf("day"))} /></Form.Item></Col>
                </Row>
                {mode === "POOL" && (
                  <Row gutter={12}>
                    <Col xs={24} md={8}><Form.Item name="hostCollegeName" label="Host college"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="reportingAt" label="Reporting time"><DatePicker showTime style={{ width: "100%" }} /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="travelNote" label="Travel note"><Input /></Form.Item></Col>
                  </Row>
                )}
                {mode === "OFF_CAMPUS" && <Form.Item name="externalApplyUrl" label="Company application link"><Input placeholder="https://" /></Form.Item>}
                {mode !== "ON_CAMPUS" && <Typography.Text type="secondary">This drive skips slot scheduling but still uses Applicants, Results and Offers.</Typography.Text>}
                <Form.Item name="recordedOutside" valuePropName="checked" style={{ marginTop: 8, marginBottom: 4 }} extra={recorded ? "No student is told when you publish it. Afterwards add the students who took part and mark their results." : undefined}>
                  <Checkbox data-testid="drive-form.recorded">This drive already happened outside the platform (record it here)</Checkbox>
                </Form.Item>
                {!recorded && <Form.Item name="requiresExternalRegistration" valuePropName="checked" style={{ marginTop: 8 }}><Checkbox>Students also register on the company&apos;s portal</Checkbox></Form.Item>}
                {portal && (
                  <Row gutter={12}>
                    <Col xs={24} md={12}><Form.Item name="externalPortalName" label="Portal name"><Input placeholder="e.g. TCS NextStep" /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item name="externalPortalUrl" label="Portal link"><Input placeholder="https://" /></Form.Item></Col>
                  </Row>
                )}
              </Card>

              <Card className="tpo-drive-form__section" size="small" title="Pay packages">
                <Form.List name="roleOptions">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((f) => (
                        <div className="tpo-drive-form__role-option" key={f.key}>
                          <Row gutter={12}>
                            <Col xs={24} md={8}><Form.Item name={[f.name, "name"]} label="Package name" tooltip="Most drives have one package. Add another when the company hires for tracks with different pay, like TCS Ninja and Digital. Students see each by this name."><Input placeholder="e.g. Digital, Ninja" /></Form.Item></Col>
                            <Col xs={12} md={4}><Form.Item name={[f.name, "ctcLpa"]} label="CTC (LPA)"><InputNumber min={0} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={12} md={4}><Form.Item name={[f.name, "fixedLpa"]} label="Fixed"><InputNumber min={0} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={12} md={4}><Form.Item name={[f.name, "variableLpa"]} label="Variable"><InputNumber min={0} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={12} md={4}><Form.Item name={[f.name, "joiningBonusLpa"]} label="Joining bonus"><InputNumber min={0} step={0.5} style={{ width: "100%" }} /></Form.Item></Col>
                          </Row>
                          <Row gutter={12}>
                            <Col xs={12} md={4}><Form.Item name={[f.name, "stipendPerMonth"]} label="Stipend / month (internship)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={12} md={4}><Form.Item name={[f.name, "stipendMonths"]} label="Duration (months)"><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
                          </Row>
                          {fields.length > 1 && <Button size="small" danger icon={<MinusCircleOutlined />} onClick={() => remove(f.name)}>Remove package</Button>}
                        </div>
                      ))}
                      <Button icon={<PlusOutlined />} onClick={() => add({})}>Add another package</Button>
                    </>
                  )}
                </Form.List>
                <Divider />
                <Space wrap>
                  <Typography.Text>Category: <Tag color="blue">{CATEGORY_LABEL[categoryOverride ? form.getFieldValue("category") : autoCategory] || (categoryOverride ? form.getFieldValue("category") : autoCategory) || "-"}</Tag>{categoryOverride ? "" : " worked out from the CTC"}</Typography.Text>
                  <Form.Item name="categoryOverride" valuePropName="checked" noStyle><Checkbox>Override</Checkbox></Form.Item>
                </Space>
                {categoryOverride && (
                  <Row gutter={12} style={{ marginTop: 8 }}>
                    <Col xs={24} md={8}><Form.Item name="category" label="Category" rules={[{ required: true }]}><Select options={[{ value: "REGULAR", label: "Regular" }, { value: "DREAM", label: "Dream" }, { value: "SUPER_DREAM", label: "Super-dream" }]} /></Form.Item></Col>
                    <Col xs={24} md={16}><Form.Item name="categoryOverrideReason" label="Why" rules={[{ required: true, message: "A reason is required" }]}><Input /></Form.Item></Col>
                  </Row>
                )}
              </Card>

              <Card className="tpo-drive-form__section" size="small" title="Eligibility">
                <Typography.Paragraph type="secondary">
                  Marks are the ones on the Students page: verified first, else the student&apos;s own entry, flagged &quot;not verified&quot;. A student with no mark
                  for a rule stays eligible, flagged &quot;Not provided&quot;, unless you ask for verified marks only.
                </Typography.Paragraph>
                <Space wrap size={6} style={{ marginBottom: 12 }} aria-label="Eligibility presets">
                  {ELIGIBILITY_PRESETS.map((pr) => (
                    <Button key={pr.key} size="small" onClick={() => { form.setFieldsValue({ eligibility: { ...(form.getFieldValue("eligibility") || {}), ...pr.values } }); scheduleSave(); }}>{pr.label}</Button>
                  ))}
                </Space>
                <Row gutter={12}>
                  <Col xs={24}><Form.Item name={["eligibility", "batchIds"]} label="Batches" extra="Only eligible students of these batches are told and can apply. Leave empty for every batch in placements.">
                    <Select mode="multiple" allowClear options={batchOptions} placeholder="Every batch in placements" optionFilterProp="label" data-testid="drive-form.batches" />
                  </Form.Item></Col>
                  {/* Picked from the college's own list, so "CES" for "CSE" cannot silently shut a branch out. Typing only when there is no list. */}
                  <Col xs={24} md={12}><Form.Item name={["eligibility", "branches"]} label="Branches"
                    extra={choices.branches.length ? undefined : "No branch list yet (Academic Setup). Type each branch exactly as it is on the students."}>
                    <Select mode={choices.branches.length ? "multiple" : "tags"} allowClear tokenSeparators={[","]} options={choices.branches.map((b) => ({ value: b, label: b }))} placeholder="All branches (pick to limit)" optionFilterProp="label" />
                  </Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name={["eligibility", "passingYears"]} label="Passing year"><Select mode={choices.years.length ? "multiple" : "tags"} allowClear tokenSeparators={[","]} options={choices.years.map((y) => ({ value: y, label: y }))} placeholder="All years (pick to limit)" /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "minCgpa"]} label="Minimum CGPA"
                    extra={minCgpa ? `Degrees graded in %: at least ${cgpaAsPct(minCgpa, cgpaRule?.rule)}% (${(cgpaRule?.options || []).find((o) => o.value === cgpaRule?.rule)?.label || "CGPA x 9.5"})` : undefined}>
                    <InputNumber min={0} max={10} step={0.1} style={{ width: "100%" }} /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "minPctThroughout"]} label="Percentage throughout" tooltip="The lowest of 10th, 12th (or Diploma) and UG"><InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "tenthMinPct"]} label="10th minimum"><InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "twelfthMinPct"]} label="12th minimum"><InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "diplomaMinPct"]} label="Diploma minimum" tooltip="For students with a Diploma and no 12th (lateral entry)"><InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "ugMinPct"]} label="UG minimum"><InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "pgMinPct"]} label="PG minimum" tooltip="Only for students who have a PG"><InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" /></Form.Item></Col>
                  {/* The profile's own gender list; a student who has not given one is not eligible for a diversity drive. */}
                  <Col xs={12} md={6}><Form.Item name={["eligibility", "gender"]} label="Gender (diversity drives only)"><Select allowClear options={shared.genders.filter((g) => g.value !== "Prefer not to say")} /></Form.Item></Col>
                  <Col xs={24}><Form.Item name={["eligibility", "verifiedMarksOnly"]} valuePropName="checked" style={{ marginBottom: 0 }}
                    extra="On: marks the college has not verified, or missing marks, do not count. Students with unverified marks are not eligible.">
                    <Checkbox data-testid="drive-form.verified-only">Only students whose marks are verified</Checkbox>
                  </Form.Item></Col>
                </Row>
              </Card>

              <Card className="tpo-drive-form__section" size="small" title="Skills the company wants">
                <Form.Item name="wantedSkills" style={{ marginBottom: 0 }}
                  extra="Type a skill and press Enter. Applicants get a skill match: how many of these they list on their profile. It never decides who can apply.">
                  <Select mode="tags" tokenSeparators={[","]} open={false} placeholder="e.g. Java, SQL, React" data-testid="drive-form.wanted-skills" />
                </Form.Item>
              </Card>

              <Card className="tpo-drive-form__section" size="small" title="Rounds">
                {!jobId && <Space wrap style={{ marginBottom: 8 }}>{Object.entries(PRESETS).map(([label, rs]) => <Button key={label} size="small" onClick={() => form.setFieldsValue({ rounds: rs.map(([kind, name]) => ({ kind, name, mode: "ON_CAMPUS" })) })}>{label}</Button>)}</Space>}
                <Form.List name="rounds">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((f) => {
                        const isSaved = Boolean(form.getFieldValue(["rounds", f.name, "id"]));
                        return (
                          <Space key={f.key} align="start" wrap style={{ display: "flex", marginBottom: 8 }}>
                            <Form.Item name={[f.name, "kind"]} noStyle><Select style={{ width: 160 }} options={KINDS} disabled={isSaved && Boolean(jobId)} /></Form.Item>
                            <Form.Item name={[f.name, "name"]} noStyle><Input style={{ width: 200 }} placeholder="Round name" disabled={isSaved && Boolean(jobId)} /></Form.Item>
                            <Form.Item name={[f.name, "mode"]} noStyle><Select style={{ width: 130 }} options={[{ value: "ON_CAMPUS", label: "On campus" }, { value: "VIRTUAL", label: "Virtual" }]} disabled={isSaved && Boolean(jobId)} /></Form.Item>
                            {!isSaved && <Button type="text" size="small" icon={<MinusCircleOutlined />} aria-label="Remove this round" onClick={() => remove(f.name)} />}
                          </Space>
                        );
                      })}
                      {!jobId && <Button icon={<PlusOutlined />} onClick={() => add({ kind: "TEST", mode: "ON_CAMPUS" })}>Add a round</Button>}
                      {jobId && <Typography.Paragraph type="secondary" style={{ margin: 0 }}>Dates, venues, slots and results for each round are managed on the drive page, under Rounds.</Typography.Paragraph>}
                    </>
                  )}
                </Form.List>
              </Card>
            </Form>
          </Col>
          <Col xs={24} lg={8}>
            <div className="tpo-drive-form__review-rail">
              <Card className="tpo-drive-form__review" title="Setup review">
                <div className="tpo-drive-form__checklist">
                  <div className={companyName?.trim() && jobTitle?.trim()?.length >= 3 ? "is-complete" : ""}><span>1</span><div><strong>Company & role</strong><small>{companyName?.trim() && jobTitle?.trim()?.length >= 3 ? `${companyName} · ${jobTitle}` : "Add the company and role"}</small></div></div>
                  <div className={roleOptions?.length ? "is-complete" : ""}><span>2</span><div><strong>Pay packages</strong><small>{roleOptions?.length ? `${roleOptions.length} package${roleOptions.length === 1 ? "" : "s"} · ${categoryOverride ? form.getFieldValue("category") || autoCategory : autoCategory}` : "Add at least one role option"}</small></div></div>
                  <div className={applicationDeadline || recorded ? "is-complete" : ""}><span>3</span><div><strong>Application deadline</strong><small>{recorded ? "Not needed for a recorded drive" : applicationDeadline ? applicationDeadline.format("D MMM, h:mm A") : "Required before publishing"}</small></div></div>
                  <div className={rounds.length ? "is-complete" : ""}><span>4</span><div><strong>Rounds</strong><small>{rounds.length ? `${rounds.length} round${rounds.length === 1 ? "" : "s"} planned` : "Optional now; can be managed later"}</small></div></div>
                </div>
              </Card>

              <Card className="tpo-drive-form__reach" title="Who this reaches">
                {!jobId && <Typography.Text type="secondary">Add the company and role and this fills in.</Typography.Text>}
                {eligLoading && <Typography.Text type="secondary">Updating eligibility preview…</Typography.Text>}
                {eligError && jobId && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="Eligibility preview unavailable"
                    description="We couldn't verify who this drive currently reaches. Old counts are hidden so they aren't mistaken for current eligibility."
                    action={<Button size="small" onClick={() => refreshElig(jobId)}>Retry</Button>}
                  />
                )}
                {elig && !eligLoading && (
                  <>
                    <Row className="tpo-drive-form__reach-stats" gutter={8}>
                      <Col span={12}><Statistic title="Eligible" value={elig.eligible} /></Col>
                      <Col span={12}><Statistic title="Excluded" value={elig.excluded} /></Col>
                    </Row>
                    {elig.notYetRegistered > 0 && <Typography.Paragraph type="secondary" className="tpo-drive-form__reach-note">{elig.notYetRegistered} have not registered for placements yet; they count as eligible until they do.</Typography.Paragraph>}
                    {Object.keys(elig.excludedByRule || {}).length > 0 && (
                      <div className="tpo-drive-form__why" data-testid="drive-form.why-out">
                        <Typography.Text strong>Kept out by</Typography.Text>
                        {Object.entries(elig.excludedByRule).sort((a, b) => b[1] - a[1]).map(([rule, n]) => <div key={rule}><span>{rule}</span><strong>{n}</strong></div>)}
                      </div>
                    )}
                    {(elig.eligibleOnMissing > 0 || elig.eligibleOnUnverified > 0) && (
                      <Typography.Paragraph type="secondary" className="tpo-drive-form__reach-note" data-testid="drive-form.in-on-missing">
                        {[elig.eligibleOnUnverified > 0 && `${elig.eligibleOnUnverified} are in on marks not verified yet`, elig.eligibleOnMissing > 0 && `${elig.eligibleOnMissing} are in because a mark is missing`].filter(Boolean).join("; ")}.
                        {" "}Tick &quot;Only students whose marks are verified&quot; to leave them out.
                      </Typography.Paragraph>
                    )}
                    <Divider />
                    <div className="tpo-drive-form__branches">
                      {Object.entries(elig.eligibleByBranch || {}).map(([b, n]) => <div key={b}><Tag>{b}</Tag><strong>{n}</strong></div>)}
                    </div>
                  </>
                )}
                <Divider />
                <Typography.Text type="secondary">Students will see the role, pay, mode, deadline and eligibility. Publishing asks you to confirm who is told.</Typography.Text>
              </Card>
            </div>
          </Col>
        </Row>
      </PageShell>
    </div>
  );
}
