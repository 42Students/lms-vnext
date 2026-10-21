import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Modal,
  message,
} from "antd";
import {
  ReloadOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  getGlobalSettings,
  putGlobalSettings,
  deleteGlobalSetting,
  getOrgSettings,
  putOrgSettings,
  deleteOrgSetting,
  getCollegeSettings,
  putCollegeSettings,
  deleteCollegeSetting,
} from "@/api/Services/TenantAdminService";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import AdminControlOverview from "@/components/admin/AdminControlOverview";

const { Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * Tenant settings — the screen for the app_setting store.
 *
 * ## What this screen got wrong before, and why it mattered
 *
 * The store has three scope types (GLOBAL / ORG / COLLEGE) and the previous version of this screen
 * presented them as a hierarchy: pick a scope, edit values, and narrower scopes override wider
 * ones. **That hierarchy does not exist.** `AppSettingsService.getString(scopeType, scopeId, key)`
 * reads exactly one row for exactly one scope and falls back to the *hardcoded* default — there is
 * no cascade. Every call site names the scope it reads, and the scope is fixed in code:
 *
 *  - Everything below is read at **GLOBAL**, except
 *  - `attendance.eligibilityThresholdPercent` and `attendance.correctionWindowHours`, which are
 *    read **only at COLLEGE**, and
 *  - **no key is read at ORG at all.**
 *
 * So the old screen let an admin set any key at any scope while only one specific scope was ever
 * consulted. Setting the attendance threshold globally did nothing. Setting the SMS sender ID on a
 * college did nothing. Switching the dropdown to Org or College dropped the admin into a bare
 * key/value grid, because the documented-field list for those scopes was empty — which is what
 * made the screen feel like a database editor rather than a settings page.
 *
 * Each setting now declares the scope that actually reads it, and only appears there.
 */

// scope: which scope the backend actually reads this key at. type: drives validation, because a
// value that fails to parse is silently ignored by getInt/getDouble — the admin would otherwise
// save "abc", see a success message, and get the default.
const SETTINGS = [
  // ---- Platform identity and auth. The most destructive controls in the console. ----
  {
    key: "baseDomain",
    scope: "GLOBAL",
    type: "text",
    label: "Base domain",
    group: "Platform & auth",
    dangerous: true,
    help: "Root domain tenant subdomains hang off, e.g. 42lms.com. Read by tenant bootstrap and the host allowlist. Getting this wrong breaks tenant resolution for everyone.",
    placeholder: "42lms.com",
  },
  {
    key: "globalHost",
    scope: "GLOBAL",
    type: "text",
    label: "Global host",
    group: "Platform & auth",
    dangerous: true,
    help: "The non-tenant entrypoint. A request to this exact host is treated as GLOBAL rather than resolved to a college. Defaults to the base domain when unset.",
    placeholder: "42lms.com",
  },
  {
    key: "cookieDomain",
    scope: "GLOBAL",
    type: "text",
    label: "Auth cookie domain",
    group: "Platform & auth",
    dangerous: true,
    help: "Domain scope for auth cookies. Set this wrong and every signed-in user is silently logged out on tenant subdomains.",
    placeholder: ".42lms.com",
  },
  {
    key: "cookieSameSite",
    scope: "GLOBAL",
    type: "text",
    label: "Auth cookie SameSite",
    group: "Platform & auth",
    dangerous: true,
    help: "Lax is correct for normal same-site use. Only set None for genuine cross-site cookie use — browsers then also require Secure.",
    placeholder: "Lax",
  },
  {
    key: "policy.superadmin.ipAllowlist",
    scope: "GLOBAL",
    type: "text",
    label: "Super-admin IP allowlist",
    group: "Platform & auth",
    dangerous: true,
    help: "Comma-separated IPs or CIDR ranges permitted to reach super-admin endpoints, e.g. 203.0.113.4/32,198.51.100.0/24. Leave blank to allow any address — the filter only enforces when a value is set, which is why an unset allowlist is not a failure. Set it wrong and you lock yourself out of the console.",
    placeholder: "203.0.113.4/32,198.51.100.0/24",
  },
  {
    key: "otp.maxAttempts",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 100,
    label: "OTP attempt limit",
    group: "Platform & auth",
    help: "Max OTP send/verify attempts per phone number within the lockout window, across login and verifyOTP for learners, faculty and admins.",
    placeholder: "5",
  },
  {
    key: "otp.windowSeconds",
    scope: "GLOBAL",
    type: "int",
    min: 30,
    max: 86400,
    label: "OTP lockout window (seconds)",
    group: "Platform & auth",
    help: "How long an attempt count is remembered before it resets. Default is 900 (15 minutes).",
    placeholder: "900",
  },

  // ---- SMS. Every one of these must match a DLT registration word for word. ----
  {
    key: "sms.senderId",
    scope: "GLOBAL",
    type: "text",
    label: "SMS sender ID",
    group: "SMS",
    dangerous: true,
    help: "The DLT-registered sender ID BulkSMSApps uses on every SMS. Must match your actual TRAI/DLT registration — an unregistered sender ID gets messages rejected by the operator, not just looking wrong.",
    placeholder: "FLERNR",
  },
  {
    key: "sms.attendanceAbsenceTemplate",
    scope: "GLOBAL",
    type: "textarea",
    label: "Attendance: absence SMS",
    group: "SMS",
    dangerous: true,
    help: "Sent to a parent when a student is marked absent. Use %s in this exact order: course name, start time, end time. Must match your DLT registration word for word.",
    placeholder: "Dear Parent, Your ward is absent for today's %s class at %s-%s. - 42 Learn.",
  },
  {
    key: "sms.attendanceCorrectionTemplate",
    scope: "GLOBAL",
    type: "textarea",
    label: "Attendance: correction SMS",
    group: "SMS",
    dangerous: true,
    help: "Sent to a parent when an earlier absence is corrected to present. Same %s order as the absence template.",
    placeholder: "Dear Parent, Correction: your ward's absence for %s class at %s-%s has been reviewed and marked present. - 42 Learn.",
  },
  {
    key: "sms.traiJobUpdateTemplate",
    scope: "GLOBAL",
    type: "textarea",
    label: "Placements: job update SMS",
    group: "SMS",
    dangerous: true,
    help: "The single TRAI-approved template for every job-application SMS. Use {#var#} for the recipient's name — it is the only variable.",
    placeholder: "Reminder: Hello {#var#}, You have an update on the 42 LMS Jobs Portal. Login to 42lms.com to check - JRSPF",
  },

  // ---- Course & progress ----
  {
    key: "course.watchedThresholdPercent",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 100,
    label: "Video 'watched' threshold (%)",
    group: "Course & progress",
    help: "How much of a video counts as watched. Read by both the progress service and the course home stats.",
    placeholder: "90",
  },
  {
    key: "course.minInProgressPercent",
    scope: "GLOBAL",
    type: "int",
    min: 0,
    max: 100,
    label: "'In progress' lower bound (%)",
    group: "Course & progress",
    help: "Below this, a partially-watched item still counts as not started.",
    placeholder: "5",
  },
  {
    key: "ui.chatPollIntervalMs",
    scope: "GLOBAL",
    type: "int",
    min: 3000,
    max: 600000,
    label: "Classroom chat poll interval (ms)",
    group: "Course & progress",
    help: "How often an open classroom tab polls for new messages. There is no websocket, so this is the message latency. A floor of 3000ms is enforced server-side.",
    placeholder: "15000",
  },
  {
    key: "ui.progressSaveIntervalMs",
    scope: "GLOBAL",
    type: "int",
    min: 5000,
    max: 600000,
    label: "Video progress save interval (ms)",
    group: "Course & progress",
    help: "Minimum gap between progress saves while a learner watches. Lower means finer resume points and more write load. A floor of 5000ms is enforced server-side.",
    placeholder: "15000",
  },

  // ---- Scheduling & attendance. The two COLLEGE-scoped keys live here. ----
  {
    key: "attendance.eligibilityThresholdPercent",
    scope: "COLLEGE",
    type: "int",
    min: 1,
    max: 100,
    label: "Exam eligibility threshold (%)",
    group: "Attendance",
    help: "Minimum attendance a learner needs to sit exams. Read per college — a value set at global scope is never consulted.",
    placeholder: "75",
  },
  {
    key: "attendance.correctionWindowHours",
    scope: "COLLEGE",
    type: "int",
    min: 1,
    max: 8760,
    label: "Retroactive marking window (hours)",
    group: "Attendance",
    help: "How long after a class a faculty member may still mark or correct attendance. Read per college.",
    placeholder: "24",
  },
  {
    key: "schedule.pastBookingGraceMinutes",
    scope: "GLOBAL",
    type: "int",
    min: 0,
    max: 1440,
    label: "Past-booking grace (minutes)",
    group: "Attendance",
    help: "How far into the past a class may still be scheduled, to absorb clock skew between a device and the server.",
    placeholder: "5",
  },

  // ---- Placements ----
  {
    key: "interview.overlapWindowMinutes",
    scope: "GLOBAL",
    type: "int",
    min: 0,
    max: 1440,
    label: "Interview overlap window (minutes)",
    group: "Placements",
    help: "Window used when checking whether two interviews clash.",
    placeholder: "60",
  },
  {
    key: "interview.overlapBufferMinutes",
    scope: "GLOBAL",
    type: "int",
    min: 0,
    max: 1440,
    label: "Interview buffer (minutes)",
    group: "Placements",
    help: "Gap required between two interviews before they are considered non-overlapping.",
    placeholder: "15",
  },
  {
    key: "interview.durationMinMinutes",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 1440,
    label: "Interview minimum duration (minutes)",
    group: "Placements",
    placeholder: "15",
  },
  {
    key: "interview.durationMaxMinutes",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 1440,
    label: "Interview maximum duration (minutes)",
    group: "Placements",
    placeholder: "480",
  },
  {
    key: "placement.applyRateLimitPerMinute",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 1000,
    label: "Job application rate limit (per minute)",
    group: "Placements",
    help: "Per learner. Raise this during a drive when many students apply at once.",
    placeholder: "5",
  },
  {
    key: "placement.staleAppliedDays",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 365,
    label: "Stale application age (days)",
    group: "Placements",
    help: "How long an application sits untouched before the hiring dashboard flags it.",
    placeholder: "7",
  },
  {
    key: "placement.closingSoonDays",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 365,
    label: "'Closing soon' window (days)",
    group: "Placements",
    placeholder: "3",
  },
  {
    key: "placement.lowConversionThreshold",
    scope: "GLOBAL",
    type: "decimal",
    min: 0,
    max: 1,
    label: "Low conversion threshold (0–1)",
    group: "Placements",
    help: "Conversion rate below which a drive is flagged as needing attention. 0.15 means 15%.",
    placeholder: "0.15",
  },
  {
    key: "placement.needsAttentionSampleCap",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 1000,
    label: "'Needs attention' sample cap",
    group: "Placements",
    placeholder: "5",
  },

  // ---- Operational caps ----
  {
    key: "ops.bulkStatusMax",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 10000,
    label: "Bulk status-update cap",
    group: "Operational caps",
    help: "Max drives, applications, courses or lessons accepted in one bulk status update.",
    placeholder: "100",
  },
  {
    key: "ops.progressBulkIdsMax",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 10000,
    label: "Progress bulk request cap",
    group: "Operational caps",
    placeholder: "500",
  },
  {
    key: "ops.identityMaxJsonSize",
    scope: "GLOBAL",
    type: "int",
    min: 100,
    max: 1000000,
    label: "Identity documents JSON size cap",
    group: "Operational caps",
    help: "Max serialized size of the identity-documents blob on a profile, in characters.",
    placeholder: "10000",
  },
  {
    key: "ops.announcementMaxPageSize",
    scope: "GLOBAL",
    type: "int",
    min: 1,
    max: 10000,
    label: "Announcement page size cap",
    group: "Operational caps",
    placeholder: "200",
  },
  // ops.migrationWorkspacesMax removed along with the "Migrate legacy workspaces" feature it
  // capped — see the deletion note on ProjectWorkspaceService. Editing it here would silently do
  // nothing now that nothing reads it.
];

const SCOPE_LABELS = {
  GLOBAL: "Global (whole platform)",
  COLLEGE: "College",
  ORG: "Organization",
};

const DANGEROUS_KEYS = new Set(SETTINGS.filter((s) => s.dangerous).map((s) => s.key));

const TenantSettings = ({ selectedOrganizationId, selectedCollegeId }) => {
  const [scopeType, setScopeType] = useState("GLOBAL");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();
  const mutationRef = useRef(false);
  const confirmRef = useRef(false);

  const scopeId = useMemo(() => {
    if (scopeType === "ORG") return selectedOrganizationId ?? null;
    if (scopeType === "COLLEGE") return selectedCollegeId ?? null;
    return null;
  }, [scopeType, selectedOrganizationId, selectedCollegeId]);

  const scopeReady = scopeType === "GLOBAL" || scopeId != null;

  useUnsavedFormGuard(form, { enabled: scopeReady && !loading && !saving });
  useUnsavedFormGuard(addForm, { enabled: addOpen && !saving });

  const globalBlockedByScope =
    scopeType === "GLOBAL" && (selectedOrganizationId != null || selectedCollegeId != null);

  const knownForScope = useMemo(() => SETTINGS.filter((s) => s.scope === scopeType), [scopeType]);
  const knownKeys = useMemo(() => new Set(knownForScope.map((k) => k.key)), [knownForScope]);
  const knownByKey = useMemo(() => {
    const m = {};
    SETTINGS.forEach((s) => {
      m[s.key] = s;
    });
    return m;
  }, []);

  const groups = useMemo(() => {
    const out = [];
    knownForScope.forEach((s) => {
      const g = out.find((x) => x.name === s.group);
      if (g) g.items.push(s);
      else out.push({ name: s.group, items: [s] });
    });
    return out;
  }, [knownForScope]);

  // The form is a single AntD instance reused across scopes, and setFieldsValue only sets the keys
  // it is given — it does not clear the rest. Without an explicit reset, switching from Global
  // (fully populated) to College (empty) left every global value sitting in the form; Save then
  // diffed them against an empty college and wrote the entire global configuration as college
  // overrides, invisibly, because those fields are not rendered at college scope.
  // Values come back from the API as strings. The numeric fields are InputNumber with a
  // type:"number" rule, which rejects a string outright — so a page load would mark every numeric
  // setting invalid and block saving until each was retyped.
  const toFormValues = useCallback(
    (loaded) => {
      const out = {};
      Object.keys(loaded || {}).forEach((k) => {
        const meta = knownByKey[k];
        const raw = loaded[k];
        if (meta && (meta.type === "int" || meta.type === "decimal")) {
          const n = Number(raw);
          out[k] = raw === "" || raw === null || Number.isNaN(n) ? undefined : n;
        } else {
          out[k] = raw;
        }
      });
      return out;
    },
    [knownByKey]
  );

  const previousScopeRef = useRef(`${scopeType}:${scopeId}`);
  const loadSeq = useRef(0);
  const activeScopeKey = `${scopeType}:${scopeId}`;
  const activeScopeKeyRef = useRef(activeScopeKey);
  activeScopeKeyRef.current = activeScopeKey;

  const load = useCallback(async () => {
    const scopeKey = `${scopeType}:${scopeId}`;
    if (scopeKey !== activeScopeKeyRef.current) return;
    const requestId = ++loadSeq.current;
    if (previousScopeRef.current !== scopeKey) {
      if (form.isFieldsTouched()) {
        message.warning("Unsaved settings were discarded because the active scope changed.");
      }
      if (addForm.isFieldsTouched()) {
        message.warning("The unsaved new-setting draft was closed because the active scope changed.");
        setAddOpen(false);
        addForm.resetFields();
      }
      form.resetFields();
      previousScopeRef.current = scopeKey;
    }
    if (!scopeReady) {
      setSettings({});
      setLoading(false);
      return;
    }
    setSettings({});
    setLoading(true);
    setError(null);
    try {
      let res;
      if (scopeType === "GLOBAL") res = await getGlobalSettings();
      else if (scopeType === "ORG") res = await getOrgSettings(scopeId);
      else res = await getCollegeSettings(scopeId);

      if (requestId !== loadSeq.current || scopeKey !== activeScopeKeyRef.current) return;
      const loaded = res?.data?.settings;
      if (!loaded || typeof loaded !== "object" || Array.isArray(loaded)) {
        throw new Error("Unexpected settings response");
      }
      setSettings(loaded);
      form.resetFields();
      form.setFieldsValue(toFormValues(loaded));
    } catch (e) {
      if (requestId !== loadSeq.current || scopeKey !== activeScopeKeyRef.current) return;
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load settings."
      );
      setSettings({});
    } finally {
      if (requestId === loadSeq.current && scopeKey === activeScopeKeyRef.current) setLoading(false);
    }
  }, [scopeType, scopeId, scopeReady, form, toFormValues]);

  useEffect(() => {
    load();
    return () => { ++loadSeq.current; };
  }, [load]);

  const persist = async (payload) => {
    if (scopeType === "GLOBAL") return putGlobalSettings(payload);
    if (scopeType === "ORG") return putOrgSettings(scopeId, payload);
    return putCollegeSettings(scopeId, payload);
  };

  const removeKey = async (key) => {
    if (scopeType === "GLOBAL") return deleteGlobalSetting(key);
    if (scopeType === "ORG") return deleteOrgSetting(scopeId, key);
    return deleteCollegeSetting(scopeId, key);
  };

  const doSave = async (changed, cleared) => {
    const requestedScopeKey = activeScopeKey;
    if (requestedScopeKey !== activeScopeKeyRef.current) {
      mutationRef.current = false;
      return;
    }
    setSaving(true);
    setError(null);
    const fetchStored = async () => {
      const res =
        scopeType === "GLOBAL"
          ? await getGlobalSettings()
          : scopeType === "ORG"
            ? await getOrgSettings(scopeId)
            : await getCollegeSettings(scopeId);
      const next = res?.data?.settings;
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        throw new Error("Unexpected settings response after refresh");
      }
      return next;
    };
    // BE-0072: the save is several requests (one write for the changed values, one delete per cleared key). Writes go
    // first, each step is recorded, and if one fails the form is reloaded from the server and the message says exactly
    // what was saved and what wasn't - never a bare "failed" over a half-applied save.
    const done = [];
    let failedStep = null;
    try {
      let latest = settings;
      if (Object.keys(changed).length > 0) {
        failedStep = Object.keys(changed).join(", ");
        const res = await persist(changed);
        const next = res?.data?.settings;
        if (!next || typeof next !== "object" || Array.isArray(next)) {
          throw new Error("Unexpected settings response after save");
        }
        latest = next;
        done.push(...Object.keys(changed));
      }
      // Clearing a field means "use the built-in default", which is a delete and not an empty
      // write: getString returns Optional.of("") for an empty row, so .orElse(default) never
      // fires. Writing "" to sms.senderId would set the DLT sender to empty and every message
      // would be rejected by the operator.
      for (const key of cleared) {
        failedStep = key;
        await removeKey(key);
        done.push(`${key} (cleared)`);
      }
      failedStep = null;
      if (cleared.length > 0) latest = await fetchStored();
      if (requestedScopeKey !== activeScopeKeyRef.current) return;
      setSettings(latest);
      form.resetFields();
      form.setFieldsValue(toFormValues(latest));
      const n = Object.keys(changed).length + cleared.length;
      message.success(`Saved ${n} setting(s).`);
    } catch (e) {
      if (requestedScopeKey !== activeScopeKeyRef.current) return;
      const reason = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save settings.";
      let reloaded = false;
      if (done.length > 0) {
        try {
          const stored = await fetchStored();
          if (requestedScopeKey !== activeScopeKeyRef.current) return;
          setSettings(stored);
          form.resetFields();
          form.setFieldsValue(toFormValues(stored));
          reloaded = true;
        } catch (_) { /* keep the form as typed; the message below still says what happened */ }
      }
      setError(done.length > 0
        ? `Saved: ${done.join(", ")}. Not saved: ${failedStep || "the rest"} (${reason}).${reloaded ? " The form now shows what is stored." : " Reload to see what is stored."}`
        : reason);
    } finally {
      mutationRef.current = false;
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (mutationRef.current) return;
    if (!scopeReady) {
      message.warning(`Select ${scopeType === "ORG" ? "an organization" : "a college"} first.`);
      return;
    }
    let values;
    try {
      values = await form.validateFields();
    } catch (e) {
      // A value that fails to parse server-side is silently replaced by the default, so a bad
      // number must be caught here rather than saved and quietly ignored.
      message.error("Fix the highlighted values before saving.");
      return;
    }

    const changed = {};
    const cleared = [];
    Object.keys(values).forEach((k) => {
      const raw = values[k];
      const next = raw === null || raw === undefined ? "" : String(raw);
      const prev = settings[k] ?? "";
      if (next === String(prev)) return;
      if (next.trim() === "") {
        // Only a key that actually exists needs deleting.
        if (Object.prototype.hasOwnProperty.call(settings, k)) cleared.push(k);
      } else {
        changed[k] = next;
      }
    });

    if (Object.keys(changed).length === 0 && cleared.length === 0) {
      message.info("No changes to save.");
      return;
    }

    const touchedDangerous = [...Object.keys(changed), ...cleared].filter((k) =>
      DANGEROUS_KEYS.has(k)
    );
    if (touchedDangerous.length > 0) {
      if (confirmRef.current) return;
      mutationRef.current = true;
      confirmRef.current = true;
      Modal.confirm({
        title: "This change affects everyone on the platform",
        icon: <WarningOutlined style={{ color: "#faad14" }} />,
        width: 560,
        content: (
          <div>
            <Paragraph style={{ marginBottom: 8 }}>You are changing:</Paragraph>
            <ul style={{ marginTop: 0 }}>
              {touchedDangerous.map((k) => (
                <li key={k}>
                  <Text code>{k}</Text> — {knownByKey[k]?.label}
                </li>
              ))}
            </ul>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Domain and cookie settings can sign every user out or break tenant resolution. SMS
              settings must match your DLT registration exactly, or the operator rejects every
              message. There is no undo beyond setting the old value back.
            </Paragraph>
          </div>
        ),
        okText: "I understand — save",
        okButtonProps: { danger: true },
        cancelText: "Cancel",
        onOk: async () => {
          confirmRef.current = false;
          await doSave(changed, cleared);
        },
        onCancel: () => {
          confirmRef.current = false;
          mutationRef.current = false;
        },
        afterClose: () => { confirmRef.current = false; },
      });
      return;
    }
    mutationRef.current = true;
    await doSave(changed, cleared);
  };

  const handleAdd = async () => {
    if (mutationRef.current || !scopeWritable) return;
    const requestedScopeKey = activeScopeKey;
    try {
      const { key, value } = await addForm.validateFields();
      if (requestedScopeKey !== activeScopeKeyRef.current) return;
      mutationRef.current = true;
      setSaving(true);
      const res = await persist({ [key.trim()]: String(value ?? "") });
      const updated = res?.data?.settings;
      if (!updated || typeof updated !== "object" || Array.isArray(updated)) {
        throw new Error("Unexpected settings response after add");
      }
      if (requestedScopeKey !== activeScopeKeyRef.current) return;
      setSettings(updated);
      form.resetFields();
      form.setFieldsValue(toFormValues(updated));
      setAddOpen(false);
      addForm.resetFields();
      message.success(`Added "${key.trim()}".`);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(
        e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to add setting."
      );
    } finally {
      mutationRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = (key) => {
    if (mutationRef.current || confirmRef.current) return;
    const requestedScopeKey = activeScopeKey;
    mutationRef.current = true;
    confirmRef.current = true;
    Modal.confirm({
      title: `Remove "${key}"?`,
      content: "The stored value is deleted and the backend falls back to its built-in default.",
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: async () => {
        if (requestedScopeKey !== activeScopeKeyRef.current) {
          confirmRef.current = false;
          mutationRef.current = false;
          return;
        }
        setSaving(true);
        try {
          await removeKey(key);
          if (requestedScopeKey !== activeScopeKeyRef.current) return;
          message.success(`Removed "${key}".`);
          load();
        } catch (e) {
          message.error(
            e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to remove setting."
          );
        } finally {
          confirmRef.current = false;
          mutationRef.current = false;
          setSaving(false);
        }
      },
      onCancel: () => {
        confirmRef.current = false;
        mutationRef.current = false;
      },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const requestScopeType = (nextScope) => {
    if (nextScope === scopeType || mutationRef.current || confirmRef.current) return;
    if (!form.isFieldsTouched()) {
      setScopeType(nextScope);
      return;
    }
    confirmRef.current = true;
    Modal.confirm({
      title: "Discard unsaved setting changes?",
      content: "Switching scope reloads a different settings set. Your unsaved changes here will be lost.",
      okText: "Switch scope",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        confirmRef.current = false;
        setScopeType(nextScope);
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const requestAddClose = () => {
    if (mutationRef.current || confirmRef.current) return;
    if (!addForm.isFieldsTouched()) {
      setAddOpen(false);
      addForm.resetFields();
      return;
    }
    confirmRef.current = true;
    Modal.confirm({
      title: "Discard this new setting?",
      content: "The key and value you entered will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        confirmRef.current = false;
        setAddOpen(false);
        addForm.resetFields();
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const additionalRows = Object.keys(settings)
    .filter((k) => !knownKeys.has(k))
    .sort()
    .map((k) => ({
      key: k,
      value: settings[k],
      // A key that is documented but belongs to a different scope is worth calling out: it is
      // stored here and will never be read.
      readAt: knownByKey[k]?.scope,
    }));

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      width: 300,
      render: (k, record) => (
        <Space direction="vertical" size={0}>
          <Text code>{k}</Text>
          {record.readAt && record.readAt !== scopeType && (
            <Text type="danger" style={{ fontSize: 12 }}>
              Never read here — this key is read at {record.readAt} scope
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (_, record) => (
        <Form.Item name={record.key} noStyle>
          <Input />
        </Form.Item>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Tooltip title="Remove this setting">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
            aria-label={`Remove setting ${record.key}`}
          />
        </Tooltip>
      ),
    },
  ];

  const renderControl = (s) => {
    if (s.type === "int") {
      return <InputNumber min={s.min} max={s.max} step={1} precision={0} style={{ width: "100%" }} placeholder={s.placeholder} />;
    }
    if (s.type === "decimal") {
      return <InputNumber min={s.min} max={s.max} step={0.01} style={{ width: "100%" }} placeholder={s.placeholder} />;
    }
    if (s.type === "textarea") {
      return <Input.TextArea rows={3} placeholder={s.placeholder} allowClear />;
    }
    return <Input placeholder={s.placeholder} allowClear />;
  };

  const rulesFor = (s) => {
    if (s.type === "int" || s.type === "decimal") {
      return [
        {
          type: "number",
          min: s.min,
          max: s.max,
          message: `Must be between ${s.min} and ${s.max}`,
        },
      ];
    }
    return [];
  };

  const scopeWritable = scopeType !== "ORG";
  const knownVisibleCount = knownForScope.length;
  const storedCount = Object.keys(settings || {}).length;

  return (
    <div>
      <AdminControlOverview
        eyebrow="Runtime configuration"
        title="Settings with explicit execution scope"
        description="These values are not an inheritance tree: each backend reader asks for one exact scope. The page therefore keeps platform and college settings separate and blocks new organization-level values that nothing consumes."
        scopeLabel={scopeType === "GLOBAL" ? "Platform-wide" : scopeType === "ORG" ? (scopeId != null ? `Organization #${scopeId} · cleanup only` : "Organization · select scope") : (scopeId != null ? `College #${scopeId}` : "College · select scope")}
        scopeColor={scopeType === "GLOBAL" ? "green" : scopeType === "ORG" ? "gold" : "blue"}
        metrics={[
          { label: "Documented controls", value: knownVisibleCount },
          { label: "Stored keys", value: storedCount },
          { label: "Editing", value: scopeWritable ? (scopeReady ? "Available" : "Select scope") : "Disabled", hint: scopeType === "ORG" ? "No runtime reader uses ORG settings" : undefined },
        ]}
      />
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Each setting applies at one level only"
        description={
          <>
            A setting is either platform-wide or per college, never both: a college does not fall back
            to the platform value, it falls back to the built-in default. Each setting below is listed
            only at the level where it takes effect.
            <br />
            <Text type="secondary">
              This screen is configuration values only. To create an organization or college, add a
              college&apos;s web address, or set its branding, use <strong>Tenant Setup</strong>.
            </Text>
          </>
        }
        style={{ marginBottom: 16 }}
      />

      {scopeType === "ORG" && (
        <Alert
          type="warning"
          showIcon
          message="No setting applies at organization level"
          description="No runtime reader consumes organization-level settings. Existing stored keys are shown only so they can be inspected or removed; adding or saving new ORG values is disabled. Use Global for platform-wide values or College for per-college settings."
          style={{ marginBottom: 16 }}
        />
      )}

      {globalBlockedByScope && (
        <Alert
          type="warning"
          showIcon
          message="Clear the college in the header to edit platform-wide settings"
          description="While a college is selected, platform-wide settings are locked, so a change for every college is never made by accident while working on one."
          style={{ marginBottom: 16 }}
        />
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message="Settings could not be loaded or saved safely"
          description={error}
          action={<Button size="small" onClick={load} disabled={!scopeReady || saving}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Select value={scopeType} onChange={requestScopeType} disabled={saving} style={{ width: "100%" }}>
              {Object.keys(SCOPE_LABELS).map((s) => (
                <Option key={s} value={s}>
                  {SCOPE_LABELS[s]}
                  {s === "ORG" ? " — unused" : ""}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={14} md={16}>
            <Space wrap>
              {scopeType !== "GLOBAL" && (
                <Tag color={scopeId != null ? "blue" : "orange"}>
                  {scopeId != null
                    ? `${scopeType === "ORG" ? "Org" : "College"} #${scopeId}`
                    : `Select ${scopeType === "ORG" ? "an organization" : "a college"} above`}
                </Tag>
              )}
              <Button icon={<ReloadOutlined />} onClick={load} loading={loading} disabled={!scopeReady}>
                Refresh
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setAddOpen(true)}
                disabled={!scopeReady || !scopeWritable || globalBlockedByScope || saving || Boolean(error)}
              >
                Add setting
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={!scopeReady || !scopeWritable || globalBlockedByScope || saving || Boolean(error)}
              >
                Save changes
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {!scopeReady ? (
        <Alert
          type="warning"
          showIcon
          message={`Select ${scopeType === "ORG" ? "an organization" : "a college"} to view its settings.`}
        />
      ) : (
        <Form form={form} layout="vertical">
          {groups.map((g) => (
            <Card title={g.name} size="small" style={{ marginBottom: 16 }} loading={loading} key={g.name}>
              <Row gutter={16}>
                {g.items.map((s) => (
                  <Col xs={24} md={s.type === "textarea" ? 24 : 12} key={s.key}>
                    <Form.Item
                      name={s.key}
                      rules={rulesFor(s)}
                      label={
                        <Space size={4}>
                          <span>{s.label}</span>
                          <Text code style={{ fontSize: 12 }}>
                            {s.key}
                          </Text>
                          {s.dangerous && <Tag color="red">high impact</Tag>}
                        </Space>
                      }
                      extra={
                        s.help
                          ? `${s.help} Leave blank to use the default (${s.placeholder}).`
                          : `Leave blank to use the default (${s.placeholder}).`
                      }
                    >
                      {renderControl(s)}
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Card>
          ))}

          <Card
            title="Other stored keys"
            size="small"
            loading={loading}
            extra={<Text type="secondary">{additionalRows.length} key(s)</Text>}
          >
            <Paragraph type="secondary" style={{ marginTop: 0 }}>
              Keys stored at this scope that are not in the documented list above — a new backend
              setting this screen does not name yet, or a value left at a scope that never reads it.
            </Paragraph>
            <Table
              size="small"
              rowKey="key"
              columns={columns}
              dataSource={additionalRows}
              pagination={false}
              scroll={{ x: 600 }}
              locale={{ emptyText: "No other keys stored at this scope." }}
            />
          </Card>
        </Form>
      )}

      <Modal
        title="Add a setting"
        open={addOpen}
        onCancel={requestAddClose}
        onOk={handleAdd}
        okText="Add"
        confirmLoading={saving}
        maskClosable={false}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          message="Keys are matched exactly, and only at the scope that reads them"
          description="A typo creates a new unused key rather than an error — the backend keeps using its default. Copy the key from the code that reads it, and make sure you are on the right scope."
          style={{ marginBottom: 16 }}
        />
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="key"
            label="Key"
            rules={[
              { required: true, message: "Key is required" },
              {
                pattern: /^[A-Za-z0-9_.-]+$/,
                message: "Letters, digits, dot, dash and underscore only",
              },
              {
                validator: (_, value) => {
                  const s = knownByKey[(value || "").trim()];
                  if (s && s.scope !== scopeType) {
                    return Promise.reject(
                      new Error(`That key is read at ${s.scope} scope — storing it here has no effect.`)
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="e.g. course.watchedThresholdPercent" />
          </Form.Item>
          <Form.Item name="value" label="Value">
            <Input placeholder="Value" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantSettings;
