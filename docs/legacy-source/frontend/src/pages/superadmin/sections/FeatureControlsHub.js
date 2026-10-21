import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Input, Modal, Space, Switch, Table, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import AdminControlOverview from "@/components/admin/AdminControlOverview";
import {
  fetchWithErrorHandling,
  getCollegeFeatureFlags,
  getFeatureModules,
  getMentorCountForCollege,
  getPlacementsImpactForCollege,
  updateCollegeFeatureFlag,
} from "@/api/Services/AdminService";

const { Text } = Typography;

// Courses is a core LMS capability and must never be offered as an availability switch.
// Allow-list both fallback and server catalogs: a backend deployed before this change may
// still advertise the retired Courses toggle, especially in cached or mixed-version sessions.
const FALLBACK_MODULES = { projects: "Projects", placements: "Placements" };
const optionalModulesOnly = (catalog) => {
  if (!catalog || typeof catalog !== "object") return FALLBACK_MODULES;
  const filtered = Object.fromEntries(
    Object.entries(catalog).filter(([module]) => Object.prototype.hasOwnProperty.call(FALLBACK_MODULES, module))
  );
  return Object.keys(filtered).length ? filtered : FALLBACK_MODULES;
};

export default function FeatureControlsHub({ selectedOrganizationId = null, selectedCollegeId = null }) {
  // The parent supplies the applied JWT scope. Keep rows tied to that scope rather
  // than showing the previous tenant's switches while a new request is pending.
  const scopeKey = `organization:${selectedOrganizationId ?? "all"}|college:${selectedCollegeId ?? "all"}`;
  const scopeKeyRef = useRef(scopeKey);
  scopeKeyRef.current = scopeKey;
  const fetchSequenceRef = useRef(0);
  const [dataScopeKey, setDataScopeKey] = useState(null);
  const [data, setData] = useState([]);
  const [modules, setModules] = useState(FALLBACK_MODULES);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [modulesError, setModulesError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [search, setSearch] = useState("");
  const savingRef = useRef(false);
  const confirmRef = useRef(false);

  const fetchData = async () => {
    const requestId = ++fetchSequenceRef.current;
    const requestedScope = scopeKey;
    setLoading(true);
    setLoadError(null);
    setModulesError(null);
    try {
      const [flagsResult, modulesResult] = await Promise.all([
        fetchWithErrorHandling(getCollegeFeatureFlags()),
        fetchWithErrorHandling(getFeatureModules()),
      ]);
      // Scope can change mid-flight, and a manual refresh can finish out of order.
      if (requestId !== fetchSequenceRef.current || requestedScope !== scopeKeyRef.current) return;
      if (flagsResult.success && Array.isArray(flagsResult.data)) {
        const rows = flagsResult.data;
        setData(selectedCollegeId == null ? rows : rows.filter((row) =>
          Number(row.collegeId) === Number(selectedCollegeId)));
        setLoadError(null);
      } else {
        // Never keep previously fetched switches interactive after a failed refresh.
        setData([]);
        setLoadError(flagsResult.message || "Failed to load feature controls");
      }
      setDataScopeKey(requestedScope);
      if (modulesResult.success) {
        setModules(optionalModulesOnly(modulesResult.data));
        setModulesError(null);
      } else {
        setModules(FALLBACK_MODULES);
        setModulesError(modulesResult.message || "Could not load the module catalog; showing the built-in module list.");
      }
    } catch (error) {
      if (requestId !== fetchSequenceRef.current || requestedScope !== scopeKeyRef.current) return;
      setData([]);
      setDataScopeKey(requestedScope);
      setLoadError(error?.message || "Failed to load feature controls");
    } finally {
      if (requestId === fetchSequenceRef.current && requestedScope === scopeKeyRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    return () => { fetchSequenceRef.current += 1; };
    // Depend on applied scope, not unrelated state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollegeId, selectedOrganizationId]);

  const detailsFor = (record, module) => record?.moduleDetails?.[module] ?? null;
  const lockedHere = (record, module) => {
    const details = detailsFor(record, module);
    return details?.effectiveLocked === true || details?.editableHere === false;
  };
  const inheritedFrom = (record, module) => {
    const level = detailsFor(record, module)?.effectiveLevel;
    if (!level || level === "DEFAULT" || level === "COLLEGE") return null;
    return level.charAt(0) + level.slice(1).toLowerCase();
  };

  const isEnabled = (record, module) => {
    const fromMap = record?.modules?.[module];
    if (typeof fromMap === "boolean") return fromMap;
    if (module === "projects") return record?.projectsEnabled !== false;
    if (module === "placements") return record?.placementsEnabled === true; // paid module: off unless switched on
    return true;
  };

  // rejectOnFailure keeps a confirmation dialog open (antd waits on the rejected promise) when the switch fails.
  const handleToggle = async (record, module, enabled, rejectOnFailure = false) => {
    if (savingRef.current || !Object.prototype.hasOwnProperty.call(FALLBACK_MODULES, module) || dataScopeKey !== scopeKey
        || lockedHere(record, module)) return false;
    savingRef.current = true;
    setMutationError(null);
    const requestedScope = scopeKey;
    const key = `${record.collegeId}-${module}`;
    setSavingId(key);
    try {
      await updateCollegeFeatureFlag(record.collegeId, module, enabled);
      if (requestedScope !== scopeKeyRef.current) return;
      // The server owns effective state: an inherited OFF can still win after a local
      // write, and another administrator may change a lock concurrently. Never invent
      // the post-save effective value by optimistically replacing the local switch.
      await fetchData();
      if (requestedScope === scopeKeyRef.current) {
        message.success(`${modules[module] || module} updated for ${record.collegeName}`);
      }
    } catch (error) {
      if (requestedScope === scopeKeyRef.current) {
        // Stays on screen with a Retry, instead of a toast that disappears.
        setMutationError({ record, module, enabled, message: error?.response?.data?.message || "Failed to update — please retry" });
      }
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      savingRef.current = false;
      setSavingId(null);
    }
    return true;
  };

  const confirmDisableProjects = async (record) => {
    if (savingRef.current || confirmRef.current || dataScopeKey !== scopeKey) return;
    savingRef.current = true;
    const requestedScope = scopeKey;
    const key = `${record.collegeId}-projects`;
    setSavingId(key);
    let countResult;
    try {
      countResult = await fetchWithErrorHandling(getMentorCountForCollege(record.collegeId));
    } catch (_) {
      countResult = { success: false };
    } finally {
      savingRef.current = false;
      setSavingId(null);
    }
    // A stale mentor count must never open a confirmation for the previous college.
    if (requestedScope !== scopeKeyRef.current) return;
    const mentorCount = countResult.success ? Number(countResult.data?.mentorCount || 0) : null;

    let content;
    if (mentorCount === null) {
      content = "Mentor-impact data is unavailable. This does not mean disabling Projects is safe: check active workspaces, learner submissions and upcoming meetings before proceeding.";
    } else if (mentorCount > 0) {
      content = `${mentorCount} mentor${mentorCount === 1 ? "" : "s"} at ${record.collegeName} ${
        mentorCount === 1 ? "is" : "are"
      } actively assigned to a project right now. This counts active primary mentors only; learners, other members, pending submissions and meetings may also be affected.`;
    } else {
      content = `No active primary mentors were found at ${record.collegeName}. This is not a safety check: review workspaces, learners, submissions and upcoming meetings before disabling Projects.`;
    }

    confirmRef.current = true;
    Modal.confirm({
      title: "Turn off Projects?",
      content,
      okText: "Turn off Projects",
      okButtonProps: { danger: true },
      onOk: async () => {
        confirmRef.current = false;
        await handleToggle(record, "projects", false, true);
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const confirmDisablePlacements = async (record) => {
    if (savingRef.current || confirmRef.current || dataScopeKey !== scopeKey) return;
    savingRef.current = true;
    const requestedScope = scopeKey;
    const key = `${record.collegeId}-placements`;
    setSavingId(key);
    let impactResult;
    try {
      impactResult = await fetchWithErrorHandling(getPlacementsImpactForCollege(record.collegeId));
    } catch (_) {
      impactResult = { success: false };
    } finally {
      savingRef.current = false;
      setSavingId(null);
    }
    if (requestedScope !== scopeKeyRef.current) return;

    const impact = impactResult?.success ? (impactResult.data || {}) : null;
    const content = impact ? (
      <div>
        <p>
          This hides Placements for the placement cell, college admins, students and recruiters at
          <strong> {record.collegeName}</strong>. Nothing is deleted; turning it back on restores access.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
          <div><Text type="secondary">Active drives</Text><div><strong>{Number(impact.activeJobs || 0)}</strong></div></div>
          <div><Text type="secondary">In-progress applications</Text><div><strong>{Number(impact.inProgressApplications || 0)}</strong></div></div>
          <div><Text type="secondary">Pending offers</Text><div><strong>{Number(impact.pendingOffers || 0)}</strong></div></div>
          <div><Text type="secondary">Upcoming interviews</Text><div><strong>{Number(impact.upcomingInterviews || 0)}</strong></div></div>
        </div>
        <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
          Counts can overlap; they are a blast-radius preview, not a deletion list.
        </Text>
      </div>
    ) : (
      <div>
        Impact data could not be loaded. This does not mean disabling Placements is safe. Check
        active drives, in-progress applications, interviews and offers before proceeding.
      </div>
    );

    confirmRef.current = true;
    Modal.confirm({
      title: `Turn off Placements for ${record.collegeName}?`,
      content,
      width: 560,
      okText: "Turn off Placements",
      okButtonProps: { danger: true },
      onOk: async () => {
        confirmRef.current = false;
        await handleToggle(record, "placements", false, true);
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const columns = [
    { title: "College", dataIndex: "collegeName", key: "collegeName", fixed: "left" },
    ...Object.entries(modules).map(([module, label]) => ({
      title: label,
      key: module,
      width: 140,
      render: (_, record) => {
        const locked = lockedHere(record, module);
        const inherited = inheritedFrom(record, module);
        const level = detailsFor(record, module)?.effectiveLevel;
        return (
          <div>
            <Switch
              checked={isEnabled(record, module)}
              onChange={(value) => {
                if (locked) return;
                if (!value && module === "projects") {
                  confirmDisableProjects(record);
                } else if (!value && module === "placements") {
                  confirmDisablePlacements(record);
                } else {
                  handleToggle(record, module, value);
                }
              }}
              disabled={locked || loading || dataScopeKey !== scopeKey || savingRef.current || confirmRef.current || savingId === `${record.collegeId}-${module}`}
              aria-label={`${label} for ${record.collegeName}`}
            />
            {locked && (
              <Text type="warning" style={{ display: "block", fontSize: 11 }}>
                Locked at {level && level !== "DEFAULT" ? level.charAt(0) + level.slice(1).toLowerCase() : "higher"} level
              </Text>
            )}
            {!locked && inherited && (
              <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
                Inherited from {inherited}
              </Text>
            )}
          </div>
        );
      },
    })),
  ];

  const scopeRows = dataScopeKey === scopeKey ? data : [];
  const visibleRows = scopeRows.filter((record) =>
    !search.trim() || String(record.collegeName || "").toLowerCase().includes(search.trim().toLowerCase())
  );
  const projectsOn = scopeRows.filter((record) => isEnabled(record, "projects")).length;
  const placementsOn = scopeRows.filter((record) => isEnabled(record, "placements")).length;

  return (
    <>
      <AdminControlOverview
        eyebrow="Module availability"
        title="Optional modules by college"
        description="This is the broad availability switch for Projects and Placements. Narrower department, class or student access belongs in Module Access; Courses & Content is core and is never switched off here."
        scopeLabel={selectedCollegeId != null ? "One college" : selectedOrganizationId != null ? "Organization scope" : "Platform view"}
        scopeColor={selectedCollegeId != null ? "blue" : selectedOrganizationId != null ? "gold" : "green"}
        metrics={[
          { label: "Colleges in scope", value: scopeRows.length },
          { label: "Projects on", value: projectsOn },
          { label: "Placements on", value: placementsOn },
        ]}
        actions={<Button icon={<ReloadOutlined />} onClick={fetchData} size="small" loading={loading}>Refresh</Button>}
      />
      {mutationError ? (
        <Alert
          type="error"
          showIcon
          closable
          message="Feature control was not changed"
          description={mutationError.message}
          action={(
            <Button size="small" disabled={Boolean(savingId)}
              onClick={() => handleToggle(mutationError.record, mutationError.module, mutationError.enabled)}>
              Retry
            </Button>
          )}
          onClose={() => setMutationError(null)}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Card size="small">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input.Search
          aria-label="Search feature-control colleges"
          placeholder="Search colleges"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 280, maxWidth: "100%" }}
        />
        <Space size={8}>
          <Text type="secondary">
            {search.trim() ? `${visibleRows.length} of ${scopeRows.length} colleges` : `${scopeRows.length} colleges`}
          </Text>
          {search.trim() ? <Button size="small" type="link" onClick={() => setSearch("")}>Clear</Button> : null}
        </Space>
      </div>
      {loadError && <Alert type="error" showIcon style={{ marginBottom: 12 }}
        message="Feature controls could not be loaded" description={loadError}
        action={<Button size="small" onClick={fetchData}>Retry</Button>} />}
      {modulesError && !loadError && <Alert type="warning" showIcon style={{ marginBottom: 12 }}
        message="Module catalog is partially unavailable" description={modulesError}
        action={<Button size="small" onClick={fetchData}>Retry</Button>} />}
      <Table
        dataSource={visibleRows}
        columns={columns}
        rowKey="collegeId"
        loading={loading || dataScopeKey !== scopeKey}
        size="small"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
        locale={{ emptyText: loadError ? "Could not load feature controls; use Retry above." : search.trim() ? "No colleges match this search." : "No colleges found." }}
      />
      </Card>
    </>
  );
}
