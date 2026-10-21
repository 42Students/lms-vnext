import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Segmented, Select, Space, Switch, Table, Tag, Tooltip, Typography, message } from "antd";
import { fetchWithErrorHandling, getColleges, getOrganizations, deleteFaculty } from "@/api/Services/AdminService";
import {
  createFacultyAdmin,
  listFacultyAdmins,
  setFacultyAdminStatus,
  listUserSessions,
  revokeAllUserSessions,
} from "@/api/Services/SuperAdminUsersService";
import AuditLogs from "@/pages/superadmin/sections/AuditLogs";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

// Super-admin-managed college roles (backend ProtectedFacultyRoles): only a super admin can
// create, edit, suspend or delete these accounts.
const MANAGED_ROLES = [
  { value: "ADMIN", label: "College Admin" },
  { value: "TPO", label: "TPO (Training & Placement Officer)" },
];
const roleLabel = (value) => MANAGED_ROLES.find((r) => r.value === value)?.label || value || "College Admin";

export default function AdminUsers({
  fixedCollegeId = null,
  onDirtyChange,
  onBusyChange,
} = {}) {
  const [orgs, setOrgs] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [activeScopeKey, setActiveScopeKey] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const listSeq = useRef(0);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ organizationId: null, collegeId: fixedCollegeId });
  const [roleFilter, setRoleFilter] = useState("ADMIN");
  const [form] = Form.useForm();
  // Session visibility and force-logout existed in the API and the JS client with no caller at
  // all, so an admin could be suspended with no way to see or end the sessions they still had.
  const [sessionsFor, setSessionsFor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const sessionsRequestRef = useRef(0);
  // Suspend/reactivate already had a full history (every FACULTY_ADMIN_STATUS row in
  // AdminAuditLog) with no UI to see it — this reuses the existing AuditLogs component rather
  // than building a second audit reader.
  const [historyFor, setHistoryFor] = useState(null);
  const [accountActionId, setAccountActionId] = useState(null);
  const [accountActionError, setAccountActionError] = useState(null);
  const accountActionRef = useRef(null);
  const isCollegeScoped = fixedCollegeId != null;

  useEffect(() => {
    onBusyChange?.(loading || accountActionId != null);
  }, [loading, accountActionId, onBusyChange]);

  useEffect(() => {
    onDirtyChange?.(false);
  }, [fixedCollegeId, onDirtyChange]);

  const collegeOptions = useMemo(() => {
    const id = fixedCollegeId;
    if (id == null) return [];
    const c = colleges.find((x) => (x.id ?? x.collegeId) === id);
    return [{ value: id, label: c?.name ?? c?.collegeName ?? `College ${id}` }];
  }, [colleges, fixedCollegeId]);

  const refresh = async (role = roleFilter) => {
    const requestId = ++listSeq.current;
    const requestScopeKey = fixedCollegeId != null ? JSON.stringify([Number(fixedCollegeId), role]) : null;
    if (!requestScopeKey) {
      setItems([]);
      setActiveScopeKey(null);
      setLoadedScopeKey(null);
      setErrorScopeKey(null);
      setListError(null);
      setListLoading(false);
      return;
    }
    const scopeChanged = loadedScopeKey !== requestScopeKey;
    setActiveScopeKey(requestScopeKey);
    if (scopeChanged) setItems([]);
    setListLoading(true);
    setListError(null);
    setErrorScopeKey(null);
    const res = await fetchWithErrorHandling(listFacultyAdmins({ organizationId: null, collegeId: fixedCollegeId, role }));
    if (requestId !== listSeq.current) return;
    if (res?.success) {
      setItems(res?.data?.items ?? []);
      setLoadedScopeKey(requestScopeKey);
    } else {
      setListError(res?.message || "Failed to load admin users.");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) setItems([]);
    }
    setListLoading(false);
  };

  useEffect(() => {
    ++listSeq.current;
    if (!isCollegeScoped) {
      setItems([]);
      setActiveScopeKey(null);
      setLoadedScopeKey(null);
      return;
    }
    (async () => {
      const o = await fetchWithErrorHandling(getOrganizations());
      const orgList = Array.isArray(o?.data?.data) ? o.data.data : (Array.isArray(o?.data) ? o.data : []);
      setOrgs(orgList || []);
      const c = await fetchWithErrorHandling(getColleges());
      setColleges(Array.isArray(c?.data) ? c.data : (Array.isArray(c?.data?.data) ? c.data.data : []));
      const next = { organizationId: null, collegeId: fixedCollegeId };
      setFilters(next);
      refresh(roleFilter);
      form.setFieldsValue({ collegeId: fixedCollegeId });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedCollegeId, isCollegeScoped]);

  const hasCurrentList = activeScopeKey != null && loadedScopeKey === activeScopeKey;
  const currentListError = activeScopeKey != null && errorScopeKey === activeScopeKey ? listError : null;
  const initialListLoading = listLoading && !hasCurrentList;
  const listRefreshing = listLoading && hasCurrentList;

  const onCreate = async (submittedValues) => {
    if (loading) return;
    let values = submittedValues;
    try {
      values = values || await form.validateFields();
    } catch (error) {
      if (error?.errorFields) return;
      throw error;
    }
    const payload = fixedCollegeId ? { ...values, collegeId: fixedCollegeId } : values;
    setCreateError("");
    setLoading(true);
    try {
      const res = await fetchWithErrorHandling(createFacultyAdmin(payload));
      if (!res.success) {
        const pseudoError = {
          response: {
            data: res?.data && typeof res.data === "object"
              ? res.data
              : { message: res?.message || "Failed to create admin user" },
          },
        };
        const fieldError = applyServerFieldErrors(form, pseudoError, {
          contact_mobile: "contactMobile",
          contact_mail: "contactMail",
          organization_id: "organizationId",
          college_id: "collegeId",
          faculty_type: "role",
        });
        const errorMessage = getServerFormError(pseudoError, res?.message || "Failed to create admin user.");
        setCreateError(errorMessage);
        if (!fieldError) message.error(errorMessage);
        return;
      }
      message.success(`${roleLabel(payload.role)} created`);
      form.resetFields();
      onDirtyChange?.(false);
      setRoleFilter(payload.role || "ADMIN");
      refresh(payload.role || "ADMIN");
    } finally {
      setLoading(false);
    }
  };

  const applyStatus = async (id, isDeleted, rejectOnFailure = true) => {
    const key = `${isDeleted ? "suspend" : "reactivate"}:${id}`;
    if (accountActionRef.current) return false;
    accountActionRef.current = key;
    setAccountActionId(id);
    setAccountActionError(null);
    try {
      const res = await fetchWithErrorHandling(setFacultyAdminStatus(id, { isDeleted }));
      if (!res.success) throw new Error(res.message || "Status change failed");
      message.success(
        isDeleted
          ? "Admin suspended. Their existing sessions were invalidated."
          : "Admin reactivated."
      );
      refresh();
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Status change failed";
      setAccountActionError({ id, isDeleted, message: errorMessage });
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      accountActionRef.current = null;
      setAccountActionId(null);
    }
  };

  // Suspending an admin locks them out of the console immediately, so it gets the same
  // confirmation every other consequential action in this console has. The toggle used to
  // apply on a single click with no prompt at all.
  const onToggle = (record, isDeleted) => {
    const name = `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim() || `#${record.id}`;
    if (!isDeleted) {
      applyStatus(record.id, false, false);
      return;
    }
    Modal.confirm({
      title: `Suspend ${name}?`,
      content:
        "They lose access to the admin console immediately and every session they currently have is ended. Suspension is reversible — this switch turns it back on. Faculty who mentor active projects cannot be suspended until those projects are reassigned.",
      okText: "Suspend",
      okButtonProps: { danger: true },
      onOk: () => applyStatus(record.id, true, true),
    });
  };

  // Reuses the generic FacultyController delete endpoint (no admin-specific one exists, and none
  // is needed — suspend already covers the reversible/day-to-day case). This is a hard delete
  // with no undo, so it's only offered once the account is already suspended, and it carries its
  // own separate confirmation naming exactly what a suspend does not do (erase the row, keep the
  // audit trail).
  const deleteAdmin = (record) => {
    const name = `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim() || `#${record.id}`;
    Modal.confirm({
      title: `Permanently delete ${name}?`,
      content:
        "This removes the admin account entirely — it cannot be undone or reactivated. Their past actions stay in the Activity Log, but the account itself is gone. Deletion is blocked if they still have teaching assignments or mentor an active project; reassign those first.",
      okText: "Delete permanently",
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(true);
        try {
          const res = await fetchWithErrorHandling(deleteFaculty(record.id));
          if (!res.success) {
            const errorMessage = res.message || "Failed to delete";
            message.error(errorMessage);
            throw new Error(errorMessage);
          }
          message.success("Admin deleted.");
          refresh();
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const openSessions = async (record, { preserveOpen = false } = {}) => {
    const request = ++sessionsRequestRef.current;
    if (!preserveOpen) {
      setSessionsFor(record);
      setSessions([]);
    }
    setSessionsError("");
    setSessionsLoading(true);
    try {
      const res = await fetchWithErrorHandling(listUserSessions("FACULTY", record.id));
      if (request !== sessionsRequestRef.current) return;
      if (!res.success) throw new Error(res.message || "Failed to load sessions");
      setSessions(Array.isArray(res?.data?.sessions) ? res.data.sessions : []);
    } catch (error) {
      if (request !== sessionsRequestRef.current) return;
      setSessionsError(error?.message || "Failed to load sessions");
    } finally {
      if (request === sessionsRequestRef.current) setSessionsLoading(false);
    }
  };

  const forceLogout = () => {
    if (!sessionsFor) return;
    const name = `${sessionsFor.firstName ?? ""} ${sessionsFor.lastName ?? ""}`.trim() || `#${sessionsFor.id}`;
    Modal.confirm({
      title: `Sign ${name} out everywhere?`,
      content:
        "Ends every active session on every device. They keep their account and can sign in again — use Suspend instead if you need to stop that.",
      okText: "Sign out everywhere",
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await fetchWithErrorHandling(revokeAllUserSessions("FACULTY", sessionsFor.id));
        if (!res.success) {
          const errorMessage = res.message || "Failed to revoke sessions";
          message.error(errorMessage);
          throw new Error(errorMessage);
        }
        message.success("All sessions ended.");
        openSessions(sessionsFor);
      },
    });
  };

  const columns = [
    { title: "Name", key: "name", render: (_, r) => `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || `#${r.id}` },
    { title: "Role", dataIndex: "facultyType", key: "facultyType", render: (v) => <Tag>{roleLabel(v)}</Tag> },
    { title: "Mobile", dataIndex: "contactMobile", key: "contactMobile" },
    { title: "Email", dataIndex: "contactMail", key: "contactMail" },
    { title: "Org", dataIndex: "organizationId", key: "organizationId" },
    { title: "College", dataIndex: "collegeId", key: "collegeId" },
    {
      title: "Enabled",
      key: "enabled",
      render: (_, r) => (
        <Space size={8}>
          <Switch
            checked={!r.isDeleted}
            onChange={(v) => onToggle(r, !v)}
            loading={accountActionId === r.id}
            disabled={loading || accountActionId != null}
          />
          {r.isDeleted && <Tag color="red">Suspended</Tag>}
        </Space>
      ),
    },
    {
      title: "Sessions",
      key: "sessions",
      width: 130,
      render: (_, r) => (
        <Tooltip title="View active sessions and sign this admin out everywhere">
          <Button size="small" onClick={() => openSessions(r)}>
            Sessions
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "adminActions",
      width: 200,
      render: (_, r) => (
        <Space size={8}>
          <Tooltip title="Suspend/reactivate history for this admin">
            <Button size="small" onClick={() => setHistoryFor(r)}>
              History
            </Button>
          </Tooltip>
          <Tooltip title={r.isDeleted ? "Permanently delete this account" : "Suspend the admin before deleting"}>
            <Button size="small" danger disabled={!r.isDeleted} onClick={() => deleteAdmin(r)}>
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!isCollegeScoped) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Select a College to manage Admins"
        description="Admin management is treated as college-scoped in Superadmin to prevent cross-tenant access."
      />
    );
  }

  return (
    <div>
      <Card title="Create College Admin or TPO" style={{ marginBottom: 16 }}>
        {createError ? (
          <Alert
            type="error"
            showIcon
            closable
            message="Admin user was not created"
            description={createError}
            onClose={() => setCreateError("")}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <Form form={form} layout="vertical" onFinish={onCreate} disabled={loading}
          onValuesChange={() => { onDirtyChange?.(true); setCreateError(""); }}>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item name="role" label="Role" initialValue="ADMIN" rules={[{ required: true, message: "Role required" }]}>
                <Select options={MANAGED_ROLES} data-testid="admin-users.role" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="firstName" label="First Name">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="lastName" label="Last Name">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="contactMail" label="Email" rules={[{ type: "email", message: "Enter a valid email" }]}>
                <Input inputMode="email" autoComplete="email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="contactMobile" label="Mobile" rules={[{ required: true, message: "Mobile required" }]}>
                <Input inputMode="tel" autoComplete="tel" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="organizationId" label="Organization (optional)">
                <Select allowClear options={orgs.map((o) => ({ value: o.id ?? o.orgId, label: o.name ?? o.orgName }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="collegeId" label="College" rules={[{ required: true, message: "College required" }]}>
                <Select
                  disabled={!!fixedCollegeId}
                  showSearch
                  optionFilterProp="label"
                  options={colleges.map((c) => ({ value: c.id ?? c.collegeId, label: c.name ?? c.collegeName }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={24}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} disabled={loading}>Create</Button>
                <Button onClick={() => { form.resetFields(); setCreateError(""); onDirtyChange?.(false); }} disabled={loading}>Clear</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title={roleFilter === "TPO" ? "TPOs" : "College Admins"}
        extra={
          <Space>
            <Segmented
              options={[{ value: "ADMIN", label: "College Admins" }, { value: "TPO", label: "TPOs" }]}
              value={roleFilter}
              onChange={(v) => { setRoleFilter(v); refresh(v); }}
            />
            <Button onClick={() => refresh()} loading={listLoading}>Refresh</Button>
          </Space>
        }
      >
        {accountActionError ? (
          <Alert
            type="error"
            showIcon
            closable
            message={accountActionError.isDeleted ? "Admin was not suspended" : "Admin was not reactivated"}
            description={accountActionError.message}
            action={<Button size="small"
              onClick={() => applyStatus(accountActionError.id, accountActionError.isDeleted, false)}
              disabled={accountActionId != null}>Retry</Button>}
            onClose={() => setAccountActionError(null)}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {listRefreshing ? <RefreshStatus label="Refreshing admin users…" /> : null}
        {currentListError ? (
          <Alert
            type={hasCurrentList ? "warning" : "error"}
            showIcon
            message={hasCurrentList ? "Couldn't refresh admin users" : "Couldn't load admin users"}
            description={hasCurrentList ? "Showing the last users loaded for this role." : currentListError}
            action={<Button size="small" onClick={() => refresh()}>Retry</Button>}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {initialListLoading ? (
          <TableSkeleton rows={8} columns={7} label="Loading admin users" />
        ) : currentListError && !hasCurrentList ? null : (
          <Table
            rowKey="id"
            dataSource={items}
            columns={columns}
            pagination={{ pageSize: 25 }}
            scroll={{ x: 1080 }}
          />
        )}
      </Card>

      <Modal
        title={
          sessionsFor
            ? `Active sessions — ${`${sessionsFor.firstName ?? ""} ${sessionsFor.lastName ?? ""}`.trim() || `#${sessionsFor.id}`}`
            : "Active sessions"
        }
        open={sessionsFor != null}
        onCancel={() => {
          ++sessionsRequestRef.current;
          setSessionsFor(null);
          setSessions([]);
          setSessionsError("");
          setSessionsLoading(false);
        }}
        footer={[
          <Button key="close" onClick={() => {
            ++sessionsRequestRef.current;
            setSessionsFor(null);
            setSessions([]);
            setSessionsError("");
            setSessionsLoading(false);
          }}>
            Close
          </Button>,
          <Button
            key="revoke"
            danger
            type="primary"
            onClick={forceLogout}
            disabled={sessionsLoading || sessions.length === 0}
          >
            Sign out everywhere
          </Button>,
        ]}
        width={760}
      >
        {sessionsError ? (
          <Alert
            type="error"
            showIcon
            message="Could not load active sessions"
            description={sessionsError}
            action={sessionsFor ? <Button size="small" onClick={() => openSessions(sessionsFor, { preserveOpen: true })}>Retry</Button> : null}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {sessionsLoading && sessions.length === 0 ? (
          <TableSkeleton rows={5} columns={4} label="Loading active sessions" />
        ) : sessionsError && sessions.length === 0 ? null : (
        <Table
          rowKey={(r) => r.id ?? r.jti}
          size="small"
          dataSource={sessions}
          pagination={false}
          scroll={{ x: 640 }}
          locale={{ emptyText: "No active sessions." }}
          columns={[
            {
              title: "Device / agent",
              key: "agent",
              render: (_, r) => (
                <Typography.Text ellipsis={{ tooltip: r.userAgent }} style={{ maxWidth: 280 }}>
                  {r.deviceInfo || r.userAgent || "Unknown device"}
                </Typography.Text>
              ),
            },
            { title: "IP", dataIndex: "ipAddress", key: "ipAddress", width: 140 },
            {
              title: "Last used",
              key: "lastUsed",
              width: 190,
              render: (_, r) => r.lastUsedAt || r.updatedAt || r.createdAt || "—",
            },
          ]}
        />
        )}
      </Modal>

      <Modal
        title={
          historyFor
            ? `Suspend/reactivate history — ${`${historyFor.firstName ?? ""} ${historyFor.lastName ?? ""}`.trim() || `#${historyFor.id}`}`
            : "Admin history"
        }
        open={historyFor != null}
        onCancel={() => setHistoryFor(null)}
        footer={[
          <Button key="close" onClick={() => setHistoryFor(null)}>
            Close
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        {historyFor && (
          <AuditLogs
            fixedCollegeId={fixedCollegeId}
            fixedEntityId={String(historyFor.id)}
            fixedEntityType="faculty"
            hideFilters
          />
        )}
      </Modal>
    </div>
  );
}
