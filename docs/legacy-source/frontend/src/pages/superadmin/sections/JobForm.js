import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { Form, Input, InputNumber, Select, AutoComplete, Button, message, Space, DatePicker, Alert, Modal, Typography, Tooltip, Row, Col } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useChoices from "@/hooks/useChoices";
import { parsePlacementUtcDateTime, parsePlacementCalendarDate } from "@/utils/placementDateTime";
import {
  createAdminJob,
  updateAdminJob,
  getOrganizations,
  getColleges,
  getDepartments,
  getPrograms,
  getBatches,
  getClasses,
  getDepartmentsByCollege,
  getProgramsByCollege,
  getBatchesByCollege,
  getClassesByCollege,
  fetchWithErrorHandling,
  getAdminCompanies,
} from "@/api/Services/AdminService";

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const stripHtml = (html) => (typeof html === "string" ? html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "");

const jobDescriptionValidator = (_, value) => {
  if (!value || stripHtml(value).length === 0) {
    return Promise.reject(new Error("Please enter job description"));
  }
  return Promise.resolve();
};

const MAX_CUSTOM_RULES = 20;
const MAX_IMPORTANT_DATES = 20;
let ruleIdCounter = 0;
const makeRuleId = () => `rule-${++ruleIdCounter}-${Date.now()}`;

const toLocalDayjs = (raw) => {
  const parsed = parsePlacementUtcDateTime(raw);
  return parsed ? dayjs(parsed.valueOf()) : null;
};
const toCalendarDayjs = (raw) => {
  const parsed = parsePlacementCalendarDate(raw);
  return parsed ? dayjs(parsed.valueOf()) : null;
};

const JobForm = forwardRef(function JobForm({ job, duplicateFrom, organizationId: propOrganizationId, collegeId: propCollegeId, onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  // Job types: the college's list (Settings > Job types), the one the TPO drive form uses; it decides whether offers count as placed.
  const { jobTypes: jobTypeChoices } = useChoices();
  const currentJobType = Form.useWatch("jobType", form);
  const jobTypeOptions = currentJobType && !jobTypeChoices.some((t) => t.value === currentJobType)
    ? [...jobTypeChoices, { value: currentJobType, label: `${currentJobType} (not in the college's list)` }] : jobTypeChoices;
  const [loading, setLoading] = useState(false);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyError, setHierarchyError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  // BE-0111: an existing drive whose saved details failed to prefill can't be saved from this form (fields would be lost).
  const editBlocked = Boolean(job) && Boolean(loadError);
  const [saveError, setSaveError] = useState(null);
  // True until both fetchHierarchyData() and loadJobData() have resolved on mount. While true,
  // the whole form is disabled (see <Form disabled={initialLoading}>) so an admin who starts
  // typing before the async prefill lands can't have their edit silently clobbered when
  // form.setFieldsValue(...)/setCustomRules(...) run afterwards.
  const [initialLoading, setInitialLoading] = useState(true);

  // Watched form values for reactive disabled logic
  const watchedOrgId = Form.useWatch("organizationId", form);
  const watchedCollegeId = Form.useWatch("targetCollegeId", form);
  const watchedDeptId = Form.useWatch("targetDepartmentId", form);
  const watchedProgId = Form.useWatch("targetProgramId", form);
  const watchedBatchId = Form.useWatch("targetBatchId", form);
  const watchedCompanyName = Form.useWatch("companyName", form);
  const watchedCompanyId = Form.useWatch("companyId", form);

  const [organizations, setOrganizations] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [classes, setClasses] = useState([]);

  const [filteredColleges, setFilteredColleges] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [customRules, setCustomRules] = useState([{ id: makeRuleId(), label: "", value: "" }]);

  const hierarchyDataRef = useRef({ programs: [], batches: [], classes: [] });
  const mountedRef = useRef(true);
  // Snapshot of the deadlines as loaded from the job at form-open time — used so the
  // "cannot be in the past" validators only fire when the admin actually changed the
  // value, not on every submit of an already-expired drive being edited for other reasons.
  const originalDeadlinesRef = useRef({ applicationDeadline: null, assessmentDeadline: null });
  // Snapshot of customRules as loaded/initialized — customRules lives outside the antd Form
  // (plain useState), so form.isFieldsTouched() can't see edits to it. We compare against this
  // snapshot to detect dirt and fold that into the Cancel/unsaved-changes guard below.
  const originalCustomRulesRef = useRef([{ label: "", value: "" }]);
  const normalizeCustomRules = (rules) => rules.map((r) => ({ label: r.label || "", value: r.value || "" }));

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const isCollegeScoped = propCollegeId != null && propCollegeId > 0;
  const isSuperAdminMode = !propOrganizationId && !isCollegeScoped;

  // Companies the admin has already created — lets them pick a recruiter they've used before
  // instead of retyping the same name/logo for every new drive. College-scoped only for now
  // (Companies management doesn't yet have an org-scoped/superadmin equivalent).
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    if (!isCollegeScoped || !propCollegeId) return;
    let cancelled = false;
    getAdminCompanies(propCollegeId)
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.status === "success") setCompanies(Array.isArray(res.data.data) ? res.data.data : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isCollegeScoped, propCollegeId]);

  const safeExtract = (result) => {
    if (!result?.success) return [];
    const raw = result.data;
    return Array.isArray(raw) ? raw : (raw?.data ? (Array.isArray(raw.data) ? raw.data : []) : []);
  };

  const fetchHierarchyData = useCallback(async () => {
    setHierarchyLoading(true);
    setHierarchyError(null);
    try {
      if (isSuperAdminMode) {
        const [orgResult, collegeResult] = await Promise.all([
          fetchWithErrorHandling(getOrganizations()),
          fetchWithErrorHandling(getColleges()),
        ]);
        if (!mountedRef.current) return;
        if (orgResult.success) setOrganizations(safeExtract(orgResult).length ? safeExtract(orgResult) : (Array.isArray(orgResult.data) ? orgResult.data : []));
        if (collegeResult.success) setColleges(safeExtract(collegeResult).length ? safeExtract(collegeResult) : (Array.isArray(collegeResult.data) ? collegeResult.data : []));
      }

      if (isCollegeScoped && propCollegeId) {
        const [deptResult, progResult, batchResult, classResult] = await Promise.all([
          fetchWithErrorHandling(getDepartmentsByCollege(propCollegeId)),
          fetchWithErrorHandling(getProgramsByCollege(propCollegeId)),
          fetchWithErrorHandling(getBatchesByCollege(propCollegeId)),
          fetchWithErrorHandling(getClassesByCollege(propCollegeId)),
        ]);
        if (!mountedRef.current) return;
        const depts = safeExtract(deptResult);
        const progs = safeExtract(progResult);
        const bats = safeExtract(batchResult);
        const cls = safeExtract(classResult);
        if (deptResult.success) setFilteredDepartments(depts);
        if (progResult.success) { setPrograms(progs); setFilteredPrograms(progs); }
        if (batchResult.success) { setBatches(bats); setFilteredBatches(bats); }
        if (classResult.success) { setClasses(cls); setFilteredClasses(cls); }
        hierarchyDataRef.current = { programs: progs, batches: bats, classes: cls };
        if (!deptResult.success || !progResult.success || !batchResult.success || !classResult.success) {
          setHierarchyError("Some dropdown data failed to load.");
        }
        return;
      }

      if (!isSuperAdminMode && !isCollegeScoped) {
        const [deptResult, progResult, batchResult, classResult] = await Promise.all([
          fetchWithErrorHandling(getDepartments()),
          fetchWithErrorHandling(getPrograms()),
          fetchWithErrorHandling(getBatches()),
          fetchWithErrorHandling(getClasses()),
        ]);
        if (!mountedRef.current) return;
        const depts = safeExtract(deptResult);
        const progs = safeExtract(progResult);
        const bats = safeExtract(batchResult);
        const cls = safeExtract(classResult);
        // Set each independently (not all-or-nothing)
        if (deptResult.success) setDepartments(depts);
        if (progResult.success) setPrograms(progs);
        if (batchResult.success) setBatches(bats);
        if (classResult.success) setClasses(cls);
        hierarchyDataRef.current = { programs: progs, batches: bats, classes: cls };
        if (!deptResult.success || !progResult.success || !batchResult.success || !classResult.success) {
          setHierarchyError("Some dropdown data failed to load.");
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        setHierarchyError("Failed to load dropdown data. You can still fill in the form.");
      }
    } finally {
      if (mountedRef.current) setHierarchyLoading(false);
    }
  }, [isSuperAdminMode, isCollegeScoped, propCollegeId]);

  const loadJobData = useCallback(() => {
    // duplicateFrom prefills the same fields as editing (job) but leaves the `job` prop itself
    // null, so handleSubmit below still takes the create path — a "new drive with these fields
    // already filled in" rather than an edit of the source drive.
    const prefillSource = job || duplicateFrom;
    if (!prefillSource) return;
    setLoadError(null);
    try {
      const prefs = prefillSource.candidatePreferences || prefillSource.eligibilityRules || {};
      const importantDatesRaw = prefillSource.importantDates || prefillSource.important_dates;
      const rawList = Array.isArray(importantDatesRaw) ? importantDatesRaw : [];
      const appDeadlineFromList = rawList.find(
        (d) => String(d?.label ?? "").trim().toLowerCase() === "application deadline"
      );
      const applicationDeadlineValue = job
        ? (prefillSource.applicationDeadline
          ? toLocalDayjs(prefillSource.applicationDeadline)
          : appDeadlineFromList?.date
            ? toLocalDayjs(appDeadlineFromList.date)
            : null)
        : null; // duplicating: never carry over the source drive's own deadline
      const otherDates = rawList
        .filter((d) => String(d?.label ?? "").trim().toLowerCase() !== "application deadline")
        .map((d) => ({ label: d.label ?? "", date: d.date ? toCalendarDayjs(d.date) : null }));
      if (otherDates.length === 0) otherDates.push({ label: "", date: null });

      const formValues = {
        jobTitle: job ? prefillSource.jobTitle : (prefillSource.jobTitle ? `${prefillSource.jobTitle} (Copy)` : ""),
        companyName: prefillSource.companyName,
        companyId: prefillSource.companyId ?? null,
        jobDescription: prefillSource.jobDescription,
        jobResponsibilities: prefillSource.jobResponsibilities,
        jobType: prefillSource.jobType,
        location: prefillSource.location,
        ctcRange: prefillSource.ctcRange,
        visibilityType: prefillSource.visibilityType || "INTERNAL_ONLY",
        applicationDeadline: applicationDeadlineValue,
        importantDates: otherDates,
        targetDepartmentId: prefillSource.targetDepartmentId,
        targetProgramId: prefillSource.targetProgramId,
        targetBatchId: prefillSource.targetBatchId,
        targetClassId: prefillSource.targetClassId,
        degree: prefs.preferredDegree ?? prefs.degree,
        specialization: prefs.preferredSpecialization ?? prefs.specialization,
        graduationYear: prefs.preferredGraduationYear ?? prefs.graduationYear,
        minGpa: prefs.preferredGpa ?? prefs.minGpa,
        cityPreference: prefs.preferredCity ?? prefs.cityPreference,
        assessmentUrl: job ? (prefillSource.assessmentUrl ?? "") : "",
        assessmentDeadline: job && prefillSource.assessmentDeadline ? toLocalDayjs(prefillSource.assessmentDeadline) : null,
      };
      // Populate org/college for super admin edit mode
      if (isSuperAdminMode) {
        formValues.organizationId = prefillSource.organizationId ?? undefined;
        formValues.targetCollegeId = prefillSource.collegeId ?? prefillSource.targetCollegeId ?? undefined;
      }
      form.setFieldsValue(formValues);
      originalDeadlinesRef.current = {
        applicationDeadline: applicationDeadlineValue ? applicationDeadlineValue.valueOf() : null,
        assessmentDeadline: formValues.assessmentDeadline ? formValues.assessmentDeadline.valueOf() : null,
      };

      if (prefs.customRules && Array.isArray(prefs.customRules) && prefs.customRules.length > 0) {
        const loadedRules = prefs.customRules.map((r) => ({ id: makeRuleId(), label: r.label || "", value: r.value || "" }));
        setCustomRules(loadedRules);
        originalCustomRulesRef.current = normalizeCustomRules(loadedRules);
      } else {
        const defaultRules = [{ id: makeRuleId(), label: "", value: "" }];
        setCustomRules(defaultRules);
        originalCustomRulesRef.current = normalizeCustomRules(defaultRules);
      }

      // Use ref to filter from the freshly-loaded data (not stale React state)
      const refData = hierarchyDataRef.current;
      if (prefillSource.targetDepartmentId && refData.programs.length > 0) {
        const fp = refData.programs.filter(p => (p.dept_id ?? p.deptId) === prefillSource.targetDepartmentId);
        setFilteredPrograms(fp);
      }
      if (prefillSource.targetProgramId && refData.batches.length > 0) {
        const fb = refData.batches.filter(b => (b.programId ?? b.program_id) === prefillSource.targetProgramId);
        setFilteredBatches(fb);
      }
      if (prefillSource.targetBatchId && refData.classes.length > 0) {
        const fc = refData.classes.filter(c => (c.batch_id ?? c.batchId) === prefillSource.targetBatchId);
        setFilteredClasses(fc);
      }
    } catch (error) {
      // Prefill failed — the form would otherwise render blank with no indication that the
      // admin is not looking at the job's actual saved values, rather than a fresh form.
      setLoadError("Failed to load this drive's existing details. The form below may be incomplete — please review carefully before saving, or cancel and retry.");
    }
  }, [job, duplicateFrom, form, isSuperAdminMode]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await fetchHierarchyData();
      if (cancelled || !mountedRef.current) return;
      if (job || duplicateFrom) {
        loadJobData();
      } else {
        form.resetFields();
        form.setFieldsValue({ applicationDeadline: null, assessmentDeadline: null, importantDates: [{ label: "", date: null }] });
        if (isCollegeScoped && propCollegeId) {
          form.setFieldsValue({ targetCollegeId: propCollegeId });
        }
        const defaultRules = [{ id: makeRuleId(), label: "", value: "" }];
        setCustomRules(defaultRules);
        originalCustomRulesRef.current = normalizeCustomRules(defaultRules);
      }
      if (!cancelled && mountedRef.current) setInitialLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [job, duplicateFrom, form, propCollegeId, isCollegeScoped, fetchHierarchyData, loadJobData]);

  // Shared dirty check — used by the Cancel button, the beforeunload guard, and (via the
  // imperative handle below) by DriveSubNav so switching sub-nav tabs also warns about
  // unsaved changes instead of only the Cancel button catching it.
  const isDirty = useCallback(() => {
    const customRulesDirty = JSON.stringify(normalizeCustomRules(customRules)) !== JSON.stringify(originalCustomRulesRef.current);
    return form.isFieldsTouched() || customRulesDirty;
  }, [form, customRules]);

  useImperativeHandle(ref, () => ({ isDirty }), [isDirty]);

  // Covers browser refresh / tab close / navigating to a different origin — none of which any
  // in-app "unsaved changes" confirm dialog can intercept.
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Re-filter colleges when org changes (super admin)
  useEffect(() => {
    if (!isSuperAdminMode || !watchedOrgId || colleges.length === 0) {
      if (isSuperAdminMode && !watchedOrgId) setFilteredColleges([]);
      return;
    }
    const filtered = colleges.filter(c =>
      (c.organizationId ?? c.organization_id ?? c.orgId) === watchedOrgId
    );
    setFilteredColleges(filtered);
  }, [watchedOrgId, colleges, isSuperAdminMode]);

  const handleOrganizationChange = (orgId) => {
    form.setFieldsValue({
      targetCollegeId: undefined,
      targetDepartmentId: undefined,
      targetProgramId: undefined,
      targetBatchId: undefined,
      targetClassId: undefined,
    });
    setFilteredDepartments([]);
    setFilteredPrograms([]);
    setFilteredBatches([]);
    setFilteredClasses([]);
  };

  const handleCollegeChange = async (collegeId) => {
    form.setFieldsValue({
      targetDepartmentId: undefined,
      targetProgramId: undefined,
      targetBatchId: undefined,
      targetClassId: undefined,
    });
    setFilteredPrograms([]);
    setFilteredBatches([]);
    setFilteredClasses([]);

    if (!collegeId) {
      setFilteredDepartments([]);
      return;
    }
    // Rapid re-selection guard: only apply the results below if targetCollegeId still equals
    // the id we kicked this call off for by the time the responses land — otherwise a slow
    // earlier response can stomp a faster later one's dropdown data.
    const requestedCollegeId = collegeId;
    try {
      const [deptResult, progResult, batchResult, classResult] = await Promise.all([
        fetchWithErrorHandling(getDepartmentsByCollege(collegeId)),
        fetchWithErrorHandling(getProgramsByCollege(collegeId)),
        fetchWithErrorHandling(getBatchesByCollege(collegeId)),
        fetchWithErrorHandling(getClassesByCollege(collegeId)),
      ]);
      if (!mountedRef.current) return;
      if (form.getFieldValue("targetCollegeId") !== requestedCollegeId) return;
      const depts = safeExtract(deptResult);
      const progs = safeExtract(progResult);
      const bats = safeExtract(batchResult);
      const cls = safeExtract(classResult);
      setFilteredDepartments(depts);
      setPrograms(progs);
      setBatches(bats);
      setClasses(cls);
      hierarchyDataRef.current = { programs: progs, batches: bats, classes: cls };
    } catch {
      if (!mountedRef.current) return;
      if (form.getFieldValue("targetCollegeId") !== requestedCollegeId) return;
      setFilteredDepartments([]);
    }
  };

  const handleDepartmentChange = (departmentId) => {
    const src = hierarchyDataRef.current.programs.length > 0 ? hierarchyDataRef.current.programs : programs;
    const filtered = src.filter(p => (p.dept_id ?? p.deptId) === departmentId);
    setFilteredPrograms(filtered);
    form.setFieldsValue({ targetProgramId: undefined, targetBatchId: undefined, targetClassId: undefined });
    setFilteredBatches([]);
    setFilteredClasses([]);
  };

  const handleProgramChange = (programId) => {
    const src = hierarchyDataRef.current.batches.length > 0 ? hierarchyDataRef.current.batches : batches;
    const filtered = src.filter(b => (b.programId ?? b.program_id) === programId);
    setFilteredBatches(filtered);
    form.setFieldsValue({ targetBatchId: undefined, targetClassId: undefined });
    setFilteredClasses([]);
  };

  const handleBatchChange = (batchId) => {
    const src = hierarchyDataRef.current.classes.length > 0 ? hierarchyDataRef.current.classes : classes;
    const filtered = src.filter(c => (c.batch_id ?? c.batchId) === batchId);
    setFilteredClasses(filtered);
    form.setFieldsValue({ targetClassId: undefined });
  };

  // Guards the narrow double-submit window between a button click and `loading` actually being
  // set (which only happens once inside handleSubmit, after validateFields resolves) — without
  // this, two rapid clicks can both pass validation and both fire the submit handler.
  const submittingRef = useRef(false);
  const submitGuarded = (asDraft) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    form.validateFields()
      .then((v) => handleSubmit(v, asDraft))
      .catch(() => {})
      .finally(() => { submittingRef.current = false; });
  };

  /** @param {boolean} [asDraft] true=save as draft, false=publish, undefined=preserve current state (update only) */
  const handleSubmit = async (values, asDraft) => {
    if (editBlocked) return; // BE-0111 (the form is disabled too; this covers a programmatic submit)
    setSaveError(null);
    setLoading(true);
    try {
      const trim = (v) => (typeof v === "string" ? v.trim() : v);
      const candidatePreferences = {};
      if (trim(values.degree)) candidatePreferences.preferredDegree = trim(values.degree);
      if (trim(values.specialization)) candidatePreferences.preferredSpecialization = trim(values.specialization);
      if (trim(values.graduationYear)) candidatePreferences.preferredGraduationYear = trim(values.graduationYear);
      if (values.minGpa != null && values.minGpa !== "") {
        const gpa = typeof values.minGpa === "number" ? values.minGpa : parseFloat(values.minGpa);
        if (!Number.isNaN(gpa)) candidatePreferences.preferredGpa = gpa;
      }
      if (trim(values.cityPreference)) candidatePreferences.preferredCity = trim(values.cityPreference);
      const customRulesFiltered = customRules.filter((r) => (r.label || "").trim() && (r.value || "").trim());
      if (customRulesFiltered.length > 0) {
        candidatePreferences.customRules = customRulesFiltered.map((r) => ({
          label: (r.label || "").trim(),
          value: (r.value || "").trim(),
        }));
      }

      const applicationDeadlineEntry =
        values.applicationDeadline
          ? { label: "Application deadline", date: dayjs(values.applicationDeadline).toISOString() }
          : null;

      const customDatesPayload = (values.importantDates || [])
        .filter((d) => {
          const label = String(d?.label ?? "").trim().toLowerCase();
          if (label === "application deadline") return false;
          return (d.label && trim(d.label)) || d.date;
        })
        .map((d) => ({
          label: trim(d.label) || "Important date",
          // Custom important dates are civil dates; keep the selected day instead of UTC-shifting it.\n          date: d.date ? dayjs(d.date).format("YYYY-MM-DD") : null,
        }))
        .filter((d) => d.date);

      const importantDatesPayload = [
        ...(applicationDeadlineEntry ? [applicationDeadlineEntry] : []),
        ...customDatesPayload,
      ];

      const jobData = {
        jobTitle: trim(values.jobTitle),
        companyName: trim(values.companyName),
        companyId: values.companyId ?? null,
        jobDescription: trim(values.jobDescription),
        jobResponsibilities: trim(values.jobResponsibilities) || null,
        jobType: values.jobType,
        location: trim(values.location),
        ctcRange: trim(values.ctcRange) || null,
        visibilityType: values.visibilityType || "INTERNAL_ONLY",
        importantDates: importantDatesPayload.length > 0 ? importantDatesPayload : null,
        candidatePreferences: Object.keys(candidatePreferences).length > 0 ? candidatePreferences : null,
        targetDepartmentId: values.targetDepartmentId || null,
        targetProgramId: values.targetProgramId || null,
        targetBatchId: values.targetBatchId || null,
        targetClassId: values.targetClassId || null,
        collegeId: propCollegeId ?? values.targetCollegeId ?? null,
        assessmentUrl: trim(values.assessmentUrl) || null,
        assessmentDeadline: values.assessmentDeadline ? dayjs(values.assessmentDeadline).toISOString() : null,
        // Echoes back the version this form was loaded with so the backend can detect a
        // concurrent edit (another admin saving in between) and reject with a conflict instead
        // of silently overwriting their change with these stale field values.
        version: job?.version ?? null,
      };
      // 10.1 / 21.2.7: Draft state - on create always set; on update only when explicitly publishing/unpublishing
      if (typeof asDraft === "boolean") {
        jobData.isDraft = asDraft;
        jobData.isActive = !asDraft;
      }

      let response;
      if (isCollegeScoped && propCollegeId) {
        if (job) {
          response = await updateAdminJob(job.id, jobData, propCollegeId);
        } else {
          response = await createAdminJob(jobData, propCollegeId);
        }
      } else if (values.targetCollegeId) {
        if (job) {
          response = await updateAdminJob(job.id, jobData, values.targetCollegeId);
        } else {
          response = await createAdminJob(jobData, values.targetCollegeId);
        }
      } else {
        setSaveError("Please select a college to create the job under.");
        setLoading(false);
        return;
      }

      if (response?.data?.status === "success") {
        const msg =
          typeof asDraft === "boolean"
            ? (asDraft ? "Job saved as draft" : "Job published successfully")
            : "Job updated successfully";
        message.success(msg);
        onSuccess();
      } else {
        setSaveError(response?.data?.message || `Failed to ${job ? "update" : "create"} job`);
      }
    } catch (error) {
      if (error?.response?.status === 409) {
        // Someone else saved this drive since the form loaded — the version this form would
        // submit is stale, and saving over it would silently clobber their change. Reloading
        // (rather than a plain error toast) is the only correct recovery here.
        Modal.confirm({
          title: "This drive changed since you loaded it",
          content: error?.response?.data?.message || "Someone else updated this drive. Reload to see the latest version before saving again.",
          okText: "Reload",
          cancelText: "Dismiss",
          onOk: () => window.location.reload(),
        });
        return;
      }
      const msg = error?.response?.data?.message || `Failed to ${job ? "update" : "create"} job`;
      setSaveError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={() => {
        if (saveError) setSaveError(null);
      }}
      disabled={initialLoading || editBlocked}
      initialValues={{
        jobType: "Full-time",
        applicationDeadline: null,
        assessmentDeadline: null,
        importantDates: [{ label: "", date: null }],
      }}
    >
      {loadError && (
        <Alert
          message={editBlocked ? "This drive's saved details couldn't be read, so it can't be edited here" : loadError}
          description={editBlocked ? "Saving now would drop the details that didn't load. Close this and open the drive again; if it keeps happening, report it." : undefined}
          type="error" showIcon closable={!editBlocked} style={{ marginBottom: 16 }}
          data-testid="job-form-prefill-error"
        />
      )}

      {saveError && (
        <Alert
          type="error"
          showIcon
          closable
          message={job ? "Drive changes were not saved" : "Drive was not created"}
          description={saveError}
          onClose={() => setSaveError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {hierarchyError && (
        <Alert message={hierarchyError} type="warning" showIcon closable style={{ marginBottom: 16 }} />
      )}

      <Form.Item
        name="jobTitle"
        label="Job Title"
        rules={[
          { required: true, whitespace: true, message: "Please enter a job title" },
        ]}
      >
        <Input placeholder="e.g., Software Engineer" maxLength={100} autoFocus />
      </Form.Item>

      <Form.Item name="companyId" hidden>
        <Input type="hidden" />
      </Form.Item>

      {isCollegeScoped ? (
        <Form.Item
          name="companyName"
          label="Company Name"
          tooltip="Pick a company you've used before to reuse its logo/contact info, or type a new name."
          rules={[
            { required: true, whitespace: true, message: "Please enter company name" },
          ]}
        >
          <AutoComplete
            options={companies.map((c) => ({ value: c.name, key: c.id, logoUrl: c.logoUrl }))}
            filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            placeholder="Search an existing company, or type a new one"
            onSelect={(value, option) => {
              form.setFieldsValue({ companyId: option?.key ?? null, companyLogo: option?.logoUrl || form.getFieldValue("companyLogo") });
            }}
            onChange={(value) => {
              // Free-typing (not selecting from the list) means this is a new/unlinked company —
              // clear companyId so the backend doesn't associate the job with whichever company
              // was last selected.
              const normalizedValue = String(value ?? "").trim().toLowerCase();
              const match = companies.find((c) => String(c.name ?? "").trim().toLowerCase() === normalizedValue);
              form.setFieldsValue({ companyId: match ? match.id : null });
            }}
          />
        </Form.Item>
      ) : null}

      {isCollegeScoped && !watchedCompanyId && String(watchedCompanyName ?? "").trim().length > 0 &&
        !companies.some((c) => String(c.name ?? "").trim().toLowerCase() === String(watchedCompanyName).trim().toLowerCase()) && (
        <Alert
          type="info"
          showIcon
          message="This doesn't match an existing company"
          description="Consider adding it to the Companies directory first for logo/stats support. You can still save this job with the typed name."
          style={{ marginTop: -12, marginBottom: 16 }}
        />
      )}

      {!isCollegeScoped && (
        <Form.Item
          name="companyName"
          label="Company Name"
          rules={[
            { required: true, whitespace: true, message: "Please enter company name" },
          ]}
        >
          <Input placeholder="e.g., ABC Technologies" maxLength={100} />
        </Form.Item>
      )}

      <Form.Item
        name="jobDescription"
        label="Job Description"
        rules={[{ validator: jobDescriptionValidator }]}
      >
        <RichTextEditor
          placeholder="Describe the job role and responsibilities..."
          height={280}
        />
      </Form.Item>

      <Form.Item name="jobResponsibilities" label="Responsibilities">
        <RichTextEditor
          placeholder="Day-to-day responsibilities for this role..."
          height={200}
        />
      </Form.Item>

      <Form.Item
        name="jobType"
        label="Job Type"
        rules={[{ required: true, message: "Please select job type" }]}
      >
        <Select placeholder="Select job type"
          options={jobTypeOptions.map((t) => ({ value: t.value, label: t.countsAsPlaced === false ? `${t.label} (offers do not count as placed)` : t.label }))} />
      </Form.Item>

      <Row gutter={12}>
        <Col xs={24} sm={12}>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g., Bangalore, Remote" maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="ctcRange" label="CTC Range" tooltip="Shown to learners on the job listing.">
            <Input placeholder="e.g., 6-10 LPA" maxLength={100} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="visibilityType"
        label="Visibility"
        tooltip="INTERNAL_ONLY: only your college's learners can see this job. HYBRID: also visible to eligible learners at other colleges in the org. EXTERNAL_ONLY: not shown to learners at all (external-only posting)."
        initialValue="INTERNAL_ONLY"
      >
        <Select>
          <Option value="INTERNAL_ONLY">Internal only (your college)</Option>
          <Option value="HYBRID">Hybrid (your org, cross-college)</Option>
          <Option value="EXTERNAL_ONLY">External only (hidden from learners)</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="assessmentUrl"
        label="Assessment URL"
        extra="Optional. Max 2048 characters. Shown to candidates when moved to Assessment."
        rules={[
          { pattern: /^$|^https?:\/\/\S+$/, message: "Must be a valid http or https URL" },
          { validator: (_, v) => (v && v.length > 2048 ? Promise.reject(new Error("Maximum 2048 characters")) : Promise.resolve()) },
        ]}
      >
        <Input
          placeholder="https://assessment.company.com/..."
          maxLength={2048}
          showCount
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="assessmentDeadline"
        label="Assessment deadline"
        extra="Optional. Deadline for candidates to complete the assessment. Must be after application deadline (or today)."
        dependencies={["applicationDeadline"]}
        rules={[
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              const appDeadline = form.getFieldValue("applicationDeadline");
              const unchanged = originalDeadlinesRef.current.assessmentDeadline !== null
                && dayjs(value).valueOf() === originalDeadlinesRef.current.assessmentDeadline;
              if (!unchanged && dayjs(value).isBefore(dayjs(), "minute")) {
                return Promise.reject(new Error("Assessment deadline cannot be in the past"));
              }
              if (appDeadline && dayjs(value).isBefore(dayjs(appDeadline), "minute")) {
                return Promise.reject(new Error("Assessment deadline must be after application deadline"));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          style={{ width: "100%", maxWidth: 280 }}
          placeholder="Select date and time (optional)"
        />
      </Form.Item>

      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <h4 style={{ marginBottom: 4 }}>Important dates</h4>
        <p style={{ color: "#8c8c8c", fontSize: "12px", marginBottom: 12, marginTop: 0 }}>
          Set the application deadline and add other key dates. These appear on the <strong>Interview Calendar</strong> (admin) and <strong>Career Calendar</strong> (learners). After the application deadline, learners cannot apply.
        </p>
      </div>
      <Form.Item
        name="applicationDeadline"
        label="Application deadline"
        rules={[
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              const unchanged = originalDeadlinesRef.current.applicationDeadline !== null
                && dayjs(value).valueOf() === originalDeadlinesRef.current.applicationDeadline;
              if (!unchanged && dayjs(value).isBefore(dayjs(), "minute")) {
                return Promise.reject(new Error("Application deadline cannot be in the past"));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          style={{ width: "100%", maxWidth: 280 }}
          placeholder="Select date and time (optional)"
        />
      </Form.Item>
      <p style={{ color: "#8c8c8c", fontSize: "12px", marginBottom: 12, marginTop: -8 }}>
        Other milestones (e.g. Screening round, Technical round) — optional:
      </p>
      <Form.List name="importantDates">
        {(fields, { add, remove }) => (
          <>
            {fields.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                <Text type="secondary" style={{ flex: 1, minWidth: 100, fontSize: 12 }}>Label</Text>
                <Text type="secondary" style={{ flex: 1, minWidth: 100, fontSize: 12 }}>Date</Text>
                <span style={{ width: 76 }} />
              </div>
            )}
            {fields.map(({ key, name, ...restField }) => (
              <div key={key} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <Form.Item
                  {...restField}
                  name={[name, "label"]}
                  rules={[
                    () => ({
                      validator(_, value) {
                        const dateVal = form.getFieldValue(["importantDates", name, "date"]);
                        if (dateVal && (!value || !String(value).trim())) {
                          return Promise.reject(new Error("Label required when date is set"));
                        }
                        if (value && String(value).trim().toLowerCase() === "application deadline") {
                          return Promise.reject(new Error("This label is reserved — use the Application deadline field above"));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="e.g. Screening round, Technical round" maxLength={100} />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, "date"]}
                  style={{ flex: 1, marginBottom: 0, minWidth: 120 }}
                  rules={[
                    () => ({
                      validator(_, value) {
                        const labelVal = form.getFieldValue(["importantDates", name, "label"]);
                        // The submit payload silently drops any entry with no date (see
                        // customDatesPayload's trailing filter), so a label typed with no date
                        // picked used to validate fine and then vanish on save with no warning.
                        if (labelVal && String(labelVal).trim() && !value) {
                          return Promise.reject(new Error("Date required when label is set"));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker showTime={false} format="YYYY-MM-DD" style={{ width: "100%" }} placeholder="Select date" />
                </Form.Item>
                <Tooltip title={fields.length <= 1 ? "At least one row required" : undefined}>
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                    disabled={fields.length <= 1}
                    style={{ marginLeft: 8 }}
                  >
                    Remove
                  </Button>
                </Tooltip>
              </div>
            ))}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="dashed"
                onClick={() => add({ label: "", date: null })}
                disabled={fields.length >= MAX_IMPORTANT_DATES}
                block
              >
                Add date{fields.length >= MAX_IMPORTANT_DATES ? ` (max ${MAX_IMPORTANT_DATES})` : ""}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <h4 style={{ marginBottom: 4 }}>Target Audience</h4>
        <p style={{ color: "#8c8c8c", fontSize: "12px", margin: 0 }}>
          Leave empty to target all students. Each level narrows down the one below it.
        </p>
      </div>

      {/* A bordered sub-panel so the six fields below read as one cascading funnel (each
          disabled/enabled by the one above it) instead of a flat list of unrelated dropdowns —
          the only previous hint was disabled-state + placeholder text, discoverable only after
          clicking a downstream field first. */}
      <div style={{ padding: "16px 16px 4px", background: "#fff", border: "1px solid #f0f0f0", borderLeft: "3px solid #26bac7", borderRadius: 8, marginBottom: 16 }}>
      {isSuperAdminMode && (
        <Form.Item
          name="organizationId"
          label="Organization"
          rules={[{ required: true, message: "Please select organization" }]}
        >
          <Select
            placeholder="Select Organization"
            allowClear
            onChange={handleOrganizationChange}
            loading={hierarchyLoading}
          >
            {organizations.map(org => (
              <Option key={org.id} value={org.id}>{org.name}</Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {isSuperAdminMode && (
        <Form.Item
          name="targetCollegeId"
          label="College"
          rules={[{ required: true, message: "Please select a college" }]}
        >
          <Select
            placeholder={!watchedOrgId ? "Select organization first" : "Select a college"}
            allowClear
            disabled={!watchedOrgId}
            onChange={handleCollegeChange}
          >
            {filteredColleges.map(college => (
              <Option key={college.id} value={college.id}>{college.name}</Option>
            ))}
          </Select>
        </Form.Item>
      )}

      <Form.Item name="targetDepartmentId" label="Department">
        <Select
          placeholder={
            isSuperAdminMode && !watchedOrgId
              ? "Select organization first"
              : filteredDepartments.length === 0 && (isCollegeScoped || watchedCollegeId) && hierarchyLoading
              ? "Loading departments..."
              : "All Departments (optional)"
          }
          allowClear
          showSearch
          filterOption={(input, option) => (option?.children ?? "").toString().toLowerCase().includes(input.toLowerCase())}
          disabled={isSuperAdminMode && !watchedOrgId}
          onChange={handleDepartmentChange}
          loading={hierarchyLoading}
        >
          {((isCollegeScoped || watchedCollegeId) ? filteredDepartments : departments).map(dept => (
            <Option key={dept.id} value={dept.id}>{dept.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="targetProgramId" label="Program">
        <Select
          placeholder="All Programs (optional)"
          allowClear
          showSearch
          filterOption={(input, option) => (option?.children ?? "").toString().toLowerCase().includes(input.toLowerCase())}
          disabled={!watchedDeptId && !isCollegeScoped}
          onChange={handleProgramChange}
        >
          {((isCollegeScoped || filteredPrograms.length > 0) ? filteredPrograms : programs).map(prog => (
            <Option key={prog.id} value={prog.id}>{prog.name ?? prog.programName ?? prog.program_name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="targetBatchId" label="Batch">
        <Select
          placeholder="All Batches (optional)"
          allowClear
          showSearch
          filterOption={(input, option) => (option?.children ?? "").toString().toLowerCase().includes(input.toLowerCase())}
          disabled={!watchedProgId}
          onChange={handleBatchChange}
        >
          {((isCollegeScoped || filteredBatches.length > 0) ? filteredBatches : batches).map(batch => (
            <Option key={batch.id} value={batch.id}>{batch.batchName || batch.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="targetClassId" label="Class">
        <Select
          placeholder="All Classes (optional)"
          allowClear
          showSearch
          filterOption={(input, option) => (option?.children ?? "").toString().toLowerCase().includes(input.toLowerCase())}
          disabled={!watchedBatchId}
        >
          {((isCollegeScoped || filteredClasses.length > 0) ? filteredClasses : classes).map(cls => (
            <Option key={cls.id} value={cls.id}>{cls.name || cls.className}</Option>
          ))}
        </Select>
      </Form.Item>
      </div>

      <div style={{ marginTop: 24, marginBottom: 16 }}>
        <h4>Candidate Preferences (informational — not enforced)</h4>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          These describe the ideal candidate and are shown to learners as guidance. They do NOT
          block or filter who can see or apply to this job — every eligibility check was
          deliberately removed from the backend; only targeting (college/department/batch)
          controls visibility. Use targeting rules above if you need to actually restrict who can
          apply.
        </Typography.Paragraph>
      </div>

      <Form.Item name="degree" label="Preferred Degree">
        <Input placeholder="e.g., B.Tech, BE, MBA" maxLength={100} />
      </Form.Item>

      <Form.Item name="specialization" label="Preferred Specialization">
        <Input placeholder="e.g., CSE, ECE, Finance" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="graduationYear"
        label="Preferred Graduation Year"
        rules={[
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              const trimmed = String(value).trim();
              if (!trimmed) return Promise.resolve();
              if (!/^\d{4}$/.test(trimmed)) return Promise.reject(new Error("Enter a valid 4-digit year (e.g., 2025)"));
              const year = Number(trimmed);
              if (year < 1990 || year > 2050) return Promise.reject(new Error("Year must be between 1990 and 2050"));
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input placeholder="e.g., 2025" maxLength={4} />
      </Form.Item>

      <Form.Item
        name="minGpa"
        label="Preferred Minimum GPA"
        rules={[
          {
            validator: (_, value) => {
              if (value == null || value === "") return Promise.resolve();
              const n = typeof value === "number" ? value : parseFloat(value);
              if (Number.isNaN(n)) return Promise.reject(new Error("Enter a valid number"));
              if (n < 0 || n > 10) return Promise.reject(new Error("GPA must be between 0 and 10"));
              return Promise.resolve();
            },
          },
        ]}
      >
        <InputNumber step={0.1} placeholder="e.g., 7.5" min={0} max={10} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="cityPreference" label="Preferred City">
        <Input placeholder="e.g., Bangalore" maxLength={100} />
      </Form.Item>

      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>Custom eligibility rules</span>
        <span style={{ color: "#8c8c8c", fontSize: "12px", marginLeft: 8 }}>
          Add your own rules (e.g. Work permit, Experience). Displayed to students. Max {MAX_CUSTOM_RULES}.
        </span>
      </div>
      {customRules.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
          <Text type="secondary" style={{ flex: 1, minWidth: 100, fontSize: 12 }}>Label</Text>
          <Text type="secondary" style={{ flex: 1, minWidth: 100, fontSize: 12 }}>Value</Text>
        </div>
      )}
      {customRules.map((rule) => (
        <div key={rule.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <Input
            placeholder="Label (e.g. Work permit)"
            aria-label="Rule label"
            value={rule.label}
            onChange={(e) => {
              setCustomRules(prev => prev.map(r => r.id === rule.id ? { ...r, label: e.target.value } : r));
            }}
            style={{ flex: 1, minWidth: 100 }}
            maxLength={200}
            disabled={initialLoading}
          />
          <Input
            placeholder="Value (e.g. Required)"
            aria-label="Rule value"
            value={rule.value}
            onChange={(e) => {
              setCustomRules(prev => prev.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r));
            }}
            style={{ flex: 1, minWidth: 100 }}
            maxLength={200}
            disabled={initialLoading}
          />
          <Tooltip title={customRules.length <= 1 ? "At least one row required" : undefined}>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setCustomRules(prev => prev.filter(r => r.id !== rule.id))}
              disabled={customRules.length <= 1 || initialLoading}
              style={{ marginLeft: 8 }}
            >
              Remove
            </Button>
          </Tooltip>
        </div>
      ))}
      {customRules.length < MAX_CUSTOM_RULES && (
        <Button
          type="dashed"
          onClick={() => setCustomRules(prev => [...prev, { id: makeRuleId(), label: "", value: "" }])}
          style={{ marginBottom: 16 }}
        >
          Add custom rule
        </Button>
      )}

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="button"
            loading={loading}
            disabled={hierarchyLoading || initialLoading}
            onClick={() => submitGuarded(job ? (job.isDraft ? true : undefined) : false)}
          >
            {job ? (job.isDraft ? "Save draft" : "Update") : "Publish"} Job
          </Button>
          {!job && (
            <Button
              htmlType="button"
              loading={loading}
              disabled={hierarchyLoading || initialLoading}
              onClick={() => submitGuarded(true)}
            >
              Save as draft
            </Button>
          )}
          {job?.isDraft && (
            <Button
              type="primary"
              ghost
              htmlType="button"
              loading={loading}
              disabled={hierarchyLoading || initialLoading}
              onClick={() => submitGuarded(false)}
            >
              Publish now
            </Button>
          )}
          <Button
            onClick={() => {
              if (isDirty()) {
                Modal.confirm({
                  title: "Discard unsaved changes?",
                  content: "You have unsaved changes on this form. Leaving now will discard them.",
                  okText: "Discard",
                  okType: "danger",
                  cancelText: "Keep editing",
                  onOk: onCancel,
                });
              } else {
                onCancel();
              }
            }}
          >
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export default JobForm;
