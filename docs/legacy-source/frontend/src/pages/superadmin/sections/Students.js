import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Form, Input, Button, Table, Card, Row, Col, message, Select, DatePicker, Tag, Space, Popconfirm, Modal, AutoComplete, Spin, Upload, Alert, Collapse, Grid } from "antd";
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined, StopOutlined, CheckCircleOutlined, LoginOutlined, HistoryOutlined, IdcardOutlined, UnlockOutlined } from "@ant-design/icons";
import ProfileSectionsPanel from "@/components/admin/ProfileSectionsPanel";
import { suspendUser, reactivateUser, impersonateUser } from "@/api/Services/AdminUserLifecycleService";
import { exportRowsToCsv } from "@/utils/csvExport";
import { parseAdminBulkCsv } from "@/utils/bulkCsvParse";
import { normalizeIndianMobile } from "@/utils/onboardingPhone";
import { setAccessToken, setRefreshToken } from "@/utils/authUtils";
import AuditLogs from "./AuditLogs";
import PeoplePageOverview from "@/components/admin/people/PeoplePageOverview";
import { useSelector } from "react-redux";
import {
  registerLearner,
  getLearnersByCollegeId,
  getClassesByCollege,
  getProgramsByCollege,
  updateLearner,
  deleteLearner,
  fetchWithErrorHandling,
  bulkValidateLearners,
  bulkRegisterLearners,
  getBulkImportBatches,
  clearOtpLockout,
  getClassesByProgram,
  setModuleAccessBulk,
  getCollegeById,
} from "@/api/Services/AdminService";
import { handleRegistrationError } from "@/utils/errorHandlers";
import { searchLearners, getPopularLearners, recordLearnerSelection } from "@/api/Services/LearnerSearchService";
import { debounce } from "lodash";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { formatTimestamp } from "@/components/admin/projects/adminProjectUtils";

dayjs.extend(customParseFormat);

function parseDob(dob) {
  if (!dob) return null;
  for (const fmt of ["YYYY-MM-DD", "DD-MM-YYYY"]) {
    const d = dayjs(dob, fmt, true);
    if (d.isValid()) return d;
  }
  const fb = dayjs(dob);
  return fb.isValid() ? fb : null;
}

const { Option } = Select;
const { TextArea } = Input;

const Students = ({ collegeId = null }) => {
  const loginUser = useSelector((state) => state.loginUser);
  const screens = Grid.useBreakpoint();
  // Impersonation is superadmin-only (id 0) — never exposed to a college admin, matching the
  // security posture of every other superadmin-exclusive tool in this panel.
  const isSuperAdmin = loginUser?.id === 0 && loginUser?.userType === "FACULTY";
  const [historyRecord, setHistoryRecord] = useState(null);
  // M1 in the audit -- 20 learner profile sections (resume, skills, education, job preferences,
  // identity docs, etc.) behind ProfileService with zero admin screens calling any of them. Admin
  // could edit 11 basic demographic fields (the Edit modal below) and nothing else.
  const [profileRecord, setProfileRecord] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [classes, setClasses] = useState([]);
  const [classesLookupError, setClassesLookupError] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [programsLookupError, setProgramsLookupError] = useState(null);
  // Roster filters. A college roster is 1k+ students; a single search box plus 10-row pages was
  // the only way to find anyone. All filtering is client-side over the already-loaded roster.
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterBatch, setFilterBatch] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [registerOpen, setRegisterOpen] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [rowActionBusy, setRowActionBusy] = useState(null);
  // The College field in Register/Bulk/Edit used to show the raw numeric collegeId as its display
  // text ("College 41") with no attempt at a real name — fetch it once so the read-only field
  // actually reads like a college.
  const [collegeName, setCollegeName] = useState(null);

  useEffect(() => {
    if (!collegeId) {
      setCollegeName(null);
      return;
    }
    const controller = new AbortController();
    fetchWithErrorHandling(getCollegeById(collegeId), { signal: controller.signal })
      .then((result) => {
        if (result?.success && result?.data) {
          setCollegeName(result.data?.name ?? result.data?.collegeName ?? null);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [collegeId]);

  // Search functionality
  const [searchValue, setSearchValue] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [popularLearners, setPopularLearners] = useState([]);
  // Read inside showDefaultSuggestions so debouncedSearch below doesn't need popularLearners in
  // its dependency array — recreating the debounce on every popular-list update would drop any
  // in-flight timer (narrow window right after mount, but a real smell).
  const popularLearnersRef = useRef(popularLearners);
  useEffect(() => {
    popularLearnersRef.current = popularLearners;
  }, [popularLearners]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allLearners, setAllLearners] = useState([]); // Keep full list for filtering
  const activeCollegeRef = useRef(collegeId);
  activeCollegeRef.current = collegeId;
  const rosterLoadIdRef = useRef(0);

  // Bulk module access (Placements / Projects) for selected students.
  // preserveSelectedRowKeys on the table means a selection survives paging, so an admin can filter
  // to a class, select across pages, and apply once.
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkModule, setBulkModule] = useState("placements");
  const [bulkModuleSaving, setBulkModuleSaving] = useState(false);

  // Bulk register state
  const [bulkProgramId, setBulkProgramId] = useState(null);
  const [bulkClassId, setBulkClassId] = useState(null);
  const [bulkFileList, setBulkFileList] = useState([]);
  const [parsedBulkRows, setParsedBulkRows] = useState([]);
  const [bulkValidateResult, setBulkValidateResult] = useState(null);
  const [bulkCreateResult, setBulkCreateResult] = useState(null);
  // B3 in the audit -- a bad bulk import had no undo, no batch id, no grouping.
  const [importHistoryOpen, setImportHistoryOpen] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [importHistoryLoading, setImportHistoryLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkValidateLoading, setBulkValidateLoading] = useState(false);
  const [classesByProgram, setClassesByProgram] = useState([]);
  const [bulkClassesLoading, setBulkClassesLoading] = useState(false);
  const [bulkClassesError, setBulkClassesError] = useState(null);
  const [bulkClassesRetryKey, setBulkClassesRetryKey] = useState(0);
  // Superadmin is college-scoped.

  const MAX_BULK_ROWS = 500;
  const BULK_REQUIRED_COLUMNS = ["First Name", "Last Name", "Roll Number", "Mobile Number", "Email"];

  const isCollegeScoped = collegeId != null && Number.isFinite(Number(collegeId));
  const recentLearnersKey = useMemo(
    () => `recentLearners:${loginUser?.userType ?? "anonymous"}:${loginUser?.id ?? "anonymous"}:${loginUser?.organizationId ?? "no-org"}:${collegeId ?? "no-college"}`,
    [loginUser?.userType, loginUser?.id, loginUser?.organizationId, collegeId]
  );
  const readRecentLearners = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const value = JSON.parse(sessionStorage.getItem(recentLearnersKey) || "[]");
      if (!Array.isArray(value) || !allLearners.length) return [];
      const validIds = new Set(allLearners.map((learner) => String(learner.id)));
      return value.filter((learner) =>
        Number(learner.collegeId) === Number(collegeId) && validIds.has(String(learner.id))
      );
    } catch (_) {
      sessionStorage.removeItem(recentLearnersKey);
      return [];
    }
  }, [recentLearnersKey, allLearners, collegeId]);
  useEffect(() => {
    if (!loginUser?.isUserLoggedIn && typeof window !== "undefined") {
      sessionStorage.removeItem(recentLearnersKey);
    }
  }, [loginUser?.isUserLoggedIn, recentLearnersKey]);
  // NOTE: Don't early-return before hooks (React rules-of-hooks).

  // (Superadmin) no global fallbacks: always college-scoped

  // Show default search suggestions
  const showDefaultSuggestions = () => {
    const recent = readRecentLearners();
    const suggestions = [];

    if (recent.length > 0) {
      suggestions.push({
        label: "Recent",
        options: recent.slice(0, 5).map(learner => ({
          value: learner.displayName || `${learner.firstName} ${learner.lastName}`,
          label: (
            <div>
              <div>{learner.displayName || `${learner.firstName} ${learner.lastName}`}</div>
              {learner.rollNumber && (
                <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                  {learner.rollNumber}
                </Tag>
              )}
              {learner.collegeName && (
                <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                  {learner.collegeName}
                </Tag>
              )}
            </div>
          ),
          learner: learner,
        })),
      });
    }

    const currentPopularLearners = popularLearnersRef.current.filter((learner) =>
      Number(learner.collegeId) === Number(collegeId)
      && allLearners.some((item) => String(item.id) === String(learner.id))
    );
    if (currentPopularLearners.length > 0) {
      suggestions.push({
        label: "Popular",
        options: currentPopularLearners.slice(0, 5).map(learner => ({
          value: learner.displayName || `${learner.firstName} ${learner.lastName}`,
          label: (
            <div>
              <div>{learner.displayName || `${learner.firstName} ${learner.lastName}`}</div>
              {learner.rollNumber && (
                <Tag color="volcano" style={{ fontSize: 10, marginTop: 4 }}>
                  {learner.rollNumber}
                </Tag>
              )}
              {learner.collegeName && (
                <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                  {learner.collegeName}
                </Tag>
              )}
            </div>
          ),
          learner: learner,
        })),
      });
    }

    setSearchOptions(suggestions);
  };

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query) => {
        if (!query || query.trim().length < 1) {
          showDefaultSuggestions();
          setSearchLoading(false);
          return;
        }

        setSearchLoading(true);
        try {
          const response = await searchLearners(query.trim(), 15, collegeId);
          if (response?.data?.status === "success" && response?.data?.data) {
            if (String(activeCollegeRef.current) !== String(collegeId)) return;
            const formatted = response.data.data
              .filter((learner) =>
                Number(learner.collegeId) === Number(collegeId)
                && allLearners.some((item) => String(item.id) === String(learner.id))
              )
              .map(learner => ({
              value: learner.displayName || `${learner.firstName} ${learner.lastName}`,
              label: (
                <div>
                  <div>{learner.displayName || `${learner.firstName} ${learner.lastName}`}</div>
                  {learner.rollNumber && (
                    <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                      {learner.rollNumber}
                    </Tag>
                  )}
                  {learner.collegeName && (
                    <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                      {learner.collegeName}
                    </Tag>
                  )}
                </div>
              ),
              learner: learner,
            }));

            setSearchOptions([
              {
                label: "Search Results",
                options: formatted,
              },
            ]);
          } else {
            setSearchOptions([]);
          }
        } catch (error) {
          setSearchOptions([]);
        } finally {
          setSearchLoading(false);
        }
      }, 200),
    [collegeId, allLearners]
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // Handle search input
  const handleSearch = (value) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  // Handle learner selection
  const handleSelect = (value, option) => {
    const learner = option.learner;
    if (!learner) return;

    const selectedLearners = allLearners.filter((item) =>
      String(item.id) === String(learner.id) && Number(item.collegeId) === Number(collegeId)
    );
    if (selectedLearners.length === 0) {
      message.warning("That learner is not in the current college roster.");
      setSearchValue("");
      setSearchOptions([]);
      return;
    }
    const recent = readRecentLearners();
    const safeRecent = {
      id: selectedLearners[0].id,
      collegeId,
      firstName: selectedLearners[0].firstName,
      lastName: selectedLearners[0].lastName,
      rollNumber: selectedLearners[0].rollNumber,
      collegeName: selectedLearners[0].collegeName,
    };
    sessionStorage.setItem(recentLearnersKey, JSON.stringify([
      safeRecent,
      ...recent.filter((item) => String(item.id) !== String(safeRecent.id)),
    ].slice(0, 10)));

    if (learner.id) {
      recordLearnerSelection(learner.id).catch(() => {});
    }

    setData(selectedLearners);
    setSearchValue("");
    setSearchOptions([]);
  };

  // Handle focus - show suggestions
  const handleFocus = () => {
    if (!searchValue) {
      showDefaultSuggestions();
    }
  };

  // Clear search and show all learners
  const clearSearch = () => {
    setSearchValue("");
    setData(allLearners);
    setSearchOptions([]);
  };

  const fetchData = useCallback(async () => {
    if (!isCollegeScoped || !loginUser?.isUserLoggedIn) return;
    const requestId = ++rosterLoadIdRef.current;
    setTableLoading(true);
    setLoadError("");
    setClassesLookupError(null);
    setProgramsLookupError(null);
    try {
      const [learnersResult, classResult, programResult] = await Promise.all([
        fetchWithErrorHandling(getLearnersByCollegeId(collegeId)),
        fetchWithErrorHandling(getClassesByCollege(collegeId)),
        fetchWithErrorHandling(getProgramsByCollege(collegeId)),
      ]);
      if (requestId !== rosterLoadIdRef.current || String(activeCollegeRef.current) !== String(collegeId)) return;

      if (learnersResult.success) {
        const raw = learnersResult.data;
        const learners = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setAllLearners(learners);
        setData(learners);
      }
      if (classResult.success) {
        const raw = classResult.data;
        const rows = Array.isArray(raw) ? raw : raw?.data;
        if (Array.isArray(rows)) setClasses(rows);
        else {
          setClasses([]);
          setClassesLookupError("Could not verify classes for this college.");
        }
      } else {
        setClasses([]);
        setClassesLookupError(classResult.message || classResult?.data?.message || "Could not load classes for this college.");
      }
      if (programResult.success) {
        const raw = programResult.data;
        const rows = Array.isArray(raw) ? raw : raw?.data;
        if (Array.isArray(rows)) setPrograms(rows);
        else {
          setPrograms([]);
          setProgramsLookupError("Could not verify programs for this college.");
        }
      } else {
        setPrograms([]);
        setProgramsLookupError(programResult.message || programResult?.data?.message || "Could not load programs for this college.");
      }
      const failure = [learnersResult, classResult, programResult].find((result) => !result.success);
      if (failure) {
        setLoadError(failure.message || "Failed to load student roster data");
      }
    } finally {
      if (requestId === rosterLoadIdRef.current) setTableLoading(false);
    }
  }, [collegeId, isCollegeScoped, loginUser?.isUserLoggedIn]);

  useEffect(() => {
    setData([]);
    setAllLearners([]);
    setClasses([]);
    setPrograms([]);
    setClassesLookupError(null);
    setProgramsLookupError(null);
    setPopularLearners([]);
    setSearchOptions([]);
    if (!isCollegeScoped) return;
    if (!loginUser?.isUserLoggedIn) return;
    let cancelled = false;

    const loadAll = async () => {
      await fetchData();

      try {
        const response = await getPopularLearners(10, collegeId);
        if (!cancelled && String(activeCollegeRef.current) === String(collegeId) && response?.data?.data) {
          setPopularLearners(response.data.data.filter((learner) => Number(learner.collegeId) === Number(collegeId)));
        }
      } catch {
        // silently ignore
      }
    };

    loadAll();

    return () => { cancelled = true; };
  }, [loginUser?.isUserLoggedIn, collegeId, fetchData, isCollegeScoped]);

  // Load classes by program for bulk section
  useEffect(() => {
    if (!isCollegeScoped) return;
    if (!bulkProgramId) {
      setClassesByProgram([]);
      setBulkClassId(null);
      setBulkClassesError(null);
      setBulkClassesLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setBulkClassesLoading(true);
      setBulkClassesError(null);
      setBulkClassId(null);
      const result = await fetchWithErrorHandling(getClassesByProgram(bulkProgramId));
      if (cancelled) return;
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : result.data?.data ?? [];
        if (!Array.isArray(list)) {
          setClassesByProgram([]);
          setBulkClassesError("Could not verify classes for this program.");
        } else {
          setClassesByProgram(list);
        }
      } else {
        setClassesByProgram([]);
        setBulkClassesError(result?.message || result?.data?.message || "Could not load classes for this program.");
      }
      setBulkClassesLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [bulkProgramId, bulkClassesRetryKey]);

  // Update search options when popular learners change
  useEffect(() => {
    if (!isCollegeScoped) return;
    if (!searchValue && popularLearners.length > 0) {
      showDefaultSuggestions();
    }
  }, [searchValue, popularLearners]);

  const handleSubmit = async (values) => {
    if (loading) return;
    if (classesLookupError || programsLookupError) {
      message.error("Academic placement options are unavailable. Retry the roster data before registering a student.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        contact_mobile: values.contactMobile,
        contact_mail: values.contactMail || "",
        roll_number: values.rollNumber,
        college_id: collegeId ?? values.collegeId,
        class_id: values.classId,
        program_id: values.programId,
        gender: values.gender || "",
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        department: values.department || "",
        address: values.address || "",
        description: values.description || "",
      };
      await registerLearner(payload);
      message.success("Student registered successfully! They can now login with their mobile number.");
      form.resetFields();
      fetchData();
    } catch (error) {
      handleRegistrationError(error, "learner", (errorMsg) => {
        message.error("Failed to register student: " + errorMsg);
      });
    }
    setLoading(false);
  };

  const handleEdit = (record) => {
    if (classesLookupError || programsLookupError || rowActionBusy) {
      message.warning("Reload classes and programs before editing this student.");
      return;
    }
    setEditingRecord(record);
    editForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      contactMobile: record.contactMobile,
      contactMail: record.contactMail,
      rollNumber: record.rollNumber,
      collegeId: record.collegeId,
      classId: record.classId,
      programId: record.programId,
      gender: record.gender,
      dob: parseDob(record.dob),
      address: record.address,
      department: record.department,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (editLoading) return;
    if (classesLookupError || programsLookupError) {
      message.error("Classes or programs are unavailable. Retry before saving.");
      return;
    }
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      
      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        contact_mobile: values.contactMobile,
        contact_mail: values.contactMail || "",
        roll_number: values.rollNumber,
        college_id: collegeId ?? values.collegeId,
        class_id: values.classId,
        program_id: values.programId,
        gender: values.gender || "",
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        department: values.department || "",
        address: values.address || "",
      };
      
      await updateLearner(editingRecord.id, payload);
      message.success("Student updated successfully!");
      finishEditClose();
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error("Failed to update student: " + (error?.response?.data?.message || error.message));
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (rowActionBusy) return;
    setRowActionBusy(`delete:${id}`);
    try {
      await deleteLearner(id);
      message.success("Student deleted successfully!");
      fetchData();
    } catch (error) {
      message.error("Failed to delete student: " + (error?.response?.data?.message || error.message));
    } finally { setRowActionBusy(null); }
  };

  // Reversible alternative to delete — the account keeps its data/history but can't log in
  // (backend blocks the OTP-verify step and immediately invalidates any live session/token).
  /**
   * `enabled: null` clears each student's own override so they inherit from their class/batch/
   * program/college again — a distinct third action from on/off, and the only way back out of a
   * per-student override once one has been set.
   */
  const handleBulkModuleAccess = (enabled) => {
    if (!isSuperAdmin) return;
    if (selectedStudentIds.length === 0) return;
    // The Module Access grid confirms before changing a 100-student department, while this -- which
    // can change 800 hand-picked students on one click, with "Turn off" sitting beside "Turn on" --
    // did not. The policy was inverted; this is the bigger blast radius of the two.
    const verb = enabled === null ? "Reset to inherit" : enabled ? "Turn on" : "Turn off";
    Modal.confirm({
      title: `${verb} ${bulkModule} for ${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? "" : "s"}?`,
      content:
        enabled === false
          ? `These students will get an access error if they open ${bulkModule} directly.`
          : enabled === true
          ? `These students will be able to open ${bulkModule} again.`
          : "This clears each student's own setting, so they follow whatever their class, batch or college says.",
      okText: verb,
      okButtonProps: { danger: enabled === false },
      onOk: () => applyBulkModuleAccess(enabled),
    });
  };

  const applyBulkModuleAccess = async (enabled) => {
    if (!isSuperAdmin) return;
    setBulkModuleSaving(true);
    try {
      await setModuleAccessBulk({
        module: bulkModule,
        enabled,
        learnerIds: selectedStudentIds.map((id) => Number(id)),
      });
      const verb = enabled === null ? "reset to inherit" : enabled ? "turned on" : "turned off";
      message.success(`${bulkModule} ${verb} for ${selectedStudentIds.length} student(s)`);
      setSelectedStudentIds([]);
    } catch (error) {
      message.error(
        error?.response?.data?.message || error?.response?.data?.error || "Could not update — please retry"
      );
    }
    setBulkModuleSaving(false);
  };

  const handleSuspend = async (id) => {
    if (rowActionBusy) return;
    setRowActionBusy(`suspend:${id}`);
    try {
      await suspendUser("LEARNER", id);
      message.success("Student suspended");
      fetchData();
    } catch (error) {
      message.error("Failed to suspend student: " + (error?.response?.data?.error || error?.response?.data?.message || error.message));
    } finally { setRowActionBusy(null); }
  };

  const handleReactivate = async (id) => {
    if (rowActionBusy) return;
    setRowActionBusy(`reactivate:${id}`);
    try {
      await reactivateUser("LEARNER", id);
      message.success("Student reactivated");
      fetchData();
    } catch (error) {
      message.error("Failed to reactivate student: " + (error?.response?.data?.message || error.message));
    } finally { setRowActionBusy(null); }
  };

  // Login-as-user: stores the new tokens then does a full page navigation (not a client-side
  // route change) so the app's own boot sequence rebuilds Redux/loginUser state from scratch
  // against the new identity — safer than trying to hand-construct a matching partial state here.
  const handleImpersonate = async (record) => {
    if (rowActionBusy) return;
    setRowActionBusy(`impersonate:${record.id}`);
    try {
      const res = await impersonateUser("LEARNER", record.id);
      const data = res?.data;
      if (!data?.accessToken) throw new Error("Impersonation did not return a session token");
      setAccessToken(data.accessToken);
      if (data?.refreshToken) setRefreshToken(data.refreshToken);
      message.success(`Acting as ${record.firstName || "student"} ${record.lastName || ""}`.trim());
      window.location.href = "/learn/courses";
    } catch (error) {
      message.error("Failed to impersonate: " + (error?.response?.data?.error || error?.response?.data?.message || error.message));
      setRowActionBusy(null);
    }
  };

  const handleClearOtp = async (record) => {
    if (rowActionBusy || !record?.contactMobile) return;
    setRowActionBusy(`otp:${record.id}`);
    try {
      await clearOtpLockout(record.contactMobile);
      message.success("OTP lockout cleared");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to clear lockout");
    } finally { setRowActionBusy(null); }
  };

  const finishEditClose = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    editForm.resetFields();
  };

  const handleEditCancel = () => {
    if (editLoading) return;
    if (!editForm.isFieldsTouched()) {
      finishEditClose();
      return;
    }
    Modal.confirm({
      title: "Discard student edits?",
      content: "Your unsaved changes will be lost.",
      okText: "Discard edits",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: finishEditClose,
    });
  };

  // --- Bulk register: CSV parse and validate/create ---
  function parseCSV(text) {
    return parseAdminBulkCsv(text, BULK_REQUIRED_COLUMNS, (get) => ({
      first_name: get("First Name"),
      last_name: get("Last Name"),
      roll_number: get("Roll Number"),
      contact_mobile: get("Mobile Number"),
      contact_mail: get("Email") || undefined,
    }), MAX_BULK_ROWS);
  }

  // BE-0195: each picked file is numbered; a slower read of an earlier file can't replace the rows of the one chosen now.
  const bulkReadSeq = useRef(0);
  const handleBulkFileChange = (info) => {
    const seq = ++bulkReadSeq.current;
    setBulkFileList(info.fileList.slice(-1));
    setBulkValidateResult(null);
    setBulkCreateResult(null);
    setParsedBulkRows([]);
    const file = info.fileList[info.fileList.length - 1]?.originFileObj; // the file shown (the latest), not the first one picked
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (seq !== bulkReadSeq.current) return;
      try {
        const { rows, error } = parseCSV(e.target.result);
        if (error) {
          message.error(error);
          setBulkFileList([]);
          return;
        }
        setParsedBulkRows(rows);
        message.success(`Parsed ${rows.length} row(s). Select program & class, then Validate or Create.`);
      } catch (err) {
        message.error("Failed to parse CSV: " + (err?.message || "Invalid file"));
        setBulkFileList([]);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleBulkValidate = async () => {
    if (!collegeId || !bulkProgramId || !bulkClassId || !parsedBulkRows.length) {
      message.warning("Select college, program and class, then upload the roster before validating.");
      return;
    }
    const validationKey = JSON.stringify([collegeId, bulkProgramId, bulkClassId, parsedBulkRows]);
    const mobiles = parsedBulkRows.map((r) => normalizeIndianMobile(r.contact_mobile)).filter(Boolean);
    const emails = parsedBulkRows.map((r) => r.contact_mail?.trim().toLowerCase()).filter(Boolean);
    setBulkValidateLoading(true);
    setBulkValidateResult(null);
    try {
      const rollNumbers = parsedBulkRows.map((r) => String(r.roll_number || "").trim()).filter(Boolean);
      const res = await bulkValidateLearners({ mobiles, emails, roll_numbers: rollNumbers, college_id: collegeId });
      const data = res?.data?.data ?? res?.data ?? {};
      const existingMobiles = data.existing_mobiles ?? data.existingMobiles ?? [];
      const existingEmails = data.existing_emails ?? data.existingEmails ?? [];
      const existingRollNumbers = data.existing_roll_numbers ?? data.existingRollNumbers ?? [];
      const existingRollSet = new Set(existingRollNumbers.map((roll) => String(roll).trim().toLowerCase()));
      const existingMobileSet = new Set(existingMobiles.map((m) => normalizeIndianMobile(m)).filter(Boolean));
      const existingEmailSet = new Set(existingEmails.map((e) => String(e).trim().toLowerCase()));
      const count = (values) => values.reduce((acc, val) => { if (val) acc[val] = (acc[val] || 0) + 1; return acc; }, {});
      const mobileCounts = count(mobiles);
      const emailCounts = count(emails);
      const rolls = parsedBulkRows.map((r) => String(r.roll_number || "").trim().toLowerCase());
      const rollCounts = count(rolls);
      const duplicateMobilesInFile = Object.keys(mobileCounts).filter((m) => mobileCounts[m] > 1);
      const duplicateEmailsInFile = Object.keys(emailCounts).filter((e) => emailCounts[e] > 1);
      const duplicateRows = parsedBulkRows.map((r, i) => {
        const mobile = normalizeIndianMobile(r.contact_mobile);
        const email = String(r.contact_mail || "").trim().toLowerCase();
        const roll = rolls[i];
        const issues = [];
        if (!String(r.first_name || "").trim()) issues.push("First name required");
        if (!String(r.last_name || "").trim()) issues.push("Last name required");
        if (!roll) issues.push("Roll number required");
        if (roll && rollCounts[roll] > 1) issues.push("Duplicate roll number in file");
        if (roll && existingRollSet.has(roll)) issues.push("Roll number already exists in this college");
        if (!mobile) issues.push("Valid 10-digit mobile required");
        if (mobile && existingMobileSet.has(mobile)) issues.push("Mobile already in system");
        if (mobile && mobileCounts[mobile] > 1) issues.push("Duplicate mobile in file");
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push("Invalid email");
        if (email && existingEmailSet.has(email)) issues.push("Email already in system");
        if (email && emailCounts[email] > 1) issues.push("Duplicate email in file");
        return issues.length ? { ...r, row: i + 1, issues } : null;
      }).filter(Boolean);
      setBulkValidateResult({ existingMobiles, existingEmails, existingRollNumbers, duplicateMobilesInFile,
        duplicateEmailsInFile, duplicateRows, totalRows: parsedBulkRows.length, validationKey });
      if (!duplicateRows.length) message.success(`Validation passed for ${parsedBulkRows.length} learner(s).`);
    } catch (error) {
      setBulkValidateResult(null);
      message.error("Validation failed: " + (error?.response?.data?.message || error?.message || "Please retry"));
    } finally { setBulkValidateLoading(false); }
  };

  const handleBulkCreate = async () => {
    const cid = collegeId;
    if (!cid) {
      message.error("Select a college (or open this page for a specific college).");
      return;
    }
    if (!bulkProgramId || !bulkClassId) {
      message.error("Select Program and Class.");
      return;
    }
    if (parsedBulkRows.length === 0) {
      message.warning("Upload a CSV first.");
      return;
    }
    const validationKey = JSON.stringify([cid, bulkProgramId, bulkClassId, parsedBulkRows]);
    if (!bulkValidateResult || bulkValidateResult.validationKey !== validationKey || bulkValidateResult.duplicateRows.length) {
      message.error("Validate this exact roster and selected class successfully before creating learners.");
      return;
    }
    setBulkLoading(true);
    setBulkCreateResult(null);
    try {
      const learners = parsedBulkRows.map((r) => ({
        first_name: r.first_name,
        last_name: r.last_name,
        roll_number: r.roll_number,
        contact_mobile: normalizeIndianMobile(r.contact_mobile),
        contact_mail: r.contact_mail || undefined,
      }));
      const res = await bulkRegisterLearners({
        college_id: cid,
        program_id: bulkProgramId,
        class_id: bulkClassId,
        learners,
      });
      const data = res?.data?.data ?? res?.data ?? {};
      setBulkCreateResult({
        created: data.created ?? 0,
        createdIds: data.created_ids ?? data.createdIds ?? [],
        failed: data.failed ?? [],
        bulkImportBatchId: data.bulk_import_batch_id ?? data.bulkImportBatchId ?? null,
      });
      const created = Number(data.created ?? 0);
      const failures = (data.failed ?? []).length;
      if (failures) message.warning(`Created ${created}; ${failures} failed. Review the row report before retrying.`);
      else if (!created) message.error("No learners were created. Check the registration response.");
      else message.success(`Created ${created} learner(s).`);
      setBulkValidateResult(null);
      fetchData();
    } catch (err) {
      message.error("Bulk register failed: " + (err?.response?.data?.message || err?.message));
    }
    setBulkLoading(false);
  };

  const openImportHistory = async () => {
    setImportHistoryOpen(true);
    if (!collegeId) return;
    setImportHistoryLoading(true);
    try {
      const res = await fetchWithErrorHandling(getBulkImportBatches(collegeId));
      setImportHistory(res.success ? (res.data?.data ?? res.data ?? []) : []);
    } catch (e) {
      setImportHistory([]);
    }
    setImportHistoryLoading(false);
  };

  const downloadSampleCSV = () => {
    const header = "First Name,Last Name,Roll Number,Mobile Number,Email\n";
    const sample = "John,Doe,22CS001,9876543210,john@example.com\nJane,Smith,22CS002,9876543211,";
    const blob = new Blob([header + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_learners_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const classById = useMemo(() => new Map(classes.map((c) => [Number(c.id), c])), [classes]);
  const classProgramId = (c) => c?.programId ?? c?.program_id;
  const classBatchId = (c) => c?.batchId ?? c?.batch_id;
  const batchOptions = useMemo(() => {
    const seen = new Map();
    classes.forEach((c) => {
      const id = classBatchId(c);
      if (id == null || (filterProgram && Number(classProgramId(c)) !== Number(filterProgram))) return;
      if (!seen.has(Number(id))) seen.set(Number(id), c.batchName || c.batch_name || `Batch ${id}`);
    });
    return [...seen.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]))).map(([value, label]) => ({ value, label }));
  }, [classes, filterProgram]);
  const classFilterOptions = useMemo(() => classes
    .filter((c) => (!filterProgram || Number(classProgramId(c)) === Number(filterProgram))
      && (!filterBatch || Number(classBatchId(c)) === Number(filterBatch)))
    .map((c) => ({ value: c.id, label: c.name || `Class ${c.id}` }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label))), [classes, filterProgram, filterBatch]);
  const visibleStudents = useMemo(() => data.filter((st) => {
    const cls = classById.get(Number(st.classId));
    if (filterClass && Number(st.classId) !== Number(filterClass)) return false;
    if (filterBatch && Number(classBatchId(cls)) !== Number(filterBatch)) return false;
    if (filterProgram && Number(classProgramId(cls)) !== Number(filterProgram)) return false;
    if (filterStatus === "SUSPENDED" && !st.suspendedAt) return false;
    if (filterStatus === "ACTIVE" && st.suspendedAt) return false;
    // Typing in the search box used to only offer suggestions; the table ignored it until one was
    // picked, so "AUDIT-T1" + Enter showed all 149 students. Filter the table by what is typed too.
    const q = String(searchValue || "").trim().toLowerCase();
    if (q) {
      const hay = [st.firstName, st.lastName, `${st.firstName || ""} ${st.lastName || ""}`, st.rollNumber, st.contactMail, st.email, st.contactMobile]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [data, classById, filterProgram, filterBatch, filterClass, filterStatus, searchValue]);

  const columns = [
    {
      title: "Name",
      key: "name",
      sorter: (a, b) => `${a.firstName || ""} ${a.lastName || ""}`.localeCompare(`${b.firstName || ""} ${b.lastName || ""}`),
      render: (_, record) => `${record.firstName || ""} ${record.lastName || ""}`.trim() || "-"
    },
    { title: "Roll No.", dataIndex: "rollNumber", key: "rollNumber",
      sorter: (a, b) => String(a.rollNumber || "").localeCompare(String(b.rollNumber || ""), undefined, { numeric: true }) },
    { title: "Mobile", dataIndex: "contactMobile", key: "contactMobile" },
    { title: "Email", dataIndex: "contactMail", key: "contactMail", ellipsis: true },
    { 
      title: "Class", 
      dataIndex: "classId", 
      key: "classId",
      render: (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls?.name || classId || "-";
      }
    },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        record.suspendedAt
          ? <Tag color="orange">Suspended</Tag>
          : <Tag color="green">Active</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      // Pinned from tablet up: the last icon (Delete) sat past the table's right edge on a laptop.
      fixed: screens.md ? "right" : undefined,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={Boolean(rowActionBusy) || Boolean(classesLookupError) || Boolean(programsLookupError)}
            size="small"
            aria-label={`Edit student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
          />
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => setHistoryRecord(record)}
            size="small"
            title="Audit trail"
            aria-label={`View audit trail for student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
          />
          <Button
            type="text"
            icon={<IdcardOutlined />}
            onClick={() => setProfileRecord(record)}
            size="small"
            title="Profile (resume, skills, education, job preferences, identity...)"
            aria-label={`View profile for student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
          />
          {record.contactMobile && (
            <Popconfirm
              title="Clear OTP lockout?"
              description={`Lets ${record.firstName ?? "this student"} request a fresh OTP right away if they're currently rate-limited from too many attempts.`}
              disabled={Boolean(rowActionBusy)}
              onConfirm={() => handleClearOtp(record)}
            >
              <Button
                type="text"
                icon={<UnlockOutlined />}
                size="small"
                loading={rowActionBusy === `otp:${record.id}`}
                disabled={Boolean(rowActionBusy)}
                title="Clear OTP lockout"
                aria-label={`Clear OTP lockout for student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          )}
          {isSuperAdmin && !record.suspendedAt && (
            <Popconfirm
              title="Impersonate this student?"
              description="You'll be logged in as this student for support purposes. Use 'Exit impersonation' in the header to return to your own session."
              disabled={Boolean(rowActionBusy)}
              onConfirm={() => handleImpersonate(record)}
              okText="Log in as student"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<LoginOutlined />}
                size="small"
                loading={rowActionBusy === `impersonate:${record.id}`}
                disabled={Boolean(rowActionBusy)}
                title="Impersonate"
                aria-label={`Impersonate student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          )}
          {record.suspendedAt ? (
            <Popconfirm
              title="Reactivate Student"
              description="This student will be able to log in again."
              disabled={Boolean(rowActionBusy)}
              onConfirm={() => handleReactivate(record.id)}
              okText="Reactivate"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                size="small"
                loading={rowActionBusy === `reactivate:${record.id}`}
                disabled={Boolean(rowActionBusy)}
                aria-label={`Reactivate student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Suspend Student"
              description="Blocks login immediately and revokes any active session. Reversible — data and history are kept."
              disabled={Boolean(rowActionBusy)}
              onConfirm={() => handleSuspend(record.id)}
              okText="Suspend"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<StopOutlined />}
                size="small"
                loading={rowActionBusy === `suspend:${record.id}`}
                disabled={Boolean(rowActionBusy)}
                aria-label={`Suspend student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete Student"
            description="This permanently deletes the student and their records, including attendance. It can't be undone. To keep their history, suspend them instead."
            disabled={Boolean(rowActionBusy)}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, size: "large" }}
            cancelButtonProps={{ size: "large" }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={rowActionBusy === `delete:${record.id}`}
              disabled={Boolean(rowActionBusy)}
              aria-label={`Delete student ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PeoplePageOverview
        title="Students"
        description="Manage student identity, academic placement and account access from one roster. Bulk registration and high-impact access changes stay explicit and reviewable."
        metrics={isCollegeScoped ? [
          { label: "Students", value: allLearners.length },
          { label: "Active", value: allLearners.filter((item) => !item.suspendedAt).length },
          { label: "Suspended", value: allLearners.filter((item) => Boolean(item.suspendedAt)).length },
          { label: "Visible now", value: visibleStudents.length, hint: visibleStudents.length === allLearners.length ? "No roster filters applied" : "After search and filters" },
        ] : []}
        actions={isCollegeScoped ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRegisterOpen(["register"])}>
            Register students
          </Button>
        ) : null}
        note={isSuperAdmin && selectedStudentIds.length > 0
          ? `${selectedStudentIds.length} selected for bulk module-access actions below.`
          : null}
      />
      {!isCollegeScoped ? (
        <Alert
          type="warning"
          showIcon
          message="Select a College to manage Learners"
          description="Learners are treated as college-scoped in Superadmin to prevent cross-tenant edits."
        />
      ) : (
      <>
      <Collapse
        activeKey={registerOpen}
        onChange={(keys) => setRegisterOpen(Array.isArray(keys) ? keys : [keys])}
        style={{ marginBottom: 16 }}
        items={[{
          key: "register",
          label: <span><PlusOutlined /> Register students (one at a time or bulk CSV)</span>,
          children: (
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="Register New Student" size="small">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: "Enter the first name" }]}
                  >
                    <Input placeholder="First Name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: "Enter the last name" }]}
                  >
                    <Input placeholder="Last Name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="rollNumber"
                    label="Roll Number"
                    rules={[{ required: true, message: "Enter the roll number" }]}
                  >
                    <Input placeholder="e.g., 22CS101" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="contactMobile"
                    label="Mobile Number"
                    rules={[{ required: true, message: "Enter the mobile number" }, { pattern: /^\d{10}$/, message: "Mobile number must be 10 digits" }]}
                    extra="Used for OTP login"
                  >
                    <Input inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="contactMail" label="Email">
                <Input inputMode="email" autoComplete="email" placeholder="Email address" />
              </Form.Item>

              {/* No `name` here deliberately: this Form.Item used to be name="collegeId", but antd's
                  Form.Item injects its own value/onChange for a named field and silently
                  overrode whatever `value` was passed to the Input below � the field displayed
                  empty, not even the raw id the audit thought it showed. The real collegeId for
                  submission always comes from the `collegeId` prop (college_id: collegeId ??
                  values.collegeId in handleSubmit), never from this form field, so dropping
                  `name` here is safe and lets the Input's own `value` actually render. */}
              <Form.Item label="College">
                <Input value={collegeName || `College ${collegeId}`} disabled />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="programId"
                    label="Program"
                    rules={[{ required: true, message: "Choose a program" }]}
                  >
                    <Select placeholder={programsLookupError ? "Programs unavailable" : "Select program"}
                      disabled={Boolean(programsLookupError)}>
                      {programs.map((program) => (
                        <Option key={program.id} value={program.id}>
                          {program.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="classId"
                    label="Class/Section"
                    rules={[{ required: true, message: "Choose a class/section" }]}
                  >
                    <Select placeholder={classesLookupError ? "Classes unavailable" : "Select class"}
                      disabled={Boolean(classesLookupError)}>
                      {classes.map((cls) => (
                        <Option key={cls.id} value={cls.id}>
                          {cls.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="gender" label="Gender">
                    <Select placeholder="Select gender">
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="dob" label="Date of Birth">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="address" label="Address">
                <TextArea rows={2} placeholder="Address" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}
                  disabled={Boolean(classesLookupError) || Boolean(programsLookupError)}
                  icon={<PlusOutlined />} block>
                  Register Student
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Bulk Register Students" size="small">
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>College</div>
              <Input value={collegeName || `College ${collegeId}`} disabled />
            </div>
            <Form.Item label="Program">
              <Select
                placeholder={programsLookupError ? "Programs unavailable" : "Select program"}
                disabled={Boolean(programsLookupError)}
                value={bulkProgramId}
                onChange={(v) => { setBulkProgramId(v); setBulkClassId(null); setBulkValidateResult(null); }}
                style={{ width: "100%" }}
              >
                {programs.map((p) => (
                  <Option key={p.id} value={p.id}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Class">
              {bulkClassesError && (
                <Alert type="warning" showIcon style={{ marginBottom: 8 }}
                  message="Classes unavailable for this program"
                  description={bulkClassesError}
                  action={<Button size="small" onClick={() => setBulkClassesRetryKey((value) => value + 1)}>Retry classes</Button>} />
              )}
              <Select
                placeholder={bulkClassesLoading ? "Loading classes…" : bulkClassesError ? "Classes unavailable" : "Select class (after program)"}
                loading={bulkClassesLoading}
                value={bulkClassId}
                onChange={(v) => { setBulkClassId(v); setBulkValidateResult(null); }}
                disabled={!bulkProgramId || bulkClassesLoading || Boolean(bulkClassesError)}
                style={{ width: "100%" }}
              >
                {classesByProgram.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="CSV file (max 500 rows)">
              <Upload
                accept=".csv"
                maxCount={1}
                fileList={bulkFileList}
                onChange={handleBulkFileChange}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Choose CSV</Button>
              </Upload>
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                Required headers: First Name, Last Name, Roll Number, Mobile Number, Email. Email values are optional.
              </div>
              {parsedBulkRows.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">{parsedBulkRows.length} row(s) parsed</Tag>
                </div>
              )}
            </Form.Item>
            {bulkValidateResult && (
              (bulkValidateResult.duplicateRows?.length ?? 0) === 0 ? (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Validation successful"
                  description={`All ${bulkValidateResult.totalRows ?? 0} row(s) are ready to create. Select Program and Class above, then click Create.`}
                />
              ) : (
                <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 8 }}
                  message="Validation report"
                  description={
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {bulkValidateResult.existingMobiles?.length > 0 && (
                        <li>Existing in system (mobile): {bulkValidateResult.existingMobiles.length}</li>
                      )}
                      {bulkValidateResult.existingEmails?.length > 0 && (
                        <li>Existing in system (email): {bulkValidateResult.existingEmails.length}</li>
                      )}
                      {bulkValidateResult.existingRollNumbers?.length > 0 && (
                        <li>Existing roll numbers in college: {bulkValidateResult.existingRollNumbers.length}</li>
                      )}
                      {bulkValidateResult.duplicateMobilesInFile?.length > 0 && (
                        <li>Duplicate in file (mobile): {bulkValidateResult.duplicateMobilesInFile.length}</li>
                      )}
                      {bulkValidateResult.duplicateEmailsInFile?.length > 0 && (
                        <li>Duplicate in file (email): {bulkValidateResult.duplicateEmailsInFile.length}</li>
                      )}
                    </ul>
                  }
                />
                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                    Rows with issues ({bulkValidateResult.duplicateRows.length}) — fix these in your CSV:
                  </div>
                  <Table
                    size="small"
                    pagination={false}
                    scroll={{ x: 600 }}
                    dataSource={bulkValidateResult.duplicateRows}
                    rowKey={(r) => r.row}
                    columns={[
                      { title: "Row", dataIndex: "row", key: "row", width: 56 },
                      { title: "First Name", dataIndex: "first_name", key: "first_name", ellipsis: true },
                      { title: "Last Name", dataIndex: "last_name", key: "last_name", ellipsis: true },
                      { title: "Roll No.", dataIndex: "roll_number", key: "roll_number" },
                      { title: "Mobile", dataIndex: "contact_mobile", key: "contact_mobile" },
                      { title: "Email", dataIndex: "contact_mail", key: "contact_mail", ellipsis: true },
                      {
                        title: "Issue(s)",
                        key: "issues",
                        render: (_, record) => record.issues?.join("; ") || "-",
                      },
                    ]}
                  />
                </div>
              </>
              )
            )}
            {bulkCreateResult && (
              <Alert
                type={bulkCreateResult.failed?.length > 0 ? "warning" : "success"}
                showIcon
                style={{ marginBottom: 12 }}
                message={`Created ${bulkCreateResult.created}; failed ${bulkCreateResult.failed?.length ?? 0}`}
                description={
                  <>
                    {bulkCreateResult.failed?.length > 0 && (
                      <ul style={{ marginBottom: 8, paddingLeft: 20, maxHeight: 120, overflow: "auto" }}>
                        {bulkCreateResult.failed.slice(0, 20).map((f, i) => (
                          <li key={i}>Row {f.row}: {f.reason}</li>
                        ))}
                        {bulkCreateResult.failed.length > 20 && (
                          <li>... and {bulkCreateResult.failed.length - 20} more</li>
                        )}
                      </ul>
                    )}
                    {bulkCreateResult.bulkImportBatchId && bulkCreateResult.created > 0 && (
                      <div style={{ fontSize: 12, marginTop: 8 }}>
                        Imports can&apos;t be undone in one step, to protect students&apos; work. Correct or suspend individual accounts instead.
                      </div>
                    )}
                  </>
                }
              />
            )}
            <Space>
              <Button type="default" onClick={handleBulkValidate} loading={bulkValidateLoading}
                disabled={parsedBulkRows.length === 0 || bulkClassesLoading || Boolean(bulkClassesError)}>
                Validate
              </Button>
              <Button type="primary" onClick={handleBulkCreate} loading={bulkLoading} disabled={bulkLoading || bulkClassesLoading || Boolean(bulkClassesError) || !bulkValidateResult || bulkValidateResult.duplicateRows.length > 0 || bulkValidateResult.validationKey !== JSON.stringify([collegeId, bulkProgramId, bulkClassId, parsedBulkRows])}>
                Create
              </Button>
              <Button type="link" icon={<DownloadOutlined />} onClick={downloadSampleCSV}>
                Sample CSV
              </Button>
              <Button type="link" icon={<HistoryOutlined />} onClick={openImportHistory}>
                Import History
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
          ),
        }]}
      />
      <Row gutter={24}>
        <Col xs={24}>
          <Card
            title="Registered Students"
            size="small"
            extra={
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={fetchData} size="small">
                  Refresh
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  size="small"
                  disabled={visibleStudents.length === 0}
                  onClick={() => exportRowsToCsv(
                    "students.csv",
                    [
                      { label: "Name", key: "name" },
                      { label: "Roll No.", key: "rollNumber" },
                      { label: "Mobile", key: "contactMobile" },
                      { label: "Email", key: "contactMail" },
                      { label: "Class", key: "className" },
                      { label: "Gender", key: "gender" },
                      { label: "Status", key: "status" },
                    ],
                    visibleStudents.map((s) => ({
                      name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
                      rollNumber: s.rollNumber,
                      contactMobile: s.contactMobile,
                      contactMail: s.contactMail,
                      className: classes.find((c) => c.id === s.classId)?.name || s.classId || "",
                      gender: s.gender,
                      status: s.suspendedAt ? "Suspended" : "Active",
                    })),
                  )}
                >
                  Export CSV
                </Button>
                {searchValue && (
                  <Button onClick={clearSearch} size="small" type="link">
                    Clear Search
                  </Button>
                )}
              </Space>
            }
          >
            {loadError && (
              <Alert type="error" showIcon message="Could not load student roster" description={loadError}
                action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />
            )}
            {(classesLookupError || programsLookupError) && (
              <Alert type="warning" showIcon message="Some academic placement options are unavailable"
                description={[classesLookupError ? "classes" : null, programsLookupError ? "programs" : null].filter(Boolean).join(" and ") + " could not be verified. Registration and edit placement fields are disabled until you retry."}
                action={<Button size="small" onClick={fetchData}>Retry options</Button>} style={{ marginBottom: 12 }} />
            )}
            {/* Search Component */}
            <div style={{ marginBottom: 16 }}>
              <AutoComplete
                style={{ width: "100%" }}
                options={searchOptions}
                onSearch={handleSearch}
                onSelect={handleSelect}
                onFocus={handleFocus}
                value={searchValue}
                placeholder="Search students by name, email, roll number, or mobile (e.g., 'john', 'std', 'roll123')..."
                allowClear
                notFoundContent={
                  searchLoading ? (
                    <Spin size="small" />
                  ) : (
                    "No students found. Try a different search."
                  )
                }
                filterOption={false} // We handle filtering on the backend
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
              />
            </div>
            <Space wrap style={{ marginBottom: 12 }}>
              <Select allowClear placeholder="All programs" style={{ width: 180, maxWidth: "100%" }} value={filterProgram}
                onChange={(v) => { setFilterProgram(v ?? null); setFilterBatch(null); setFilterClass(null); }}
                options={programs.map((p) => ({ value: p.id, label: p.name }))} aria-label="Filter by program" />
              <Select allowClear placeholder="All batches" style={{ width: 170, maxWidth: "100%" }} value={filterBatch}
                onChange={(v) => { setFilterBatch(v ?? null); setFilterClass(null); }}
                options={batchOptions} aria-label="Filter by batch" />
              <Select allowClear showSearch optionFilterProp="label" placeholder="All classes" style={{ width: 170, maxWidth: "100%" }}
                value={filterClass} onChange={(v) => setFilterClass(v ?? null)} options={classFilterOptions} aria-label="Filter by class" />
              <Select allowClear placeholder="Any status" style={{ width: 130, maxWidth: "100%" }} value={filterStatus}
                onChange={(v) => setFilterStatus(v ?? null)} aria-label="Filter by status"
                options={[{ value: "ACTIVE", label: "Active" }, { value: "SUSPENDED", label: "Suspended" }]} />
              <span style={{ color: "#8c8c8c" }}>
                {visibleStudents.length === data.length ? `${data.length} students` : `${visibleStudents.length} of ${data.length} students`}
              </span>
              {(filterProgram || filterBatch || filterClass || filterStatus) && (
                <Button type="link" size="small" onClick={() => { setFilterProgram(null); setFilterBatch(null); setFilterClass(null); setFilterStatus(null); }}>
                  Clear filters
                </Button>
              )}
            </Space>
            {/* Module access in bulk. A college has thousands of students, so "switch Placements
                off for the first years" has to be a filter-then-select action — doing it one
                student at a time on the Module Access page would be unusable at that scale. */}
            {isSuperAdmin && selectedStudentIds.length > 0 && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message={`${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? "" : "s"} selected`}
                description={
                  <Space wrap size={8} style={{ marginTop: 8 }}>
                    <Select
                      value={bulkModule}
                      onChange={setBulkModule}
                      style={{ width: 190 }}
                      options={[
                        { value: "placements", label: "Placements" },
                        { value: "projects", label: "Projects" },
                      ]}
                      aria-label="Module to change for selected students"
                    />
                    <Button
                      loading={bulkModuleSaving}
                      onClick={() => handleBulkModuleAccess(true)}
                    >
                      Turn on
                    </Button>
                    <Button
                      danger
                      loading={bulkModuleSaving}
                      onClick={() => handleBulkModuleAccess(false)}
                    >
                      Turn off
                    </Button>
                    <Button
                      type="text"
                      loading={bulkModuleSaving}
                      onClick={() => handleBulkModuleAccess(null)}
                    >
                      Reset to inherit
                    </Button>
                    <Button type="link" onClick={() => setSelectedStudentIds([])}>
                      Clear selection
                    </Button>
                  </Space>
                }
              />
            )}
            <Table
              dataSource={visibleStudents}
              columns={columns}
              rowKey="id"
              loading={tableLoading}
              size="small"
              rowSelection={isSuperAdmin ? {
                selectedRowKeys: selectedStudentIds,
                onChange: (keys) => setSelectedStudentIds(keys),
                preserveSelectedRowKeys: true,
              } : undefined}
              pagination={{ defaultPageSize: 25, pageSizeOptions: [25, 50, 100, 200], showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: data.length ? "No students match these filters." : "No students found. Register students to get started." }}
            />
          </Card>
        </Col>
      </Row>
      </>
      )}

      {/* Edit Modal */}
      <Modal
        title="Edit Student"
        open={editModalVisible}
        onOk={() => editForm.submit()}
        onCancel={handleEditCancel}
        confirmLoading={editLoading}
        okText="Save Changes"
        cancelText="Cancel"
        width={600}
        maskClosable={false}
        closable={!editLoading}
        keyboard={!editLoading}
        cancelButtonProps={{ disabled: editLoading }}
        className="admin-list-page-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: "Enter the first name" }]}
              >
                <Input placeholder="First Name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: "Enter the last name" }]}
              >
                <Input placeholder="Last Name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="rollNumber"
                label="Roll Number"
                rules={[{ required: true, message: "Enter the roll number" }]}
              >
                <Input placeholder="e.g., 22CS101" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="contactMobile"
                label="Mobile Number"
                rules={[{ required: true, message: "Enter the mobile number" }, { pattern: /^\d{10}$/, message: "Mobile number must be 10 digits" }]}
              >
                <Input inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={10} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="contactMail" label="Email">
            <Input inputMode="email" autoComplete="email" placeholder="Email address" />
          </Form.Item>

          {/* No `name` here — see the matching comment on the Register form's College field. */}
          <Form.Item label="College">
            <Input value={collegeName || `College ${collegeId}`} disabled />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="programId"
                label="Program"
                rules={[{ required: true, message: "Choose a program" }]}
              >
                <Select placeholder={programsLookupError ? "Programs unavailable" : "Select program"}
                  disabled={Boolean(programsLookupError)}>
                  {programs.map((program) => (
                    <Option key={program.id} value={program.id}>
                      {program.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="classId"
                label="Class/Section"
                rules={[{ required: true, message: "Choose a class/section" }]}
              >
                <Select placeholder={classesLookupError ? "Classes unavailable" : "Select class"}
                  disabled={Boolean(classesLookupError)}>
                  {classes.map((cls) => (
                    <Option key={cls.id} value={cls.id}>
                      {cls.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="gender" label="Gender">
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dob" label="Date of Birth">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <TextArea rows={2} placeholder="Address" />
          </Form.Item>
        </Form>
      </Modal>

      {historyRecord && (
        <Modal
          open
          onCancel={() => setHistoryRecord(null)}
          footer={null}
          width={800}
          title={`Audit trail — ${historyRecord.firstName || ""} ${historyRecord.lastName || ""}`.trim()}
        >
          <AuditLogs fixedCollegeId={collegeId} hideFilters fixedEntityId={String(historyRecord.id)} fixedEntityType="learner" />
        </Modal>
      )}

      <Modal
        open={importHistoryOpen}
        onCancel={() => setImportHistoryOpen(false)}
        footer={[<Button key="close" onClick={() => setImportHistoryOpen(false)}>Close</Button>]}
        title="Bulk import history"
        width={640}
      >
        <Spin spinning={importHistoryLoading}>
          {importHistory.length === 0 ? (
            <div style={{ color: "#888" }}>No bulk imports on file for this college.</div>
          ) : (
            <Table
              size="small"
              rowKey={(b) => b.bulkImportBatchId ?? b.bulk_import_batch_id}
              dataSource={importHistory}
              pagination={false}
              columns={[
                {
                  title: "When",
                  key: "importedAt",
                  render: (_, b) => {
                    // Server UTC timestamp, often a Jackson array; dayjs(array) printed "Invalid Date".
                    const at = b.importedAt ?? b.imported_at;
                    return at ? formatTimestamp(at) : "-";
                  },
                },
                { title: "Students", key: "count", render: (_, b) => b.learnerCount ?? b.learner_count ?? 0 },
                // The "Recovery" column repeated the same sentence on every row; it is said once above.
              ]}
            />
          )}
        </Spin>
      </Modal>

      {profileRecord && (
        <Modal
          open
          onCancel={() => setProfileRecord(null)}
          footer={null}
          width={860}
          title={`Profile — ${profileRecord.firstName || ""} ${profileRecord.lastName || ""}`.trim()}
          destroyOnClose
        >
          <ProfileSectionsPanel role="learner" id={profileRecord.id} />
        </Modal>
      )}
    </>
  );
};

export default Students;
