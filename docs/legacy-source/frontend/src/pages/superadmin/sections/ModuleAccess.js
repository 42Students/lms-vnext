import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, AutoComplete, Button, Card, Drawer, Empty, Modal, Segmented,
  Space, Spin, Table, Tag, Tooltip, Typography, message,
} from "antd";
import { HistoryOutlined, LockOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import AdminControlOverview from "@/components/admin/AdminControlOverview";
import { debounce } from "lodash";
import {
  explainModuleAccess, fetchWithErrorHandling, getLearnerModuleOverrides,
  getModuleAccessHistory, getModuleAccessTree, setModuleAccess,
} from "@/api/Services/AdminService";
import { searchLearners } from "@/api/Services/LearnerSearchService";

const { Text, Title } = Typography;
const MODULES = ["projects", "placements"];
const MODULE_LABELS = { projects: "Projects", placements: "Placements" };
const isOptionalModule = (module) => MODULES.includes(module);
const LEVEL_LABELS = {
  GLOBAL: "Platform", ORGANIZATION: "Organization", COLLEGE: "College",
  DEPARTMENT: "Department", PROGRAM: "Program", BATCH: "Batch", CLASS: "Class",
  LEARNER: "Student", DEFAULT: "Default",
};
const LEVEL_SHORT = {
  GLOBAL: "Platform", ORGANIZATION: "Org", COLLEGE: "College",
  DEPARTMENT: "Dept", PROGRAM: "Program", BATCH: "Batch", CLASS: "Class",
  LEARNER: "Student", DEFAULT: "default",
};
const BROAD_LEVELS = ["COLLEGE", "DEPARTMENT", "PROGRAM"];
const BROAD_LEARNER_THRESHOLD = 100;
const TRI_STATE = [
  { label: "Inherit", value: "INHERIT" },
  { label: "On", value: "ON" },
  { label: "Off", value: "OFF" },
];
const toTriState = (value) => value === true ? "ON" : value === false ? "OFF" : "INHERIT";
const fromTriState = (value) => value === "ON" ? true : value === "OFF" ? false : null;
const moduleOf = (node, module) => (node?.modules || []).find((entry) => entry.module === module);
const parseAuditPayload = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch (_) { return {}; }
};
const historyActionLabel = (action) => ({
  MODULE_ACCESS_SET: "Access changed",
  MODULE_ACCESS_BULK_SET: "Student bulk access",
  COLLEGE_FEATURE_TOGGLE: "College feature toggle",
}[action] || action || "Access change");

// Do not trust an older backend or a cached response to exclude retired Courses settings.
const optionalEntries = (entries) => (Array.isArray(entries) ? entries : [])
  .filter((entry) => isOptionalModule(entry?.module));
const optionalOverrides = (students) => (Array.isArray(students) ? students : [])
  .map((student) => ({
    ...student,
    overrides: Object.fromEntries(
      Object.entries(student.overrides || {}).filter(([module]) => isOptionalModule(module))
    ),
    locks: Object.fromEntries(
      Object.entries(student.locks || {}).filter(([module, locked]) => isOptionalModule(module) && locked === true)
    ),
  }))
  .filter((student) => Object.keys(student.overrides).length > 0 || Object.keys(student.locks).length > 0);

const buildTree = (nodes) => {
  const byKey = new Map();
  const roots = [];
  (nodes || []).forEach((node) => {
    byKey.set(`${node.scopeType}:${node.scopeId}`, {
      ...node, modules: optionalEntries(node.modules),
      key: `${node.scopeType}:${node.scopeId}`, children: [],
    });
  });
  byKey.forEach((node) => {
    const parentKey = node.parentType != null && node.parentId != null
      ? `${node.parentType}:${node.parentId}` : null;
    const parent = parentKey ? byKey.get(parentKey) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const prune = (node) => {
    if (!node.children.length) delete node.children;
    else node.children.forEach(prune);
  };
  roots.forEach(prune);
  return roots;
};

/** Shared college-admin / superadmin editor for optional modules only. */
const ELIGIBILITY_LEVEL = { LEARNER: "for this student", CLASS: "for their class", BATCH: "for their batch" };

/** Why a student can or can't use Placements: the college switch, then the placement cell's eligibility decision. */
function PlacementExplain({ module }) {
  const pe = module.placementEligibility || {};
  const collegeOn = pe.collegeHasPlacements !== false;
  const decision = pe.eligibility || "NOT_DECIDED";
  const where = ELIGIBILITY_LEVEL[pe.eligibilityLevel] || "";
  const steps = [
    { label: "College has Placements", ok: collegeOn, detail: collegeOn ? "On" : "Off (switched off for this college)" },
    {
      label: "Placement cell decision",
      ok: decision === "ELIGIBLE",
      detail: decision === "ELIGIBLE" ? `Eligible ${where}`.trim()
        : decision === "INELIGIBLE" ? `Ineligible ${where}${pe.eligibilityReason ? `: ${pe.eligibilityReason}` : ""}`.trim()
        : "Not decided yet",
    },
  ];
  return (
    <div style={{ marginBottom: 8 }} data-testid="placement-explain">
      <Alert
        type={module.enabled ? "success" : "warning"} style={{ marginBottom: 8 }}
        message={module.enabled
          ? "Placements is open for this student."
          : !collegeOn ? "Placements is switched off for this college."
          : "Placements is closed for this student until the placement cell makes them Eligible."}
        description={module.enabled ? null : "The Placements menu is hidden and the pages return an access error."}
      />
      <div style={{ border: "1px solid #f0f0f0", borderRadius: 4 }}>
        {steps.map((step) => (
          <div key={step.label} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 10px", borderBottom: "1px solid #fafafa" }}>
            <span>{step.label}</span>
            <Text type={step.ok ? "success" : "danger"} style={{ fontSize: 12, textAlign: "right" }}>{step.detail}</Text>
          </div>
        ))}
      </div>
      {pe.eligibilityBy && (
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
          Decided by {pe.eligibilityBy}{pe.eligibilityAt ? ` on ${String(pe.eligibilityAt).slice(0, 10)}` : ""}.
        </Text>
      )}
    </div>
  );
}

export default function ModuleAccess({ collegeId, isSuperAdmin = false }) {
  const [tree, setTree] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [canEditCollege, setCanEditCollege] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [editing, setEditing] = useState(null); // {node, module}
  const loadSeq = useRef(0);
  const activeCollegeRef = useRef(collegeId);
  activeCollegeRef.current = collegeId;
  const searchSeq = useRef(0);
  const traceSeq = useRef(0);
  const historySeq = useRef(0);
  const mutationRef = useRef(false);
  const confirmRef = useRef(false);
  const [studentOptions, setStudentOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [trace, setTrace] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [learnerOverrides, setLearnerOverrides] = useState([]);
  const [overridesError, setOverridesError] = useState(null);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);

  const loadHistory = useCallback(async () => {
    const requestedCollegeId = collegeId;
    if (!requestedCollegeId || Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
    const requestId = ++historySeq.current;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const result = await fetchWithErrorHandling(getModuleAccessHistory(requestedCollegeId, 50));
      if (requestId !== historySeq.current || Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
      if (!result.success || !Array.isArray(result.data?.entries)) {
        setHistoryEntries([]);
        setHistoryError(result.message || "Could not load recent module-access changes.");
      } else {
        setHistoryEntries(result.data.entries);
      }
    } catch (error) {
      if (requestId !== historySeq.current || Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
      setHistoryEntries([]);
      setHistoryError(error?.message || "Could not load recent module-access changes.");
    } finally {
      if (requestId === historySeq.current && Number(activeCollegeRef.current) === Number(requestedCollegeId)) {
        setHistoryLoading(false);
      }
    }
  }, [collegeId]);

  const openHistory = () => {
    setHistoryOpen(true);
    loadHistory();
  };

  const load = useCallback(async () => {
    const requestedCollegeId = collegeId;
    if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
    const requestId = ++loadSeq.current;
    if (!requestedCollegeId) {
      setTree([]);
      setExpandedRowKeys([]);
      setCanEditCollege(false);
      setLearnerOverrides([]);
      setOverridesError(null);
      setOverridesLoading(false);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setOverridesError(null);
    setOverridesLoading(true);
    // fetchWithErrorHandling usually returns {success:false}, but direct throws (e.g.
    // request construction or interceptor failures) must not strand the loading state.
    let result;
    try {
      result = await fetchWithErrorHandling(getModuleAccessTree(requestedCollegeId));
    } catch (error) {
      result = { success: false, message: error?.message || "Could not load module access." };
    }
    if (requestId !== loadSeq.current || Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
    if (result.success) {
      const data = result.data || {};
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];
      const nextTree = buildTree(nodes);
      setTree(nextTree);
      // Large colleges can have hundreds of class rows. Open only the root level initially so
      // the page stays scannable and doesn't mount the entire hierarchy at once.
      setExpandedRowKeys(nextTree.map((node) => node.key));
      setCanEditCollege(Boolean(data.canEditCollegeLevel));
      fetchWithErrorHandling(getLearnerModuleOverrides(requestedCollegeId)).then((r) => {
        if (requestId !== loadSeq.current || Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
        if (r.success) {
          setLearnerOverrides(optionalOverrides(r.data?.students));
          setOverridesError(null);
        } else {
          setLearnerOverrides([]);
          setOverridesError(r.message || "Could not load student-specific overrides");
        }
        setOverridesLoading(false);
      }).catch((error) => {
        if (requestId !== loadSeq.current || Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
        setLearnerOverrides([]);
        setOverridesError(error?.message || "Could not load student-specific overrides");
        setOverridesLoading(false);
      });
    } else {
      setLoadError(result.message || "Could not load module access.");
      setTree([]);
      setExpandedRowKeys([]);
      setCanEditCollege(false);
      setLearnerOverrides([]);
      setOverridesError(null);
      setOverridesLoading(false);
    }
    if (requestId === loadSeq.current && Number(activeCollegeRef.current) === Number(requestedCollegeId)) setLoading(false);
  }, [collegeId]);

  useEffect(() => {
    // Invalidate in-flight requests and immediately hide prior-college data on a scope switch.
    setTree([]);
    setLearnerOverrides([]);
    setOverridesError(null);
    setOverridesLoading(false);
    ++searchSeq.current;
    ++traceSeq.current;
    ++historySeq.current;
    setHistoryOpen(false);
    setHistoryEntries([]);
    setHistoryError(null);
    setHistoryLoading(false);
    setSearching(false);
    setTraceLoading(false);
    setTrace(null);
    setStudentOptions([]);
    load();
    return () => { ++loadSeq.current; ++searchSeq.current; ++traceSeq.current; ++historySeq.current; };
  }, [load]);

  const runSearch = useMemo(() => debounce(async (query) => {
    const requestId = ++searchSeq.current;
    if (!query || query.trim().length < 2) {
      setStudentOptions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const response = await searchLearners(query.trim(), 10, collegeId);
      if (requestId !== searchSeq.current) return;
      const learners = response?.data?.data ?? response?.data ?? [];
      setStudentOptions((Array.isArray(learners) ? learners : []).map((learner) => ({
        value: String(learner.id),
        label: `${[learner.firstName, learner.lastName].filter(Boolean).join(" ") || `#${learner.id}`}${learner.rollNumber ? ` · ${learner.rollNumber}` : ""}`,
      })));
    } catch {
      if (requestId !== searchSeq.current) return;
      setStudentOptions([]);
    } finally {
      if (requestId === searchSeq.current) setSearching(false);
    }
  }, 300), [collegeId]);
  useEffect(() => () => runSearch.cancel(), [runSearch]);

  const openTrace = async (learnerId) => {
    const requestId = ++traceSeq.current;
    setTraceLoading(true);
    setTrace({ learnerId, loading: true });
    // Request construction and interceptors can throw before the normal error wrapper
    // returns. Keep the drawer retryable and reject late responses from another college.
    let result;
    try {
      result = await fetchWithErrorHandling(explainModuleAccess(learnerId));
    } catch (error) {
      result = { success: false, message: error?.message || "Could not load this student's access" };
    }
    if (requestId !== traceSeq.current) return;
    if (result.success) {
      setTrace({ ...(result.data || {}), learnerId, modules: optionalEntries(result.data?.modules) });
    } else {
      setTrace({ learnerId, error: result.message || "Could not load this student's access" });
    }
    setTraceLoading(false);
  };

  const clearLegacyLock = async (student, module) => {
    // Only a superadmin can remove a lock that has no corresponding explicit value.
    const requestedCollegeId = collegeId;
    if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)
        || mutationRef.current || !isSuperAdmin || !isOptionalModule(module) || student?.locks?.[module] !== true
        || Object.prototype.hasOwnProperty.call(student.overrides || {}, module)) return;
    mutationRef.current = true;
    const key = `LEARNER:${student.learnerId}:${module}:legacy-lock`;
    setSaving(key);
    try {
      await setModuleAccess({
        scopeType: "LEARNER", scopeId: student.learnerId,
        module, enabled: null, locked: false,
      });
      if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
      message.success("Legacy lock cleared");
      await load();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not clear the legacy lock");
    } finally {
      mutationRef.current = false;
      setSaving(null);
    }
  };

  const applyChange = async (node, module, value) => {
    const requestedCollegeId = collegeId;
    if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)
        || mutationRef.current || !isOptionalModule(module)) return;
    mutationRef.current = true;
    setSaving(`${node.scopeType}:${node.scopeId}:${module}`);
    try {
      await setModuleAccess({
        scopeType: node.scopeType, scopeId: node.scopeId,
        module, enabled: fromTriState(value),
      });
      if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
      message.success("Saved");
      setEditing(null);
      await load();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not save — please retry");
    } finally {
      mutationRef.current = false;
      setSaving(null);
    }
  };

  const applyStudentChange = async (module, value) => {
    const requestedCollegeId = collegeId;
    if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)
        || mutationRef.current || !trace?.learnerId || !isOptionalModule(module)) return;
    mutationRef.current = true;
    setSaving(`LEARNER:${trace.learnerId}:${module}`);
    try {
      await setModuleAccess({
        scopeType: "LEARNER", scopeId: trace.learnerId,
        module, enabled: fromTriState(value),
      });
      if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
      message.success("Saved for this student");
      await openTrace(trace.learnerId);
      await load();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not save — please retry");
    } finally {
      mutationRef.current = false;
      setSaving(null);
    }
  };

  const handleChange = (node, module, value) => {
    if (mutationRef.current || confirmRef.current || !isOptionalModule(module)) return;
    const isBroad = BROAD_LEVELS.includes(node.scopeType) || node.learnerCount >= BROAD_LEARNER_THRESHOLD;
    if (!isBroad || value === toTriState(moduleOf(node, module)?.explicitValue)) {
      applyChange(node, module, value);
      return;
    }
    const verb = value === "INHERIT" ? "reset to inherit" : value === "ON" ? "turn on" : "turn off";
    confirmRef.current = true;
    Modal.confirm({
      title: `${verb.charAt(0).toUpperCase()}${verb.slice(1)} ${MODULE_LABELS[module]}?`,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            This applies to <strong>{LEVEL_LABELS[node.scopeType]} “{node.name}”</strong>, covering{" "}
            <strong>{node.learnerCount} student{node.learnerCount === 1 ? "" : "s"} in this scope</strong>. This is a population count, not a count of students whose effective access will change; narrower overrides and locks can alter the outcome.
          </p>
          <Text type="secondary">
            {value === "OFF"
              ? `Students whose effective access becomes OFF will get an access error if they open ${MODULE_LABELS[module]} directly.`
              : value === "ON"
              ? `Students whose effective access becomes ON can open ${MODULE_LABELS[module]} again.`
              : "This clears the setting here, so students follow whatever the level above says."}
          </Text>
        </div>
      ),
      okText: verb.charAt(0).toUpperCase() + verb.slice(1),
      okButtonProps: { danger: value === "OFF" },
      onOk: async () => {
        confirmRef.current = false;
        await applyChange(node, module, value);
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const readOnlyFor = (node) => node.scopeType === "COLLEGE" && !canEditCollege;
  const toggleLock = async (node, module, locked) => {
    const requestedCollegeId = collegeId;
    if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)
        || mutationRef.current || !isOptionalModule(module)) return;
    mutationRef.current = true;
    const current = moduleOf(node, module);
    setSaving(`${node.scopeType}:${node.scopeId}:${module}`);
    try {
      await setModuleAccess({
        scopeType: node.scopeType, scopeId: node.scopeId,
        module, enabled: current?.explicitValue ?? null, locked,
      });
      if (Number(activeCollegeRef.current) !== Number(requestedCollegeId)) return;
      message.success(locked ? "Locked" : "Unlocked");
      await load();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not save — please retry");
    } finally {
      mutationRef.current = false;
      setSaving(null);
    }
  };

  const requestLockChange = (node, module, locked) => {
    if (mutationRef.current || confirmRef.current || !isOptionalModule(module)) return;
    const current = moduleOf(node, module);
    const isBroad = BROAD_LEVELS.includes(node.scopeType) || Number(node.learnerCount || 0) >= BROAD_LEARNER_THRESHOLD;
    if (!isBroad) {
      toggleLock(node, module, locked);
      return;
    }

    confirmRef.current = true;
    Modal.confirm({
      title: locked
        ? `Lock ${MODULE_LABELS[module]} at ${LEVEL_LABELS[node.scopeType]} “${node.name}”?`
        : `Unlock ${MODULE_LABELS[module]} at ${LEVEL_LABELS[node.scopeType]} “${node.name}”?`,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            This scope covers <strong>{Number(node.learnerCount || 0)} student{Number(node.learnerCount || 0) === 1 ? "" : "s"}</strong>.
          </p>
          <Text type="secondary">
            {locked
              ? "While locked, every narrower department/program/batch/class/student setting underneath is ignored for this module until the lock is removed."
              : "Removing the lock can make existing narrower overrides take effect immediately. Review inherited settings if this scope has been locked for a while."}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              Current value here: {current?.explicitValue === true ? "ON" : current?.explicitValue === false ? "OFF" : "Inherit"}.
            </Text>
          </div>
        </div>
      ),
      okText: locked ? "Lock this scope" : "Unlock this scope",
      okButtonProps: { danger: locked },
      onOk: async () => {
        confirmRef.current = false;
        await toggleLock(node, module, locked);
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const moduleColumn = (module) => ({
    title: MODULE_LABELS[module], key: module, width: 190,
    render: (_, node) => {
      const current = moduleOf(node, module);
      if (!current) return null;
      if (current.managedBy === "PLACEMENT_ELIGIBILITY") {
        return (
          <Tooltip title="Placements is switched for the whole college. Who is in placements is decided by the placement cell on the Batches page.">
            <Text type="secondary" style={{ fontSize: 12 }} data-testid={`managed-${node.scopeType}-${node.scopeId}`}>
              Placement cell decides
            </Text>
          </Tooltip>
        );
      }
      const explicit = current.explicitValue !== null && current.explicitValue !== undefined;
      const lockedAbove = current.effectiveLocked && current.effectiveLevel !== node.scopeType;
      const shadowed = explicit && lockedAbove;
      const cellKey = `${node.scopeType}:${node.scopeId}:${module}`;
      if (editing === cellKey) {
        return (
          <Space size={4} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setEditing(null);
          }}>
            <Segmented
              size="small" value={toTriState(current.explicitValue)} options={TRI_STATE}
              disabled={saving === cellKey} onChange={(value) => handleChange(node, module, value)}
            />
            {isSuperAdmin && explicit && (
              <Tooltip title={current.locked
                ? "Locked: nothing below can override this. Click to unlock."
                : "Lock this value so nothing below can override it."}>
                <LockOutlined
                  onClick={() => requestLockChange(node, module, !current.locked)}
                  style={{ cursor: "pointer", color: current.locked ? "#cf1322" : "#bfbfbf" }}
                  aria-label={`${current.locked ? "Unlock" : "Lock"} ${MODULE_LABELS[module]} for ${node.name}`}
                />
              </Tooltip>
            )}
          </Space>
        );
      }
      const disabled = readOnlyFor(node) || lockedAbove;
      return (
        <Tooltip title={lockedAbove
          ? `Locked at ${LEVEL_LABELS[current.effectiveLevel]} level — it can't be changed here.`
          : readOnlyFor(node) ? "College-level settings are managed by 42Students."
          : explicit ? "Set here. Click to change."
          : `Inherited from ${LEVEL_LABELS[current.effectiveLevel]}. Click to override here.`}>
          <span
            role={disabled ? undefined : "button"} tabIndex={disabled ? undefined : 0}
            onClick={() => !disabled && setEditing(cellKey)}
            onKeyDown={(event) => !disabled && event.key === "Enter" && setEditing(cellKey)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px",
              borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              background: explicit ? (current.explicitValue ? "#f6ffed" : "#fff1f0") : "transparent",
              border: explicit ? `1px solid ${current.explicitValue ? "#b7eb8f" : "#ffccc7"}` : "1px solid transparent",
              fontWeight: explicit ? 600 : 400,
              textDecoration: shadowed ? "line-through" : "none",
              color: (explicit ? current.explicitValue : current.effectiveEnabled) ? "#389e0d" : "#cf1322",
            }}
          >
            {current.effectiveLocked && <LockOutlined style={{ fontSize: 11 }} />}
            {explicit ? (current.explicitValue ? "ON" : "OFF") : current.effectiveEnabled ? "on" : "off"}
            {!explicit && (
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
                · {LEVEL_SHORT[current.effectiveLevel] || current.effectiveLevel}
              </Text>
            )}
            {shadowed && (
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
                · ignored, {current.effectiveEnabled ? "on" : "off"} from {LEVEL_SHORT[current.effectiveLevel] || current.effectiveLevel}
              </Text>
            )}
          </span>
        </Tooltip>
      );
    },
  });

  const flattenTree = (nodes) => (nodes || []).flatMap((node) => [node, ...flattenTree(node.children)]);
  const flatScopes = flattenTree(tree);
  const studentPopulation = Math.max(0, ...flatScopes.map((node) => Number(node.learnerCount || 0)));

  const columns = [
    {
      title: "Scope", dataIndex: "name", key: "name",
      render: (_, node) => (
        <Space size={6}>
          <span>{node.name}</span>
          <Tag style={{ marginInlineEnd: 0 }}>{LEVEL_LABELS[node.scopeType]}</Tag>
        </Space>
      ),
    },
    {
      title: "Students in scope", dataIndex: "learnerCount", key: "learnerCount",
      width: 100, align: "right", render: (value) => <Text type="secondary">{value}</Text>,
    },
    ...MODULES.map(moduleColumn),
  ];

  return (
    <>
      <AdminControlOverview
        eyebrow="Effective access"
        title="Optional module access hierarchy"
        description="Use this page for inherited Projects/Placements access below the college level. Search a student to explain the exact effective chain before overriding anything."
        scopeLabel={collegeId ? `College #${collegeId}` : "No college selected"}
        scopeColor={collegeId ? "blue" : "orange"}
        metrics={[
          { label: "Hierarchy scopes", value: flatScopes.length },
          { label: "Students in largest scope", value: studentPopulation },
          { label: "Student overrides", value: overridesLoading ? "…" : learnerOverrides.length, hint: "Persist through class changes" },
        ]}
        actions={
          <Space wrap>
            <AutoComplete
              style={{ width: 320, maxWidth: "calc(100vw - 120px)" }} options={studentOptions} onSearch={runSearch}
              onSelect={(value) => openTrace(Number(value))}
              notFoundContent={searching ? <Spin size="small" /> : null}
              placeholder="Why can't a student see a module? Search…"
              suffixIcon={<SearchOutlined />} allowClear
            />
            <Button size="small" icon={<HistoryOutlined />} onClick={openHistory} disabled={!collegeId}>
              Recent changes
            </Button>
            <Button size="small" onClick={() => setExpandedRowKeys(flatScopes.map((node) => node.key))}
              disabled={loading || flatScopes.length === 0 || expandedRowKeys.length === flatScopes.length}>
              Expand all
            </Button>
            <Button size="small" onClick={() => setExpandedRowKeys([])}
              disabled={loading || expandedRowKeys.length === 0}>
              Collapse all
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>
          </Space>
        }
      />
      <Card size="small">
      <Alert
        type="info" showIcon={false} style={{ marginBottom: 12 }} message="How this page works"
        description={
          <div style={{ fontSize: 13 }}>
            <p style={{ marginBottom: 6 }}>
              Switch optional Projects and Placements modules on or off for part of the college.
              Courses &amp; Content is always available; individual course permissions are managed in Courses.
            </p>
            <p style={{ marginBottom: 6 }}>
              <strong>Inherit</strong> follows the setting above it. An explicit <strong>On</strong> or
              <strong> Off</strong> is shown in bold; narrower settings win unless a higher level is locked.
            </p>
            <p style={{ marginBottom: 0 }}>
              Student counts show the population under each scope, not the number whose effective access will change. To change one student, search above; for many, use the bulk action on the Students page.
            </p>
          </div>
        }
      />

      {!collegeId && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Select a college to manage module access"
          description="The grid is college-scoped. Pick a college first so this page does not show stale access data from another scope."
        />
      )}

      {!canEditCollege && (
        <Alert
          type="info" showIcon style={{ marginBottom: 12 }}
          message="College-level settings are managed by 42Students"
          description="You can set optional modules for a department, program, batch, class or individual student."
        />
      )}
      {collegeId && overridesLoading && !loadError && (
        <Alert type="info" showIcon style={{ marginBottom: 12 }}
          message="Loading student-specific overrides…" />
      )}
      {overridesError && (
        <Alert type="error" showIcon style={{ marginBottom: 12 }}
          message="Couldn't load student overrides" description={overridesError}
          action={<Button size="small" onClick={load}>Retry</Button>} />
      )}
      {learnerOverrides.length > 0 && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 12 }}
          message={`${learnerOverrides.length} student${learnerOverrides.length === 1 ? " has" : "s have"} an individual override or lock`}
          description="Individual overrides and locks follow students through class changes until cleared."
          action={<Button size="small" onClick={() => setOverridesOpen(true)}>Review</Button>}
        />
      )}
      {loadError ? (
        <Alert type="error" showIcon message="Couldn't load module access" description={loadError} />
      ) : (
        <Table
          columns={columns} dataSource={tree} loading={loading} size="small"
          pagination={false} scroll={{ x: "max-content" }} expandedRowKeys={expandedRowKeys}
          onExpandedRowsChange={setExpandedRowKeys}
          locale={{ emptyText: <Empty description="No departments, programs or classes set up for this college yet." /> }}
        />
      )}
      <Drawer
        title="Recent module-access changes"
        placement="right"
        width={640}
        open={historyOpen}
        onClose={() => { ++historySeq.current; setHistoryOpen(false); setHistoryLoading(false); }}
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadHistory} loading={historyLoading}>Refresh</Button>}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Latest audited changes for this college, including college feature toggles and per-scope module overrides.
        </Text>
        {historyError ? (
          <Alert type="error" showIcon message="Recent changes could not be loaded" description={historyError}
            action={<Button size="small" onClick={loadHistory}>Retry</Button>} />
        ) : (
          <Table
            size="small"
            rowKey={(entry, index) => `${entry.at || "time"}:${entry.action || "action"}:${index}`}
            loading={historyLoading}
            dataSource={historyEntries}
            pagination={{ pageSize: 15, size: "small", hideOnSinglePage: true }}
            scroll={{ x: 620 }}
            locale={{ emptyText: <Empty description="No module-access changes recorded for this college yet." /> }}
            columns={[
              {
                title: "When",
                dataIndex: "at",
                key: "at",
                width: 155,
                render: (value) => value ? new Date(value).toLocaleString() : "—",
              },
              {
                title: "Change",
                key: "change",
                render: (_, entry) => {
                  const payload = parseAuditPayload(entry.payload);
                  const moduleLabel = MODULE_LABELS[payload.module] || payload.module || "Module";
                  const enabled = payload.enabled;
                  const summary = enabled === "null" || enabled == null
                    ? "Reset to inherit"
                    : String(enabled) === "true" ? "Turned on" : "Turned off";
                  return (
                    <div>
                      <div style={{ fontWeight: 600 }}>{historyActionLabel(entry.action)}</div>
                      <Text type="secondary">{moduleLabel} · {summary}</Text>
                      {payload.learnerCount ? (
                        <Text type="secondary" style={{ display: "block" }}>{payload.learnerCount} students</Text>
                      ) : null}
                    </div>
                  );
                },
              },
              {
                title: "Scope",
                key: "scope",
                width: 130,
                render: (_, entry) => {
                  const payload = parseAuditPayload(entry.payload);
                  return payload.scopeType
                    ? `${LEVEL_LABELS[payload.scopeType] || payload.scopeType}${payload.scopeId && payload.scopeId !== "null" ? ` #${payload.scopeId}` : ""}`
                    : "College";
                },
              },
              {
                title: "Changed by",
                key: "actor",
                width: 140,
                render: (_, entry) => entry.actorName || (entry.actorUserId ? `User #${entry.actorUserId}` : "System"),
              },
            ]}
          />
        )}
      </Drawer>
      <Drawer
        title="Students with their own override or lock" placement="right" width={520}
        open={overridesOpen} onClose={() => setOverridesOpen(false)}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Individual settings override the class, batch, program and college. Open a student to
          see the full chain or reset the override.
        </Text>
        <Table
          size="small" rowKey="learnerId" pagination={{ pageSize: 15, size: "small" }}
          dataSource={learnerOverrides}
          columns={[
            {
              title: "Student", key: "name",
              render: (_, student) => (
                <a onClick={() => { setOverridesOpen(false); openTrace(student.learnerId); }}>
                  {student.name || `#${student.learnerId}`}
                  {student.rollNumber ? <Text type="secondary"> · {student.rollNumber}</Text> : null}
                </a>
              ),
            },
            {
              title: "Set here", key: "overrides",
              render: (_, student) => (
                <Space size={4} wrap>
                  {Object.entries(student.overrides || {}).filter(([module]) => isOptionalModule(module))
                    .map(([module, value]) => (
                      <Tag key={module} color={value ? "green" : "red"}>
                        {MODULE_LABELS[module]}: {value ? "On" : "Off"}
                      </Tag>
                    ))}
                  {Object.entries(student.locks || {})
                    .filter(([module, locked]) => isOptionalModule(module) && locked === true
                      && !Object.prototype.hasOwnProperty.call(student.overrides || {}, module))
                    .map(([module]) => (
                      <Space key={`${module}:legacy-lock`} size={4}>
                        <Tag color="orange">{MODULE_LABELS[module]}: legacy lock without value</Tag>
                        {isSuperAdmin ? (
                          <Button size="small" loading={saving === `LEARNER:${student.learnerId}:${module}:legacy-lock`}
                            onClick={() => clearLegacyLock(student, module)}>Clear legacy lock</Button>
                        ) : (
                          <Text type="secondary">Super Admin must clear this lock</Text>
                        )}
                      </Space>
                    ))}
                </Space>
              ),
            },
          ]}
        />
      </Drawer>
      <Drawer
        title={trace?.learnerId ? "Why this student sees what they see" : "Student access"}
        placement="right" width={520} open={Boolean(trace)} onClose={() => { ++traceSeq.current; setTraceLoading(false); setTrace(null); }}
      >
        {traceLoading || trace?.loading ? (
          <Spin />
        ) : trace?.error ? (
          <Alert type="error" showIcon message="Couldn't load student access"
            description={trace.error}
            action={<Button size="small" onClick={() => openTrace(trace.learnerId)}>Retry</Button>} />
        ) : trace?.modules ? (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {optionalEntries(trace.modules).map((module) => {
              const decider = (module.levels || []).find((level) => level.status === "DECIDED");
              return (
                <div key={module.module}>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    {module.label}{" "}
                    <Tag color={module.enabled ? "green" : "red"}>{module.enabled ? "ON" : "OFF"}</Tag>
                    {module.locked && <Tag icon={<LockOutlined />} color="red">Locked</Tag>}
                  </Title>
                  {module.placementEligibility ? (
                    <PlacementExplain module={module} />
                  ) : (
                  <Alert
                    type={module.enabled ? "success" : "warning"} style={{ marginBottom: 8 }}
                    message={module.decidedAtLevel === "DEFAULT"
                      ? `${module.label} is on because nothing is set anywhere.`
                      : `${module.label} is ${module.enabled ? "ON" : "OFF"} because it is set at ${
                        LEVEL_LABELS[module.decidedAtLevel] || module.decidedAtLevel
                      }${decider?.scopeName ? ` “${decider.scopeName}”` : ""}${module.locked ? ", and locked there" : ""}.`}
                    description={!module.enabled
                      ? `The ${module.label} menu is hidden and the pages return an access error.`
                      : null}
                  />
                  )}
                  {!module.placementEligibility && (() => {
                    const studentLevel = (module.levels || []).find((level) => level.scopeType === "LEARNER");
                    const lockedAbove = module.locked && module.decidedAtLevel !== "LEARNER";
                    return (
                      <div style={{ marginBottom: 8 }}>
                        <Space size={8} wrap>
                          <Text type="secondary" style={{ fontSize: 12 }}>Just for this student:</Text>
                          <Segmented
                            size="small" value={toTriState(studentLevel?.explicitValue)}
                            options={TRI_STATE}
                            disabled={lockedAbove || saving === `LEARNER:${trace.learnerId}:${module.module}`}
                            onChange={(value) => applyStudentChange(module.module, value)}
                          />
                        </Space>
                        {lockedAbove && (
                          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                            Locked at {LEVEL_LABELS[module.decidedAtLevel]} level; a student exception cannot take effect.
                          </Text>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{ border: "1px solid #f0f0f0", borderRadius: 4 }}>
                    {(module.levels || []).map((level) => {
                      if (level.status === "MANAGED_BY_ELIGIBILITY") return null;
                      const decided = level.status === "DECIDED";
                      const ignored = level.status === "SHADOWED_BY_LOCK" || level.status === "OVERRIDDEN_BY_NARROWER";
                      return (
                        <div
                          key={`${level.scopeType}:${level.scopeId}`}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            gap: 8, padding: "6px 10px", borderBottom: "1px solid #fafafa",
                            background: decided ? "#f6ffed" : "transparent",
                            fontWeight: decided ? 600 : 400,
                          }}
                        >
                          <span style={{ minWidth: 0 }}>
                            {LEVEL_LABELS[level.scopeType] || level.scopeType}
                            {level.scopeName ? (
                              <Text type="secondary" style={{ fontSize: 12 }}> · {level.scopeName}</Text>
                            ) : null}
                          </span>
                          <span style={{ whiteSpace: "nowrap" }}>
                            {level.locked && <LockOutlined style={{ fontSize: 11, marginRight: 4 }} />}
                            {level.explicitValue === null || level.explicitValue === undefined ? (
                              <Text type="secondary" style={{ fontSize: 12 }}>not set</Text>
                            ) : (
                              <Text
                                delete={ignored}
                                type={ignored ? "secondary" : level.explicitValue ? "success" : "danger"}
                                style={{ fontSize: 12 }}
                              >
                                {level.explicitValue ? "ON" : "OFF"}
                              </Text>
                            )}
                            {decided && <Text type="secondary" style={{ fontSize: 12 }}> · decides it</Text>}
                            {level.status === "SHADOWED_BY_LOCK" && (
                              <Text type="secondary" style={{ fontSize: 12 }}> · ignored (locked above)</Text>
                            )}
                            {level.status === "OVERRIDDEN_BY_NARROWER" && (
                              <Text type="secondary" style={{ fontSize: 12 }}> · overridden</Text>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Space>
        ) : (
          <Empty description="No access information for this student." />
        )}
      </Drawer>
      </Card>
    </>
  );
}
