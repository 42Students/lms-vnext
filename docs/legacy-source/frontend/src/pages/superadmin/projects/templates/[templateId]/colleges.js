import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, Input, Popconfirm, Skeleton, Space, Switch, Table, Tag, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminTemplateShell from "@/components/admin/SuperAdminTemplateShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import {
  assignProjectTemplateToCollege,
  fetchWithErrorHandling,
  getAssignedCollegeIdsForProjectTemplate,
  bulkSetProjectTemplateColleges,
  getColleges,
  getProjectTemplateById,
  unassignProjectTemplateFromCollege,
} from "@/api/Services/AdminService";
import { asArray, normaliseCollegeScopedName, unwrapApiItem, unwrapApiList } from "@/components/admin/projects/adminProjectUtils";

const { Text, Paragraph } = Typography;

export default function SuperAdminProjectTemplateCollegesPage() {
  const router = useRouter();
  // Only used to load the template itself; assignment is per-college and never uses the header
  // scope, since this page is about every college at once.
  const { selectedCollegeId: collegeId } = useSuperAdminScope();
  const templateId = router.query.templateId;

  const [template, setTemplate] = useState(null);
  const [templateError, setTemplateError] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [colleges, setColleges] = useState([]);
  const [assignedCollegeIds, setAssignedCollegeIds] = useState([]);
  // Colleges whose assignment could not be read at all — rendered as "Unknown", never as
  // a plain "Not assigned".
  const [unknownCollegeIds, setUnknownCollegeIds] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(null);
  const [savingCollegeId, setSavingCollegeId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCollegeIds, setSelectedCollegeIds] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!templateId) return;
      setLoadingTemplate(true);
      setTemplateError(null);
      try {
        const result = await fetchWithErrorHandling(getProjectTemplateById(templateId, collegeId));
        if (!mounted) return;
        if (result.success) {
          setTemplate(unwrapApiItem(result));
        } else {
          setTemplate(null);
          setTemplateError(result?.message || "Failed to load template.");
        }
      } catch (e) {
        if (!mounted) return;
        setTemplate(null);
        setTemplateError(e?.message || "Failed to load template.");
      } finally {
        if (mounted) setLoadingTemplate(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [templateId, collegeId]);

  // The numeric template id is what the assignment endpoints (and the by-college listing they
  // return) speak in — the route param can be a slug.
  const numericTemplateId = template?.id ?? null;

  const loadAssignments = useCallback(
    async (mountedRef) => {
      if (numericTemplateId == null) return;
      setLoadingAssignments(true);
      setAssignmentsError(null);
      try {
        // `all: true` bypasses the backend's own self-scoping on fetchCollegeList — without it the
        // list narrows to the header's currently-applied scope and most colleges disappear.
        const collegeRes = await getColleges({ params: { all: true } });
        const payload = collegeRes?.data;
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        if (mountedRef && !mountedRef.current) return;
        setColleges(list);

        // Read assignments for this template in one request, not one request per college.
        const assignmentResult = await fetchWithErrorHandling(getAssignedCollegeIdsForProjectTemplate(numericTemplateId));
        if (mountedRef && !mountedRef.current) return;
        if (!assignmentResult.success) throw new Error(assignmentResult?.message || "Failed to load template assignments.");
        setAssignedCollegeIds(asArray(unwrapApiList(assignmentResult)).map(String));
        setUnknownCollegeIds([]);
        setSelectedCollegeIds([]);
      } catch (e) {
        if (mountedRef && !mountedRef.current) return;
        setColleges([]);
        setAssignedCollegeIds([]);
        setUnknownCollegeIds([]);
        setAssignmentsError(e?.message || "Failed to load college assignments.");
      } finally {
        if (!mountedRef || mountedRef.current) setLoadingAssignments(false);
      }
    },
    [numericTemplateId]
  );

  useEffect(() => {
    const mountedRef = { current: true };
    loadAssignments(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, [loadAssignments]);

  const handleToggle = useCallback(async (college, nextAssigned) => {
    const id = college?.id ?? college?.collegeId;
    if (id == null || numericTemplateId == null) return;
    setSavingCollegeId(String(id));
    try {
      if (nextAssigned) {
        await assignProjectTemplateToCollege(numericTemplateId, id);
        setAssignedCollegeIds((prev) => (prev.includes(String(id)) ? prev : [...prev, String(id)]));
        message.success(`Assigned to ${college?.name || "this college"}`);
      } else {
        await unassignProjectTemplateFromCollege(numericTemplateId, id);
        setAssignedCollegeIds((prev) => prev.filter((value) => value !== String(id)));
        message.success(`Removed from ${college?.name || "this college"}`);
      }
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update this college's template assignment." });
    } finally {
      setSavingCollegeId(null);
    }
  }, [numericTemplateId]);

  const handleBulk = useCallback(async (assign) => {
    if (!numericTemplateId || bulkSaving || loadingAssignments || assignmentsError || !selectedCollegeIds.length) return;
    const selected = new Set(selectedCollegeIds);
    const current = new Set(assignedCollegeIds);
    const target = assign ? [...new Set([...current, ...selected])] : [...current].filter((id) => !selected.has(id));
    setBulkSaving(true);
    try {
      // Refresh the assignment set to avoid overwriting changes made in another tab.
      const fresh = await fetchWithErrorHandling(getAssignedCollegeIdsForProjectTemplate(numericTemplateId));
      if (!fresh.success) throw new Error(fresh?.message || "Could not verify current assignments.");
      const latest = new Set(asArray(unwrapApiList(fresh)).map(String));
      const verifiedTarget = assign ? [...new Set([...latest, ...selected])] : [...latest].filter((id) => !selected.has(id));
      // Compare-and-set against the set just read: if another admin changes it in between, the server answers 409
      // instead of removing their assignments (Projects audit R7-02).
      await bulkSetProjectTemplateColleges(numericTemplateId, verifiedTarget.map(Number), [...latest].map(Number));
      setAssignedCollegeIds(verifiedTarget);
      setSelectedCollegeIds([]);
      message.success(assign ? "Selected colleges assigned" : "Selected college assignments removed");
    } catch (error) {
      showProjectError(error, { fallback: "Could not update selected colleges." });
      await loadAssignments();
    } finally { setBulkSaving(false); }
  }, [numericTemplateId, bulkSaving, loadingAssignments, assignmentsError, selectedCollegeIds, assignedCollegeIds, loadAssignments]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return colleges.filter((college) => !term || String(college?.name || "").toLowerCase().includes(term));
  }, [colleges, search]);

  const columns = useMemo(
    () => [
      {
        title: "College",
        key: "college",
        render: (_, college) => (
          <div>
            <div style={{ fontWeight: 600 }}>{college?.name || `College ${college?.id ?? college?.collegeId ?? ""}`}</div>
            {college?.city || college?.state ? (
              <Text type="secondary">{[college?.city, college?.state].filter(Boolean).join(", ")}</Text>
            ) : null}
          </div>
        ),
      },
      {
        title: "Available to this college",
        key: "assigned",
        width: 240,
        render: (_, college) => {
          const id = String(college?.id ?? college?.collegeId ?? "");
          const assigned = assignedCollegeIds.includes(id);
          const unknown = unknownCollegeIds.includes(id);
          return (
            <Space>
              {assigned ? (
                // Removing a template from a college is the destructive direction — it disappears
                // from that college's catalog and they can no longer create workspaces from it —
                // so it is confirmed, like every other removal in this console. Assigning is
                // additive and stays a single click.
                <Popconfirm
                  title="Remove this template from the college?"
                  description="They will no longer see it in their catalog or be able to create new workspaces from it. Workspaces they already created are unaffected."
                  okText="Remove"
                  okButtonProps={{ danger: true, loading: savingCollegeId === id }}
                  onConfirm={() => handleToggle(college, false)}
                >
                  {/* The Switch sits inside a span rather than being the Popconfirm's direct
                      child on purpose. Popconfirm clones its child's onClick and reads
                      event.clientX off the first argument — but rc-switch calls
                      onClick(checked, event), so the boolean arrives where the event is expected.
                      It happens not to throw today (property access on a boolean is undefined,
                      and the position is only used for alignPoint, which Popconfirm doesn't set),
                      but that is an accident, not a contract. The span receives the real bubbled
                      MouseEvent instead. */}
                  <span>
                    <Switch
                      checked
                      loading={savingCollegeId === id}
                      disabled={unknown || (Boolean(savingCollegeId) && savingCollegeId !== id)}
                    />
                  </span>
                </Popconfirm>
              ) : (
                <Switch
                  checked={false}
                  loading={savingCollegeId === id}
                  // A toggle whose current state is unknown would be a guess, not a change.
                  disabled={unknown || (Boolean(savingCollegeId) && savingCollegeId !== id)}
                  onChange={() => handleToggle(college, true)}
                />
              )}
              {unknown ? (
                <Tag color="orange" title="This college's assignments could not be read — refresh to try again">
                  Unknown
                </Tag>
              ) : (
                <Tag color={assigned ? "green" : "default"}>{assigned ? "Assigned" : "Not assigned"}</Tag>
              )}
            </Space>
          );
        },
      },
    ],
    [assignedCollegeIds, unknownCollegeIds, savingCollegeId, handleToggle]
  );

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminTemplateShell
        templateId={templateId}
        title={template ? normaliseCollegeScopedName(template, "Template") : "Template"}
        subtitle="Which colleges can see and use this template."
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => loadAssignments()} loading={loadingAssignments} disabled={numericTemplateId == null}>
            Refresh
          </Button>
        }
      >
        {templateError ? (
          <Alert type="error" message="Template could not be loaded" description={templateError} showIcon style={{ marginBottom: 16 }} />
        ) : null}
        {assignmentsError ? (
          <Alert type="error" message="College assignments could not be loaded" description={assignmentsError} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Skeleton loading={loadingTemplate} active paragraph={{ rows: 6 }}>
          {template ? (
            <Card
              title="College availability"
              extra={
                <Input.Search allowClear placeholder="Search colleges" style={{ width: 240 }} value={search} onChange={(e) => setSearch(e.target.value)} />
              }
            >
              <Paragraph type="secondary">
                Opt-in only — this template stays hidden from a college&apos;s own admin until it is switched on here. Turning it off
                does not touch workspaces that were already created from it.
              </Paragraph>
              <Space wrap style={{ marginBottom: 12 }}>
                <Text type="secondary">{selectedCollegeIds.length} selected</Text>
                <Button disabled={!selectedCollegeIds.length || bulkSaving || loadingAssignments || !!assignmentsError} loading={bulkSaving} onClick={() => handleBulk(true)}>Assign selected</Button>
                <Popconfirm title={`Remove this template from ${selectedCollegeIds.length} selected colleges?`} description="Existing workspaces remain unchanged." okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => handleBulk(false)}>
                  <Button danger disabled={!selectedCollegeIds.length || bulkSaving || loadingAssignments || !!assignmentsError}>Remove selected</Button>
                </Popconfirm>
              </Space>
              <Skeleton loading={loadingAssignments} active paragraph={{ rows: 6 }}>
                {rows.length ? (
                  <Table
                    rowKey={(record) => String(record?.id ?? record?.collegeId)}
                    dataSource={rows}
                    rowSelection={{ selectedRowKeys: selectedCollegeIds, onChange: (keys) => setSelectedCollegeIds(keys), getCheckboxProps: () => ({ disabled: loadingAssignments || bulkSaving || !!assignmentsError }) }}
                    columns={columns}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: "max-content" }}
                  />
                ) : (
                  <Empty description="No colleges match your search" />
                )}
              </Skeleton>
            </Card>
          ) : (
            !loadingTemplate && <Alert type="warning" message="Template not found" showIcon />
          )}
        </Skeleton>
      </SuperAdminTemplateShell>
    </div>
  );
}

SuperAdminProjectTemplateCollegesPage.superAdminLayout = SuperAdminLayout;
