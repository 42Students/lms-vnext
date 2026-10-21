import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { Form, Input, Button, Table, Card, Row, Col, message, Select, DatePicker, Tag, Space, Popconfirm, Modal, AutoComplete, Spin, Upload, Alert, Collapse, Grid } from "antd";
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined, StopOutlined, CheckCircleOutlined, LoginOutlined, HistoryOutlined, IdcardOutlined, SwapOutlined, UnlockOutlined } from "@ant-design/icons";
import ProfileSectionsPanel from "@/components/admin/ProfileSectionsPanel";
import { bulkReassignFacultySchedule, clearOtpLockout } from "@/api/Services/AdminService";
import { suspendUser, reactivateUser, impersonateUser } from "@/api/Services/AdminUserLifecycleService";
import { exportRowsToCsv } from "@/utils/csvExport";
import { parseAdminBulkCsv } from "@/utils/bulkCsvParse";
import { normalizeIndianMobile } from "@/utils/onboardingPhone";
import { setAccessToken, setRefreshToken } from "@/utils/authUtils";
import AuditLogs from "./AuditLogs";
import PeoplePageOverview from "@/components/admin/people/PeoplePageOverview";
import { registerFaculty, getFacultyByCollegeId, getDepartmentsByCollege, updateFaculty, deleteFaculty, fetchWithErrorHandling, bulkValidateFaculty, bulkRegisterFaculty } from "@/api/Services/AdminService";
import { handleRegistrationError } from "@/utils/errorHandlers";
import { searchFaculty, getPopularFaculty, recordFacultySelection } from "@/api/Services/FacultySearchService";
import { debounce } from "lodash";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Faculty types in words for the list (the column showed PERMANENT, ADMIN, TPO, ...).
const FACULTY_TYPE_LABELS = {
  ADMIN: "College admin", TPO: "Placement officer", PROFESSOR: "Professor", ASSOCIATE_PROFESSOR: "Associate professor",
  ASSISTANT_PROFESSOR: "Assistant professor", LECTURER: "Lecturer", HEAD: "Head of department", COORDINATOR: "Coordinator",
  MENTOR: "Mentor", PERMANENT: "Permanent", VISITING: "Visiting", GUEST: "Guest", CONTRACT: "Contract", ADJUNCT: "Adjunct",
};

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

const Faculty = ({ collegeId }) => {
  const loginUser = useSelector((state) => state.loginUser);
  const screens = Grid.useBreakpoint();
  // Impersonation is superadmin-only (id 0) — never exposed to a college admin, matching the
  // security posture of every other superadmin-exclusive tool in this panel.
  const isSuperAdmin = loginUser?.id === 0 && loginUser?.userType === "FACULTY";
  const [historyRecord, setHistoryRecord] = useState(null);
  const [profileRecord, setProfileRecord] = useState(null);
  // W1 in the audit -- a departed faculty member's remaining timetable couldn't be reassigned.
  const [reassignRecord, setReassignRecord] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignReport, setReassignReport] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(null);
  // Roster filters (client-side over the loaded roster); the list used to be one search box.
  const [filterDept, setFilterDept] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [registerOpen, setRegisterOpen] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [rowActionBusy, setRowActionBusy] = useState(null);

  // Search functionality
  const [searchValue, setSearchValue] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [popularFaculty, setPopularFaculty] = useState([]);
  // Read inside showDefaultSuggestions so debouncedSearch below doesn't need popularFaculty in
  // its dependency array — recreating the debounce on every popular-list update would drop any
  // in-flight timer (narrow window right after mount, but a real smell).
  const popularFacultyRef = useRef(popularFaculty);
  useEffect(() => {
    popularFacultyRef.current = popularFaculty;
  }, [popularFaculty]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allFaculty, setAllFaculty] = useState([]); // Keep full list for filtering

  // Bulk register state
  const [bulkCollegeId, setBulkCollegeId] = useState(null);
  const [bulkFileList, setBulkFileList] = useState([]);
  const [parsedBulkRows, setParsedBulkRows] = useState([]);
  const [bulkValidateResult, setBulkValidateResult] = useState(null);
  const [bulkCreateResult, setBulkCreateResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkValidateLoading, setBulkValidateLoading] = useState(false);
  const [bulkDepartments, setBulkDepartments] = useState([]);
  const [bulkDepartmentsLoading, setBulkDepartmentsLoading] = useState(false);
  const [bulkDepartmentsError, setBulkDepartmentsError] = useState(null);
  const [bulkDeptId, setBulkDeptId] = useState(null);

  const MAX_BULK_ROWS = 500;
  const BULK_REQUIRED_COLUMNS = ["First Name", "Last Name", "Mobile Number", "Email"];

  const isCollegeScoped = collegeId != null && Number.isFinite(Number(collegeId));
  const recentFacultyKey = useMemo(
    () => `recentFaculty:${loginUser?.id ?? "anonymous"}:${collegeId ?? "no-college"}`,
    [loginUser?.id, collegeId]
  );
  const readRecentFaculty = () => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(recentFacultyKey) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      localStorage.removeItem(recentFacultyKey);
      return [];
    }
  };
  // NOTE: Don't early-return before hooks (React rules-of-hooks).

  const fetchData = async () => {
    setTableLoading(true);
    setLoadError("");
    const apiCall = getFacultyByCollegeId(collegeId);
    const result = await fetchWithErrorHandling(apiCall);
    if (result.success) {
      const faculty = Array.isArray(result.data) ? result.data : [];
      setAllFaculty(faculty);
      setData(faculty);
    } else {
      setLoadError(result.message || "Failed to load faculty");
    }
    setTableLoading(false);
  };

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    setDepartmentsError(null);
    const apiCall = getDepartmentsByCollege(collegeId);
    const result = await fetchWithErrorHandling(apiCall);
    setDepartmentsLoading(false);
    if (result.success && Array.isArray(result.data)) {
      setDepartments(result.data);
      return;
    }
    setDepartments([]);
    setDepartmentsError(result?.message || result?.data?.message || "Could not load departments");
  };

  // Load popular faculty on component mount
  const loadPopularFaculty = async () => {
    try {
      const response = await getPopularFaculty(10);
      if (response?.data?.data) {
        setPopularFaculty(response.data.data);
        showDefaultSuggestions();
      }
    } catch (error) {
      // silently ignore
    }
  };

  // Show default search suggestions
  const showDefaultSuggestions = () => {
    const recent = readRecentFaculty();
    const suggestions = [];

    if (recent.length > 0) {
      suggestions.push({
        label: "Recent",
        options: recent.slice(0, 5).map(faculty => ({
          value: faculty.displayName || `${faculty.firstName} ${faculty.lastName}`,
          label: (
            <div>
              <div>{faculty.displayName || `${faculty.firstName} ${faculty.lastName}`}</div>
              {faculty.facultyType && (
                <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                  {faculty.facultyType.replace('_', ' ')}
                </Tag>
              )}
              {faculty.deptName && (
                <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                  {faculty.deptName}
                </Tag>
              )}
            </div>
          ),
          faculty: faculty,
        })),
      });
    }

    const currentPopularFaculty = popularFacultyRef.current;
    if (currentPopularFaculty.length > 0) {
      suggestions.push({
        label: "Popular",
        options: currentPopularFaculty.slice(0, 5).map(faculty => ({
          value: faculty.displayName || `${faculty.firstName} ${faculty.lastName}`,
          label: (
            <div>
              <div>{faculty.displayName || `${faculty.firstName} ${faculty.lastName}`}</div>
              {faculty.facultyType && (
                <Tag color="volcano" style={{ fontSize: 10, marginTop: 4 }}>
                  {faculty.facultyType.replace('_', ' ')}
                </Tag>
              )}
              {faculty.deptName && (
                <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                  {faculty.deptName}
                </Tag>
              )}
            </div>
          ),
          faculty: faculty,
        })),
      });
    }

    setSearchOptions(suggestions);
  };

  // Debounced search function
  // BE-0197: only the newest search, for the current college, may fill the suggestions.
  const facultySearchSeq = useRef(0);
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query) => {
        const seq = ++facultySearchSeq.current;
        if (!query || query.trim().length < 1) {
          showDefaultSuggestions();
          setSearchLoading(false);
          return;
        }

        setSearchLoading(true);
        try {
          const response = await searchFaculty(query.trim(), 15, collegeId);
          if (seq !== facultySearchSeq.current) return;
          if (response?.data?.status === "success" && response?.data?.data) {
            const inCollege = response.data.data.filter((f) => collegeId == null || f?.collegeId == null || Number(f.collegeId) === Number(collegeId));
            const formatted = inCollege.map(faculty => ({
              value: faculty.displayName || `${faculty.firstName} ${faculty.lastName}`,
              label: (
                <div>
                  <div>{faculty.displayName || `${faculty.firstName} ${faculty.lastName}`}</div>
                  {faculty.facultyType && (
                    <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                      {faculty.facultyType.replace('_', ' ')}
                    </Tag>
                  )}
                  {faculty.deptName && (
                    <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                      {faculty.deptName}
                    </Tag>
                  )}
                </div>
              ),
              faculty: faculty,
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
          if (seq === facultySearchSeq.current) setSearchOptions([]);
        } finally {
          if (seq === facultySearchSeq.current) setSearchLoading(false);
        }
      }, 200),
    [collegeId]
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // Handle search input
  const handleSearch = (value) => {
    setSearchValue(value);
    facultySearchSeq.current += 1;
    debouncedSearch(value);
  };

  // Handle faculty selection
  const handleSelect = (value, option) => {
    const faculty = option.faculty;
    if (!faculty) return;

    // Save to recent faculty
    const recent = readRecentFaculty();
    const updated = [
      faculty,
      ...recent.filter((f) => f.id !== faculty.id),
    ].slice(0, 10);
    localStorage.setItem(recentFacultyKey, JSON.stringify(updated));

    // Record selection for popularity
    if (faculty.id) {
      recordFacultySelection(faculty.id).catch(() => {});
    }

    // Never blank the college roster because a cached/search suggestion is stale or out of scope.
    const selectedFaculty = allFaculty.filter(f => f.id === faculty.id);
    if (selectedFaculty.length === 0) {
      message.warning("That faculty member is not in the current college roster.");
      setSearchValue("");
      setSearchOptions([]);
      return;
    }
    setData(selectedFaculty);
    setSearchValue("");
    setSearchOptions([]);
  };

  // Handle focus - show suggestions
  const handleFocus = () => {
    if (!searchValue) {
      showDefaultSuggestions();
    }
  };

  // Clear search and show all faculty
  const clearSearch = () => {
    setSearchValue("");
    setData(allFaculty);
    setSearchOptions([]);
  };

  useEffect(() => {
    if (!isCollegeScoped) return;
    fetchData();
    fetchDepartments();
    form.setFieldsValue({ collegeId });
    loadPopularFaculty();
  }, [collegeId]);

  // Departments for bulk: when college-scoped use departments; else load by bulkCollegeId
  useEffect(() => {
    if (!isCollegeScoped) return;
    if (collegeId) {
      setBulkDepartments(departments);
      setBulkDepartmentsError(departmentsError);
      setBulkDepartmentsLoading(departmentsLoading);
      return;
    }
    if (!bulkCollegeId) {
      setBulkDepartments([]);
      setBulkDeptId(null);
      setBulkDepartmentsError(null);
      setBulkDepartmentsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setBulkDepartmentsLoading(true);
      setBulkDepartmentsError(null);
      setBulkDeptId(null);
      const result = await fetchWithErrorHandling(getDepartmentsByCollege(bulkCollegeId));
      if (cancelled) return;
      setBulkDepartmentsLoading(false);
      if (result.success && Array.isArray(result.data)) {
        setBulkDepartments(result.data);
      } else {
        setBulkDepartments([]);
        setBulkDepartmentsError(result?.message || result?.data?.message || "Could not load departments");
      }
    };
    load();
    return () => { cancelled = true; };
  }, [collegeId, bulkCollegeId, departments, departmentsError, departmentsLoading]);

  // Update search options when popular faculty change
  useEffect(() => {
    if (!isCollegeScoped) return;
    if (!searchValue && popularFaculty.length > 0) {
      showDefaultSuggestions();
    }
  }, [searchValue, popularFaculty]);

  const handleSubmit = async (values) => {
    if (loading || departmentsLoading || departmentsError) {
      if (departmentsError) message.error("Departments are unavailable. Retry before registering faculty.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        first_name: (values.firstName || "").trim(),
        last_name: (values.lastName || "").trim(),
        contact_mobile: (values.contactMobile || "").trim(),
        contact_mail: (values.contactMail || "").trim(),
        college_id: collegeId ?? values.collegeId,
        dept_id: values.deptId,
        faculty_type: values.facultyType,
        gender: (values.gender || "").trim(),
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        department: (values.departmentName || "").trim(),
        address: (values.address || "").trim(),
        description: (values.description || "").trim(),
      };
      await registerFaculty(payload);
      message.success("Faculty registered successfully! They can now login with their mobile number.");
      form.resetFields();
      fetchData();
    } catch (error) {
      handleRegistrationError(error, "faculty", (errorMsg) => {
        message.error("Failed to register faculty: " + errorMsg);
      });
    }
    setLoading(false);
  };

  const handleEdit = (record) => {
    if (departmentsLoading || departmentsError || rowActionBusy) {
      message.warning("Reload departments before editing faculty details.");
      return;
    }
    setEditingRecord(record);
    editForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      contactMobile: record.contactMobile,
      contactMail: record.contactMail,
      collegeId: record.collegeId,
      deptId: record.deptId,
      facultyType: record.facultyType,
      gender: record.gender,
      dob: parseDob(record.dob),
      address: record.address,
      description: record.description,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (departmentsLoading || departmentsError) {
      message.error("Departments are unavailable. Retry before saving.");
      return;
    }
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      
      const payload = {
        first_name: (values.firstName || "").trim(),
        last_name: (values.lastName || "").trim(),
        contact_mobile: (values.contactMobile || "").trim(),
        contact_mail: (values.contactMail || "").trim(),
        college_id: collegeId ?? values.collegeId ?? editingRecord.collegeId,
        dept_id: values.deptId,
        faculty_type: values.facultyType,
        gender: (values.gender || "").trim(),
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        address: (values.address || "").trim(),
        description: (values.description || "").trim(),
      };
      
      await updateFaculty(editingRecord.id, payload);
      message.success("Faculty updated successfully!");
      finishEditClose();
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error("Failed to update faculty: " + (error?.response?.data?.message || error.message));
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (rowActionBusy) return;
    setRowActionBusy(`delete:${id}`);
    try {
      await deleteFaculty(id);
      message.success("Faculty deleted successfully!");
      fetchData();
    } catch (error) {
      message.error("Failed to delete faculty: " + (error?.response?.data?.message || error.message));
    } finally { setRowActionBusy(null); }
  };

  // Reversible alternative to delete — the account keeps its data/history but can't log in
  // (backend blocks the OTP-verify step and immediately invalidates any live session/token).
  const handleSuspend = async (id) => {
    if (rowActionBusy) return;
    setRowActionBusy(`suspend:${id}`);
    try {
      await suspendUser("FACULTY", id);
      message.success("Faculty suspended");
      fetchData();
    } catch (error) {
      message.error("Failed to suspend faculty: " + (error?.response?.data?.error || error?.response?.data?.message || error.message));
    } finally { setRowActionBusy(null); }
  };

  const handleReactivate = async (id) => {
    if (rowActionBusy) return;
    setRowActionBusy(`reactivate:${id}`);
    try {
      await reactivateUser("FACULTY", id);
      message.success("Faculty reactivated");
      fetchData();
    } catch (error) {
      message.error("Failed to reactivate faculty: " + (error?.response?.data?.message || error.message));
    } finally { setRowActionBusy(null); }
  };

  const handleReassignSchedule = async () => {
    if (reassignLoading || !reassignRecord || !reassignTargetId) return;
    setReassignLoading(true);
    setReassignReport(null);
    try {
      const res = await bulkReassignFacultySchedule(reassignRecord.id, reassignTargetId);
      const report = res?.data?.data ?? res?.data ?? null;
      setReassignReport(report);
      if (report?.reassigned > 0) {
        message.success(`Reassigned ${report.reassigned} of ${report.scanned} upcoming session(s)`);
      } else if (report?.scanned === 0) {
        message.info("This faculty has no upcoming class schedules to reassign.");
      }
    } catch (error) {
      message.error("Failed to reassign: " + (error?.response?.data?.message || error.message));
    }
    setReassignLoading(false);
  };

  // The bulk move is a single write that reports per-session results; keep the dialog until it answers.
  const closeReassignSchedule = () => {
    if (reassignLoading) return;
    setReassignRecord(null);
  };

  // Login-as-user: stores the new tokens then does a full page navigation (not a client-side
  // route change) so the app's own boot sequence rebuilds Redux/loginUser state from scratch
  // against the new identity — safer than trying to hand-construct a matching partial state here.
  const handleImpersonate = async (record) => {
    if (rowActionBusy) return;
    setRowActionBusy(`impersonate:${record.id}`);
    try {
      const res = await impersonateUser("FACULTY", record.id);
      const data = res?.data;
      if (!data?.accessToken) throw new Error("Impersonation did not return a session token");
      setAccessToken(data.accessToken);
      if (data?.refreshToken) setRefreshToken(data.refreshToken);
      message.success(`Acting as ${record.firstName || "faculty"} ${record.lastName || ""}`.trim());
      const ft = String(record.facultyType || "").toUpperCase();
      window.location.href = ft === "MENTOR" ? "/mentor/projects" : ft === "ADMIN" ? "/college-admin/dashboard" : "/teacher/courses";
    } catch (error) {
      setRowActionBusy(null);
      message.error("Failed to impersonate: " + (error?.response?.data?.error || error?.response?.data?.message || error.message));
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
    if (!editForm.isFieldsTouched()) {
      finishEditClose();
      return;
    }
    Modal.confirm({
      title: "Discard faculty edits?",
      content: "Your unsaved changes will be lost.",
      okText: "Discard edits",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: finishEditClose,
    });
  };

  // --- Bulk register: CSV parse and validate/create ---
  function parseBulkCSV(text) {
    return parseAdminBulkCsv(text, BULK_REQUIRED_COLUMNS, (get) => ({
      first_name: get("First Name"),
      last_name: get("Last Name"),
      contact_mobile: get("Mobile Number"),
      contact_mail: get("Email") || undefined,
      faculty_type: (get("Faculty Type") || "LECTURER").trim().toUpperCase(),
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
        const { rows, error } = parseBulkCSV(e.target.result);
        if (error) {
          message.error(error);
          setBulkFileList([]);
          return;
        }
        setParsedBulkRows(rows);
        message.success(`Parsed ${rows.length} row(s). Select college if needed, then Validate or Create.`);
      } catch (err) {
        message.error("Failed to parse CSV: " + (err?.message || "Invalid file"));
        setBulkFileList([]);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleBulkValidate = async () => {
    const cid = collegeId ?? bulkCollegeId;
    if (!cid || !bulkDeptId || !parsedBulkRows.length) {
      // A college admin has no college picker, so only name what they can actually choose.
      const missing = [!cid && "a college", !bulkDeptId && "a department", !parsedBulkRows.length && "a CSV file"].filter(Boolean);
      message.warning(`Choose ${missing.join(" and ")} before validating.`);
      return;
    }
    const validationKey = JSON.stringify([cid, bulkDeptId, parsedBulkRows]);
    const mobiles = parsedBulkRows.map((r) => normalizeIndianMobile(r.contact_mobile)).filter(Boolean);
    const emails = parsedBulkRows.map((r) => r.contact_mail?.trim().toLowerCase()).filter(Boolean);
    setBulkValidateLoading(true);
    setBulkValidateResult(null);
    try {
      const res = await bulkValidateFaculty({ mobiles, emails, college_id: cid });
      const data = res?.data?.data ?? res?.data ?? {};
      const existingMobiles = data.existing_mobiles ?? data.existingMobiles ?? [];
      const existingEmails = data.existing_emails ?? data.existingEmails ?? [];
      const existingMobileSet = new Set(existingMobiles.map((m) => normalizeIndianMobile(m)).filter(Boolean));
      const existingEmailSet = new Set(existingEmails.map((e) => String(e).trim().toLowerCase()));
      const count = (values) => values.reduce((acc, val) => { if (val) acc[val] = (acc[val] || 0) + 1; return acc; }, {});
      const mobileCounts = count(mobiles);
      const emailCounts = count(emails);
      const duplicateMobilesInFile = Object.keys(mobileCounts).filter((m) => mobileCounts[m] > 1);
      const duplicateEmailsInFile = Object.keys(emailCounts).filter((e) => emailCounts[e] > 1);
      const duplicateRows = parsedBulkRows.map((r, i) => {
        const mobile = normalizeIndianMobile(r.contact_mobile);
        const email = String(r.contact_mail || "").trim().toLowerCase();
        const issues = [];
        if (!String(r.first_name || "").trim()) issues.push("First name required");
        if (!String(r.last_name || "").trim()) issues.push("Last name required");
        if (!mobile) issues.push("Valid 10-digit mobile required");
        if (!["LECTURER", "MENTOR"].includes(String(r.faculty_type || "").toUpperCase())) {
          issues.push("Faculty Type must be LECTURER or MENTOR");
        }
        if (mobile && existingMobileSet.has(mobile)) issues.push("Mobile already in system");
        if (mobile && mobileCounts[mobile] > 1) issues.push("Duplicate mobile in file");
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push("Invalid email");
        if (email && existingEmailSet.has(email)) issues.push("Email already in system");
        if (email && emailCounts[email] > 1) issues.push("Duplicate email in file");
        return issues.length ? { ...r, row: i + 1, issues } : null;
      }).filter(Boolean);
      setBulkValidateResult({ existingMobiles, existingEmails, duplicateMobilesInFile,
        duplicateEmailsInFile, duplicateRows, totalRows: parsedBulkRows.length, validationKey });
      if (!duplicateRows.length) message.success(`Validation passed for ${parsedBulkRows.length} faculty member(s).`);
    } catch (error) {
      setBulkValidateResult(null);
      message.error("Validation failed: " + (error?.response?.data?.message || error?.message || "Please retry"));
    } finally { setBulkValidateLoading(false); }
  };

  const handleBulkCreate = async () => {
    const cid = collegeId ?? bulkCollegeId;
    if (!cid) {
      message.error("Select a college (or open this page for a specific college).");
      return;
    }
    if (!bulkDeptId) {
      message.error("Select a department.");
      return;
    }
    const deptList = collegeId ? departments : bulkDepartments;
    if (deptList.length === 0) {
      message.error("Select a college first to load departments.");
      return;
    }
    if (parsedBulkRows.length === 0) {
      message.warning("Upload a CSV first.");
      return;
    }
    const validationKey = JSON.stringify([cid, bulkDeptId, parsedBulkRows]);
    if (!bulkValidateResult || bulkValidateResult.validationKey !== validationKey || bulkValidateResult.duplicateRows.length) {
      message.error("Validate this exact faculty roster and department before creating accounts.");
      return;
    }
    setBulkLoading(true);
    setBulkCreateResult(null);
    try {
      const faculty = parsedBulkRows.map((r) => ({
        first_name: r.first_name,
        last_name: r.last_name,
        contact_mobile: normalizeIndianMobile(r.contact_mobile),
        dept_id: bulkDeptId,
        contact_mail: r.contact_mail || undefined,
        faculty_type: String(r.faculty_type || "LECTURER").toUpperCase(),
      }));
      const res = await bulkRegisterFaculty({ college_id: cid, faculty });
      const data = res?.data?.data ?? res?.data ?? {};
      const backendFailed = (data.failed || []).map((f) => ({
        row: f.row,
        reason: f.reason,
        mobile: f.mobile,
        email: f.email,
        dept_id: f.dept_id,
      }));
      setBulkCreateResult({
        created: data.created ?? 0,
        createdIds: data.created_ids ?? data.createdIds ?? [],
        failed: backendFailed ?? [],
      });
      const created = Number(data.created ?? 0);
      if (backendFailed.length) message.warning(`Created ${created}; ${backendFailed.length} failed. Review the row report.`);
      else if (!created) message.error("No faculty were created. Check the registration response.");
      else message.success(`Created ${created} faculty.`);
      setBulkValidateResult(null);
      fetchData();
    } catch (err) {
      message.error("Bulk register failed: " + (err?.response?.data?.message || err?.message));
    }
    setBulkLoading(false);
  };

  const downloadSampleCSV = () => {
    const header = "First Name,Last Name,Mobile Number,Email,Faculty Type\n";
    const sample = "John,Doe,9876543210,john@example.com,LECTURER\nJane,Smith,9876543211,,MENTOR";
    const blob = new Blob([header + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_faculty_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deptName = (id) => departments.find((d) => Number(d.id) === Number(id))?.name;
  const facultyTypeOptions = useMemo(() => [...new Set(data.map((x) => x.facultyType).filter(Boolean))]
    .sort().map((t) => ({ value: t, label: FACULTY_TYPE_LABELS[String(t).toUpperCase()] || String(t).replace(/_/g, " ") })), [data]);
  const visibleFaculty = useMemo(() => data.filter((x) => {
    if (filterDept && Number(x.deptId ?? x.dept_id) !== Number(filterDept)) return false;
    if (filterType && x.facultyType !== filterType) return false;
    if (filterStatus === "SUSPENDED" && !x.suspendedAt) return false;
    if (filterStatus === "ACTIVE" && x.suspendedAt) return false;
    return true;
  }), [data, filterDept, filterType, filterStatus]);

  const columns = [
    {
      title: "Name",
      key: "name",
      sorter: (a, b) => `${a.firstName || ""} ${a.lastName || ""}`.localeCompare(`${b.firstName || ""} ${b.lastName || ""}`),
      render: (_, record) => `${record.firstName || ""} ${record.lastName || ""}`.trim() || "-"
    },
    { title: "Department", key: "dept", render: (_, r) => deptName(r.deptId ?? r.dept_id) || "-" },
    { title: "Mobile", dataIndex: "contactMobile", key: "contactMobile" },
    { title: "Email", dataIndex: "contactMail", key: "contactMail", ellipsis: true },
    { 
      title: "Type", 
      dataIndex: "facultyType", 
      key: "facultyType",
      render: (type) => type ? <Tag color="blue">{FACULTY_TYPE_LABELS[String(type).toUpperCase()] || type}</Tag> : "-"
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
      // Pinned from tablet up: the last icons sat past the table's right edge on a laptop.
      fixed: screens.md ? "right" : undefined,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={departmentsLoading || Boolean(departmentsError) || Boolean(rowActionBusy)}
            size="small"
            title="Edit"
            aria-label={`Edit faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
          />
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => setHistoryRecord(record)}
            size="small"
            title="Audit trail"
            aria-label={`View audit trail for faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
          />
          <Button
            type="text"
            icon={<IdcardOutlined />}
            onClick={() => setProfileRecord(record)}
            size="small"
            title="Profile (education, skills, publications, identity...)"
            aria-label={`View profile for faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
          />
          <Button
            type="text"
            icon={<SwapOutlined />}
            onClick={() => { setReassignRecord(record); setReassignTargetId(null); setReassignReport(null); }}
            disabled={Boolean(rowActionBusy)}
            size="small"
            title="Reassign this faculty's upcoming class schedules to someone else"
            aria-label={`Reassign class schedules for faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
          />
          {record.contactMobile && (
            <Popconfirm
              title="Clear OTP lockout?"
              description="Lets this faculty member request a fresh OTP right away if they're currently rate-limited from too many attempts."
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
                aria-label={`Clear OTP lockout for faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          )}
          {isSuperAdmin && !record.suspendedAt && (
            <Popconfirm
              title="Impersonate this faculty member?"
              description="You'll be logged in as this faculty member for support purposes. Use 'Exit impersonation' in the header to return to your own session."
              disabled={Boolean(rowActionBusy)}
              onConfirm={() => handleImpersonate(record)}
              okText="Log in as faculty"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<LoginOutlined />}
                size="small"
                loading={rowActionBusy === `impersonate:${record.id}`}
                disabled={Boolean(rowActionBusy)}
                title="Impersonate"
                aria-label={`Impersonate faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          )}
          {record.suspendedAt ? (
            <Popconfirm
              title="Reactivate Faculty"
              description="This faculty member will be able to log in again."
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
                title="Reactivate"
                aria-label={`Reactivate faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Suspend Faculty"
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
                title="Suspend"
                aria-label={`Suspend faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
              />
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete Faculty"
            description="Faculty who teach a course or mentor an active project can't be deleted; suspend them instead to keep their history."
            disabled={Boolean(rowActionBusy)}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={rowActionBusy === `delete:${record.id}`}
              disabled={Boolean(rowActionBusy)}
              title="Delete"
              aria-label={`Delete faculty ${record.firstName ?? ""} ${record.lastName ?? ""}`.trim()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PeoplePageOverview
        title="Faculty"
        description="Manage faculty identity, access and account status here. Teaching allocation stays in Faculty Assignment so roster work and academic allocation do not get mixed together."
        metrics={isCollegeScoped ? [
          { label: "Faculty", value: allFaculty.length },
          { label: "Active", value: allFaculty.filter((item) => !item.suspendedAt).length },
          { label: "Suspended", value: allFaculty.filter((item) => Boolean(item.suspendedAt)).length },
          { label: "Visible now", value: visibleFaculty.length, hint: visibleFaculty.length === allFaculty.length ? "No roster filters applied" : "After search and filters" },
        ] : []}
        actions={isCollegeScoped ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRegisterOpen(["register"])}>
            Register faculty
          </Button>
        ) : null}
      />
      {!isCollegeScoped ? (
        <Alert
          type="warning"
          showIcon
          message="Select a College to manage Faculty"
          description="Faculty is treated as college-scoped in Superadmin to prevent cross-tenant edits."
        />
      ) : (
      <>
      <Collapse
        activeKey={registerOpen}
        onChange={(keys) => setRegisterOpen(Array.isArray(keys) ? keys : [keys])}
        style={{ marginBottom: 16 }}
        items={[{
          key: "register",
          // Rendered while collapsed so `form` is connected when the scope effect pre-fills collegeId.
          forceRender: true,
          label: <span><PlusOutlined /> Register faculty (one at a time or bulk CSV)</span>,
          children: (
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="Register New Faculty" size="small">
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
                    name="contactMobile"
                    label="Mobile Number"
                    rules={[{ required: true, message: "Enter the mobile number" }, { pattern: /^\d{10}$/, message: "Mobile number must be 10 digits" }]}
                    extra="Used for OTP login"
                  >
                    <Input inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={10} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactMail" label="Email">
                    <Input inputMode="email" autoComplete="email" placeholder="Email address" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                {!collegeId && (
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="collegeId"
                      label="College"
                      rules={[{ required: true, message: "Choose a college" }]}
                    >
                      <Select placeholder="Select college">
                        {colleges.map((college) => (
                          <Option key={college.id} value={college.id}>
                            {college.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                <Col xs={24} sm={collegeId ? 24 : 12}>
                  <Form.Item
                    name="deptId"
                    label="Department"
                    rules={[{ required: true, message: "Choose a department" }]}
                  >
                    <Select placeholder={departmentsError ? "Departments unavailable" : "Select department"}
                      loading={departmentsLoading} disabled={departmentsLoading || Boolean(departmentsError)}>
                      {departments.map((dept) => (
                        <Option key={dept.id} value={dept.id}>
                          {dept.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="facultyType" 
                    label="Faculty Type"
                    rules={[{ required: true, message: "Choose a faculty type" }]}
                    extra={isSuperAdmin ? "A college admin can manage everything in this college." : null}
                  >
                    <Select placeholder="Select type">
                      {isSuperAdmin && <Option value="ADMIN">🔐 Admin (Full Access)</Option>}
                      <Option value="PROFESSOR">Professor</Option>
                      <Option value="ASSOCIATE_PROFESSOR">Associate Professor</Option>
                      <Option value="ASSISTANT_PROFESSOR">Assistant Professor</Option>
                      <Option value="LECTURER">Lecturer</Option>
                      <Option value="HEAD">Head of Department</Option>
                      <Option value="COORDINATOR">Coordinator</Option>
                      <Option value="MENTOR">Mentor</Option>
                      <Option value="PERMANENT">Permanent</Option>
                      <Option value="VISITING">Visiting</Option>
                      <Option value="GUEST">Guest</Option>
                      <Option value="CONTRACT">Contract</Option>
                      <Option value="ADJUNCT">Adjunct</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="gender" label="Gender">
                    <Select placeholder="Select gender">
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="dob" label="Date of Birth">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item name="address" label="Address">
                <TextArea rows={2} placeholder="Address" />
              </Form.Item>

              <Form.Item name="description" label="Bio / Description">
                <TextArea rows={2} placeholder="Brief description" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}
                 disabled={departmentsLoading || Boolean(departmentsError)} icon={<PlusOutlined />} block>
                  Register Faculty
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Bulk Register Faculty" size="small">
            {!collegeId && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>College</div>
                <Select
                  placeholder="Select college"
                  value={bulkCollegeId}
                  onChange={(v) => { setBulkCollegeId(v); setBulkDeptId(null); setBulkValidateResult(null); }}
                  style={{ width: "100%" }}
                >
                  {colleges.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </div>
            )}
            {bulkDepartmentsError && (
              <Alert type="warning" showIcon style={{ marginBottom: 12 }}
                message="Departments unavailable"
                description={bulkDepartmentsError}
                action={<Button size="small" onClick={() => collegeId ? fetchDepartments() : setBulkCollegeId((value) => value)}>Retry departments</Button>} />
            )}
            {((collegeId && departments.length > 0) || (!collegeId && bulkDepartments.length > 0)) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>Department</div>
                <Select
                  placeholder={bulkDepartmentsLoading ? "Loading departments…" : bulkDepartmentsError ? "Departments unavailable" : "Select department (all rows will be assigned to this department)"}
                  loading={bulkDepartmentsLoading}
                  disabled={bulkDepartmentsLoading || Boolean(bulkDepartmentsError)}
                  value={bulkDeptId}
                  onChange={(v) => { setBulkDeptId(v); setBulkValidateResult(null); }}
                  style={{ width: "100%" }}
                >
                  {(collegeId ? departments : bulkDepartments).map((d) => (
                    <Option key={d.id} value={d.id}>{d.name}</Option>
                  ))}
                </Select>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>CSV file (max 500 rows)</div>
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
                Required headers: First Name, Last Name, Mobile Number, Email (email values optional). Optional Faculty Type column: LECTURER or MENTOR; omitted values default to LECTURER. Mentors also need Projects enabled and workspace assignments.
              </div>
              {parsedBulkRows.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">{parsedBulkRows.length} row(s) parsed</Tag>
                </div>
              )}
            </div>
            {bulkValidateResult && (
              (bulkValidateResult.duplicateRows?.length ?? 0) === 0 ? (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Validation successful"
                  description={`All ${bulkValidateResult.totalRows ?? 0} row(s) are ready. Click Create to add them.`}
                />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Validation report"
                  description={
                    <>
                      <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
                        {bulkValidateResult.existingMobiles?.length > 0 && (
                          <li>Existing in system (mobile): {bulkValidateResult.existingMobiles.length}</li>
                        )}
                        {bulkValidateResult.existingEmails?.length > 0 && (
                          <li>Existing in system (email): {bulkValidateResult.existingEmails.length}</li>
                        )}
                        {bulkValidateResult.duplicateMobilesInFile?.length > 0 && (
                          <li>Duplicate in file (mobile): {bulkValidateResult.duplicateMobilesInFile.length}</li>
                        )}
                        {bulkValidateResult.duplicateEmailsInFile?.length > 0 && (
                          <li>Duplicate in file (email): {bulkValidateResult.duplicateEmailsInFile.length}</li>
                        )}
                      </ul>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 6, fontWeight: 500 }}>Rows with issues ({bulkValidateResult.duplicateRows.length}) — fix these in your CSV:</div>
                        <Table
                          size="small"
                          pagination={false}
                          scroll={{ x: 560 }}
                          dataSource={bulkValidateResult.duplicateRows}
                          rowKey={(r) => r.row}
                          columns={[
                            { title: "Row", dataIndex: "row", key: "row", width: 56 },
                            { title: "First Name", dataIndex: "first_name", key: "first_name", ellipsis: true },
                            { title: "Last Name", dataIndex: "last_name", key: "last_name", ellipsis: true },
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
                  }
                />
              )
            )}
            {bulkCreateResult && (
              <Alert
                type={bulkCreateResult.failed?.length > 0 ? "warning" : "success"}
                showIcon
                style={{ marginBottom: 12 }}
                message={`Created ${bulkCreateResult.created}; failed ${bulkCreateResult.failed?.length ?? 0}`}
                description={
                  bulkCreateResult.failed?.length > 0 ? (
                    <ul style={{ marginBottom: 0, paddingLeft: 20, maxHeight: 120, overflow: "auto" }}>
                      {bulkCreateResult.failed.slice(0, 20).map((f, i) => (
                        <li key={i}>Row {f.row}: {f.reason}</li>
                      ))}
                      {bulkCreateResult.failed.length > 20 && (
                        <li>... and {bulkCreateResult.failed.length - 20} more</li>
                      )}
                    </ul>
                  ) : null
                }
              />
            )}
            <Space>
              <Button type="default" onClick={handleBulkValidate} loading={bulkValidateLoading}
                disabled={parsedBulkRows.length === 0 || bulkDepartmentsLoading || Boolean(bulkDepartmentsError)}>
                Validate
              </Button>
              <Button
                type="primary"
                onClick={handleBulkCreate}
                loading={bulkLoading}
                disabled={bulkLoading || bulkDepartmentsLoading || Boolean(bulkDepartmentsError) || !bulkValidateResult || bulkValidateResult.duplicateRows.length > 0 || bulkValidateResult.validationKey !== JSON.stringify([collegeId ?? bulkCollegeId, bulkDeptId, parsedBulkRows])}
              >
                Create
              </Button>
              <Button type="link" icon={<DownloadOutlined />} onClick={downloadSampleCSV}>
                Sample CSV
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
            title="Registered Faculty"
            size="small"
            extra={
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={fetchData} size="small">
                  Refresh
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  size="small"
                  disabled={visibleFaculty.length === 0}
                  onClick={() => exportRowsToCsv(
                    "faculty.csv",
                    [
                      { label: "Name", key: "name" },
                      { label: "Mobile", key: "contactMobile" },
                      { label: "Email", key: "contactMail" },
                      { label: "Type", key: "facultyType" },
                      { label: "Gender", key: "gender" },
                      { label: "Status", key: "status" },
                    ],
                    visibleFaculty.map((f) => ({
                      name: `${f.firstName || ""} ${f.lastName || ""}`.trim(),
                      contactMobile: f.contactMobile,
                      contactMail: f.contactMail,
                      facultyType: f.facultyType,
                      gender: f.gender,
                      status: f.suspendedAt ? "Suspended" : "Active",
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
              <Alert type="error" showIcon message="Could not load faculty" description={loadError}
                action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />
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
                placeholder="Search faculty by name, email, department, or type (e.g., 'john', 'prof', 'hod', 'cse')..."
                allowClear
                notFoundContent={
                  searchLoading ? (
                    <Spin size="small" />
                  ) : (
                    "No faculty found. Try a different search."
                  )
                }
                filterOption={false} // We handle filtering on the backend
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
              />
            </div>
            <Space wrap style={{ marginBottom: 12 }}>
              <Select allowClear showSearch optionFilterProp="label" placeholder="All departments" style={{ width: 200, maxWidth: "100%" }}
                value={filterDept} onChange={(v) => setFilterDept(v ?? null)} aria-label="Filter by department"
                options={departments.map((d) => ({ value: d.id, label: d.name }))} />
              <Select allowClear placeholder="All types" style={{ width: 150, maxWidth: "100%" }} value={filterType}
                onChange={(v) => setFilterType(v ?? null)} aria-label="Filter by faculty type"
                options={facultyTypeOptions} />
              <Select allowClear placeholder="Any status" style={{ width: 130, maxWidth: "100%" }} value={filterStatus}
                onChange={(v) => setFilterStatus(v ?? null)} aria-label="Filter by status"
                options={[{ value: "ACTIVE", label: "Active" }, { value: "SUSPENDED", label: "Suspended" }]} />
              <span style={{ color: "#8c8c8c" }}>
                {visibleFaculty.length === data.length ? `${data.length} faculty` : `${visibleFaculty.length} of ${data.length} faculty`}
              </span>
              {(filterDept || filterType || filterStatus) && (
                <Button type="link" size="small" onClick={() => { setFilterDept(null); setFilterType(null); setFilterStatus(null); }}>
                  Clear filters
                </Button>
              )}
            </Space>
            <Table
              dataSource={visibleFaculty}
              columns={columns}
              rowKey="id"
              loading={tableLoading}
              size="small"
              pagination={{ defaultPageSize: 25, pageSizeOptions: [25, 50, 100, 200], showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: data.length ? "No faculty match these filters." : "No faculty found. Register faculty members to get started." }}
            />
          </Card>
        </Col>
      </Row>
      </>
      )}

      {/* Edit Modal */}
      <Modal
        title="Edit Faculty"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        confirmLoading={editLoading}
        okText="Save Changes"
        cancelText="Cancel"
        width={600}
        // Mounted while closed so editForm is connected when handleEdit fills it in.
        forceRender
        maskClosable={false}
        className="admin-list-page-modal"
      >
        <Form form={editForm} layout="vertical">
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
                name="contactMobile"
                label="Mobile Number"
                rules={[{ required: true, message: "Enter the mobile number" }, { pattern: /^\d{10}$/, message: "Mobile number must be 10 digits" }]}
              >
                <Input inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={10} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="contactMail" label="Email">
                <Input inputMode="email" autoComplete="email" placeholder="Email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            {!collegeId && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="collegeId"
                  label="College"
                  rules={[{ required: true, message: "Choose a college" }]}
                >
                  <Select placeholder="Select college">
                    {colleges.map((college) => (
                      <Option key={college.id} value={college.id}>
                        {college.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            <Col xs={24} sm={collegeId ? 24 : 12}>
              <Form.Item
                name="deptId"
                label="Department"
                rules={[{ required: true, message: "Choose a department" }]}
              >
                <Select placeholder={departmentsError ? "Departments unavailable" : "Select department"}
                  loading={departmentsLoading} disabled={departmentsLoading || Boolean(departmentsError)}>
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item 
                name="facultyType" 
                label="Faculty Type"
                rules={[{ required: true, message: "Choose a faculty type" }]}
              >
                <Select placeholder="Faculty role is managed separately" disabled>
                  {isSuperAdmin && <Option value="ADMIN">🔐 Admin (Full Access)</Option>}
                  <Option value="PROFESSOR">Professor</Option>
                  <Option value="ASSOCIATE_PROFESSOR">Associate Professor</Option>
                  <Option value="ASSISTANT_PROFESSOR">Assistant Professor</Option>
                  <Option value="LECTURER">Lecturer</Option>
                  <Option value="HEAD">Head of Department</Option>
                  <Option value="COORDINATOR">Coordinator</Option>
                  <Option value="MENTOR">Mentor</Option>
                  <Option value="PERMANENT">Permanent</Option>
                  <Option value="VISITING">Visiting</Option>
                  <Option value="GUEST">Guest</Option>
                  <Option value="CONTRACT">Contract</Option>
                  <Option value="ADJUNCT">Adjunct</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="gender" label="Gender">
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <TextArea rows={2} placeholder="Address" />
          </Form.Item>

          <Form.Item name="description" label="Bio / Description">
            <TextArea rows={2} placeholder="Brief description" />
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
          <AuditLogs fixedCollegeId={collegeId} hideFilters fixedEntityId={String(historyRecord.id)} fixedEntityType="faculty" />
        </Modal>
      )}

      {profileRecord && (
        <Modal
          open
          onCancel={() => setProfileRecord(null)}
          footer={null}
          width={860}
          title={`Profile — ${profileRecord.firstName || ""} ${profileRecord.lastName || ""}`.trim()}
          destroyOnClose
        >
          <ProfileSectionsPanel role="faculty" id={profileRecord.id} />
        </Modal>
      )}

      {reassignRecord && (
        <Modal
          open
          onCancel={closeReassignSchedule}
          closable={!reassignLoading}
          keyboard={!reassignLoading}
          maskClosable={false}
          footer={[
            <Button key="close" onClick={closeReassignSchedule} disabled={reassignLoading}>Close</Button>,
            <Button
              key="reassign"
              type="primary"
              loading={reassignLoading}
              disabled={!reassignTargetId}
              onClick={handleReassignSchedule}
            >
              Reassign
            </Button>,
          ]}
          title={`Reassign class schedules — ${`${reassignRecord.firstName || ""} ${reassignRecord.lastName || ""}`.trim() || `#${reassignRecord.id}`}`}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Moves every not-yet-started session"
            description="Only upcoming class schedules are moved — sessions that already happened keep their original faculty for attendance history. If a session would create a scheduling conflict for the new faculty, that one session is skipped and reported below; the rest still go through."
          />
          <Select
            style={{ width: "100%" }}
            placeholder="Reassign to..."
            showSearch
            optionFilterProp="label"
            value={reassignTargetId}
            onChange={setReassignTargetId}
            disabled={reassignLoading}
            options={data
              .filter((f) => f.id !== reassignRecord.id)
              .map((f) => ({ value: f.id, label: `${f.firstName ?? ""} ${f.lastName ?? ""}`.trim() || `#${f.id}` }))}
          />

          {reassignReport && (
            <div style={{ marginTop: 16 }}>
              <Alert
                type={reassignReport.failed?.length > 0 ? "warning" : "success"}
                showIcon
                message={`Reassigned ${reassignReport.reassigned} of ${reassignReport.scanned} upcoming session(s)`}
                description={
                  reassignReport.failed?.length > 0 ? (
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {reassignReport.failed.map((f, i) => (
                        <li key={i}>Schedule #{f.classScheduleId}: {f.reason}</li>
                      ))}
                    </ul>
                  ) : null
                }
              />
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

export default Faculty;
