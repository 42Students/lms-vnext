import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Button, Card, DatePicker, Drawer, Form, Input, Modal, Select, Space, Spin, Table, Tag, Tooltip, Typography, message,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AdminControlOverview from "@/components/admin/AdminControlOverview";
import { fetchWithErrorHandling, getColleges } from "@/api/Services/AdminService";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import {
  createRecruiterAccount,
  deleteRecruiterAccount,
  getRecruiterAccount,
  grantRecruiterCollege,
  listRecruiterAccounts,
  reactivateRecruiterAccount,
  revokeRecruiterCollege,
  revokeRecruiterSessions,
  suspendRecruiterAccount,
  updateRecruiterAccount,
} from "@/api/Services/SuperAdminRecruiterService";

const STATUS_COLOR = { ACTIVE: "green", SUSPENDED: "orange", DELETED: "red" };

const fullName = (recruiter) => `${recruiter?.firstName ?? ""} ${recruiter?.lastName ?? ""}`.trim() || `#${recruiter?.id}`;

// fetchWithErrorHandling: on failure `data` is the response body and `error` its error code.
const errorText = (res, fallback) => res?.data?.message || res?.message || fallback;

/**
 * Super-admin management of recruiter (industry recruiter) accounts: one identity per person, with the
 * colleges they may enter. A super admin scoped to a college only sees recruiters with access there and
 * can only grant or revoke that college. Backend: SuperAdminRecruiterController (docs/recruiter-tpo/DESIGN.md).
 */
export default function RecruiterAccounts({ selectedOrganizationId = null, selectedCollegeId = null }) {
  const [items, setItems] = useState([]);
  const scoped = selectedOrganizationId != null || selectedCollegeId != null;
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [collegesError, setCollegesError] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | hr object
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const mutationRef = useRef(false);
  const confirmRef = useRef(false);
  const listSeq = useRef(0);
  const detailSeq = useRef(0);
  const collegesSeq = useRef(0);
  const scopeKey = selectedCollegeId != null
    ? `college:${selectedCollegeId}`
    : selectedOrganizationId != null
      ? `organization:${selectedOrganizationId}`
      : "global";
  const scopeKeyRef = useRef(scopeKey);
  scopeKeyRef.current = scopeKey;
  const [actionBusy, setActionBusy] = useState(null);
  const [grantCollegeId, setGrantCollegeId] = useState(null);
  const [grantUntil, setGrantUntil] = useState(null);
  const [form] = Form.useForm();

  useUnsavedFormGuard(form, { enabled: editing != null && !saving });

  const collegeOptions = useMemo(
    () => colleges
      .filter((c) => selectedCollegeId == null || (c.id ?? c.collegeId) === selectedCollegeId)
      .map((c) => ({ value: c.id ?? c.collegeId, label: c.name ?? c.collegeName ?? `College ${c.id}` })),
    [colleges, selectedCollegeId]
  );

  const loadColleges = useCallback(async () => {
    const requestId = ++collegesSeq.current;
    const requestedScope = scopeKey;
    setCollegesError(null);
    try {
      const c = await fetchWithErrorHandling(getColleges());
      if (requestId !== collegesSeq.current || requestedScope !== scopeKeyRef.current) return;
      const list = Array.isArray(c?.data) ? c.data : (Array.isArray(c?.data?.data) ? c.data.data : null);
      if (!c.success || !Array.isArray(list)) {
        setColleges([]);
        setCollegesError(errorText(c, "Could not load colleges"));
      } else {
        setColleges(list);
        setCollegesError(null);
      }
    } catch (error) {
      if (requestId !== collegesSeq.current || requestedScope !== scopeKeyRef.current) return;
      setColleges([]);
      setCollegesError(error?.message || "Could not load colleges");
    }
  }, [scopeKey]);

  const refresh = useCallback(async (nextPage = page, nextQuery = query) => {
    const requestId = ++listSeq.current;
    const requestedScope = scopeKey;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchWithErrorHandling(listRecruiterAccounts({ q: nextQuery || undefined, page: nextPage, size: 25 }));
      if (requestId !== listSeq.current || requestedScope !== scopeKeyRef.current) return;
      const nextItems = res?.data?.items;
      if (!res.success || !Array.isArray(nextItems)) {
        setItems([]);
        setTotal(0);
        setLoadError(errorText(res, "Could not load recruiter accounts"));
        return;
      }
      setItems(nextItems);
      setTotal(Number(res?.data?.total ?? nextItems.length));
    } catch (error) {
      if (requestId !== listSeq.current || requestedScope !== scopeKeyRef.current) return;
      setItems([]);
      setTotal(0);
      setLoadError(error?.message || "Could not load recruiter accounts");
    } finally {
      if (requestId === listSeq.current && requestedScope === scopeKeyRef.current) setLoading(false);
    }
  }, [page, query, scopeKey]);

  useEffect(() => {
    // Scope changes must invalidate both the list and an open recruiter drawer immediately.
    // Otherwise a slow response from the previous college can repopulate the new scoped view.
    if (editing != null && form.isFieldsTouched()) {
      message.warning("Unsaved recruiter changes were discarded because the college scope changed.");
    }
    ++listSeq.current;
    ++detailSeq.current;
    ++collegesSeq.current;
    setItems([]);
    setTotal(0);
    setPage(0);
    setQuery("");
    setDetail(null);
    setDetailLoading(false);
    setEditing(null);
    setGrantCollegeId(null);
    setGrantUntil(null);
    form.resetFields();
    refresh(0, "");
    loadColleges();
    return () => { ++listSeq.current; ++detailSeq.current; ++collegesSeq.current; };
    // refresh intentionally isn't a dependency: page/query changes must not replay the scope reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationId, selectedCollegeId]);

  const openDetail = async (id) => {
    if (mutationRef.current) return;
    const requestId = ++detailSeq.current;
    const requestedScope = scopeKey;
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetchWithErrorHandling(getRecruiterAccount(id));
      if (requestId !== detailSeq.current || requestedScope !== scopeKeyRef.current) return;
      if (!res.success) {
        message.error(errorText(res, "Could not load the recruiter"));
        return;
      }
      const next = res?.data;
      if (!next || typeof next !== "object") {
        message.error("Could not load the recruiter");
        return;
      }
      setDetail(next);
    } catch (error) {
      if (requestId === detailSeq.current && requestedScope === scopeKeyRef.current) {
        message.error(error?.message || "Could not load the recruiter");
      }
    } finally {
      if (requestId === detailSeq.current && requestedScope === scopeKeyRef.current) setDetailLoading(false);
    }
  };

  const openCreate = () => {
    form.resetFields();
    if (selectedCollegeId != null) form.setFieldsValue({ collegeIds: [selectedCollegeId] });
    setEditing("new");
  };

  const openEdit = (recruiter) => {
    form.setFieldsValue({
      firstName: recruiter.firstName,
      lastName: recruiter.lastName,
      contactMobile: recruiter.contactMobile,
      contactMail: recruiter.contactMail,
      designation: recruiter.designation,
      companyName: recruiter.companyName,
    });
    setEditing(recruiter);
  };

  const onSave = async () => {
    if (mutationRef.current) return;
    const requestedScope = scopeKey;
    const values = await form.validateFields();
    if (requestedScope !== scopeKeyRef.current) return;
    mutationRef.current = true;
    setActionBusy("save");
    setSaving(true);
    const isNew = editing === "new";
    const res = await fetchWithErrorHandling(isNew ? createRecruiterAccount(values) : updateRecruiterAccount(editing.id, values));
    mutationRef.current = false;
    setActionBusy(null);
    setSaving(false);
    if (requestedScope !== scopeKeyRef.current) return;
    if (!res.success) {
      const data = res?.data;
      if (data?.error === "RECRUITER_ALREADY_EXISTS" && data?.recruiterId) {
        message.warning("A recruiter with this mobile already exists. Opening it so you can add colleges.");
        setEditing(null);
        openDetail(data.recruiterId);
        return;
      }
      message.error(errorText(res, "Save failed"));
      return;
    }
    message.success(isNew ? "Recruiter account created" : "Recruiter account updated");
    setEditing(null);
    refresh();
    const saved = res?.data?.recruiter ?? res?.data?.hr ?? null;
    if (saved?.id && detail?.id === saved.id) setDetail(saved);
  };

  const confirmAction = ({ title, content, okText, danger, run, done }) => {
    if (mutationRef.current || confirmRef.current) return;
    const requestedScope = scopeKey;
    confirmRef.current = true;
    Modal.confirm({
      title,
      content,
      okText,
      okButtonProps: danger ? { danger: true } : undefined,
      // BE-0094: a failed action throws, so the confirmation stays open for a retry (afterClose clears the guard).
      onOk: async () => {
        if (requestedScope !== scopeKeyRef.current) {
          message.warning("Scope changed. Reopen the recruiter before making this change.");
          return;
        }
        if (mutationRef.current) return;
        mutationRef.current = true;
        setActionBusy(title);
        const res = await fetchWithErrorHandling(run());
        if (requestedScope !== scopeKeyRef.current) {
          mutationRef.current = false;
          setActionBusy(null);
          return;
        }
        if (!res.success) {
          message.error(errorText(res, "Action failed"));
          mutationRef.current = false;
          setActionBusy(null);
          throw new Error("action failed");
        }
        message.success(done);
        mutationRef.current = false;
        setActionBusy(null);
        refresh();
        if (detail) openDetail(detail.id);
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const onGrant = async () => {
    if (!detail || !grantCollegeId || collegesError || mutationRef.current) return;
    const requestedScope = scopeKey;
    if (requestedScope !== scopeKeyRef.current) return;
    mutationRef.current = true;
    setActionBusy("grant");
    const res = await fetchWithErrorHandling(grantRecruiterCollege(detail.id, {
      collegeId: grantCollegeId,
      validUntil: grantUntil ? grantUntil.endOf("day").format("YYYY-MM-DDTHH:mm:ss") : null,
      capabilities: [],
    }));
    if (requestedScope !== scopeKeyRef.current) {
      mutationRef.current = false;
      setActionBusy(null);
      return;
    }
    if (!res.success) {
      message.error(errorText(res, "Could not give access"));
      mutationRef.current = false;
      setActionBusy(null);
      return;
    }
    message.success("College access given");
    setGrantCollegeId(null);
    setGrantUntil(null);
    setDetail(res?.data?.recruiter ?? res?.data?.hr ?? detail);
    mutationRef.current = false;
    setActionBusy(null);
    refresh();
  };

  const isGrantManageableHere = (grant) => {
    if (selectedCollegeId != null) return Number(grant?.collegeId) === Number(selectedCollegeId);
    if (selectedOrganizationId != null) return Number(grant?.organizationId) === Number(selectedOrganizationId);
    return true;
  };
  const isAccountManageableHere = (recruiter) => {
    // Newer backends calculate this before redacting out-of-scope grant history. Prefer that
    // authoritative answer; the local fallback keeps mixed-version deployments usable.
    if (typeof recruiter?.accountManageable === "boolean") return recruiter.accountManageable;
    const grants = Array.isArray(recruiter?.colleges) ? recruiter.colleges : [];
    return grants.every(isGrantManageableHere);
  };
  const scopeBlockedReason = selectedCollegeId != null
    ? "This recruiter also has college-access history outside the selected college. Switch to the global Super Admin view for account-wide changes."
    : selectedOrganizationId != null
      ? "This recruiter also has college-access history outside the selected organization. Switch to the global Super Admin view for account-wide changes."
      : null;

  const columns = [
    { title: "Name", key: "name", render: (_, r) => <Button type="link" onClick={() => openDetail(r.id)}>{fullName(r)}</Button> },
    { title: "Mobile", dataIndex: "contactMobile", key: "contactMobile" },
    { title: "Company", dataIndex: "companyName", key: "companyName", render: (v) => v || "—" },
    { title: "Colleges", dataIndex: "activeCollegeCount", key: "activeCollegeCount", width: 100 },
    { title: "Status", dataIndex: "status", key: "status", width: 120, render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{v ? v.charAt(0) + v.slice(1).toLowerCase() : "—"}</Tag> },
    {
      title: "Actions",
      key: "actions",
      width: 260,
      render: (_, r) => {
        const accountBlocked = !isAccountManageableHere(r);
        return (
        <Space size={8} wrap>
          <Tooltip title={accountBlocked ? scopeBlockedReason : undefined}>
            <span><Button size="small" onClick={() => openEdit(r)} disabled={accountBlocked || r.status === "DELETED" || actionBusy != null}>Edit</Button></span>
          </Tooltip>
          {r.status === "SUSPENDED" ? (
            <Tooltip title={accountBlocked ? scopeBlockedReason : undefined}>
            <span><Button size="small" disabled={accountBlocked || actionBusy != null} onClick={() => confirmAction({
              title: `Reactivate ${fullName(r)}?`, okText: "Reactivate",
              run: () => reactivateRecruiterAccount(r.id), done: "Recruiter reactivated",
            })}>Reactivate</Button></span>
            </Tooltip>
          ) : r.status === "ACTIVE" ? (
            <Tooltip title={accountBlocked ? scopeBlockedReason : undefined}>
            <span><Button size="small" danger disabled={accountBlocked || actionBusy != null} onClick={() => confirmAction({
              title: `Suspend ${fullName(r)}?`, danger: true, okText: "Suspend",
              content: "They are signed out everywhere and cannot sign in until reactivated. College access is kept.",
              run: () => suspendRecruiterAccount(r.id), done: "Recruiter suspended",
            })}>Suspend</Button></span>
            </Tooltip>
          ) : (
            <Typography.Text type="secondary">Deleted</Typography.Text>
          )}
          <Tooltip title={accountBlocked ? scopeBlockedReason : r.status === "ACTIVE" ? "End every session on every device" : "Only active recruiters can have live sessions"}>
            <span><Button size="small" disabled={accountBlocked || r.status !== "ACTIVE" || actionBusy != null} onClick={() => confirmAction({
              title: `Sign ${fullName(r)} out everywhere?`, okText: "Sign out everywhere",
              run: () => revokeRecruiterSessions(r.id), done: "All sessions ended",
            })}>Sign out</Button></span>
          </Tooltip>
        </Space>
        );
      },
    },
  ];

  const grantColumns = [
    { title: "College", key: "college", render: (_, g) => `${g.collegeName || `College ${g.collegeId}`}${g.collegeCode ? ` (${g.collegeCode})` : ""}` },
    {
      title: "Access",
      key: "access",
      render: (_, g) => (
        <Space size={4}>
          <Tag color={g.active ? "green" : "default"}>{g.active ? "Active" : g.status === "REVOKED" ? "Revoked" : "Expired"}</Tag>
          {g.validUntil && <Tag color="orange">Until {String(g.validUntil).slice(0, 10)}</Tag>}
        </Space>
      ),
    },
    {
      title: "",
      key: "revoke",
      width: 110,
      render: (_, g) => {
        if (!g.active) return null;
        const blocked = !isGrantManageableHere(g);
        return (
          <Tooltip title={blocked ? "This college is outside the current Super Admin scope. Change scope before removing this grant." : undefined}>
            <span>
              <Button size="small" danger disabled={blocked || actionBusy != null} onClick={() => confirmAction({
                title: `Remove ${g.collegeName || "this college"} from ${fullName(detail)}?`, danger: true, okText: "Remove access",
                content: "Takes effect on their next request. The history is kept.",
                run: () => revokeRecruiterCollege(detail.id, g.collegeId), done: "College access removed",
              })}>Remove</Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  const activeOnPage = items.filter((item) => item.status === "ACTIVE").length;
  const suspendedOnPage = items.filter((item) => item.status === "SUSPENDED").length;
  const deletedOnPage = items.filter((item) => item.status === "DELETED").length;

  return (
    <div>
      <AdminControlOverview
        eyebrow="Industry access"
        title="Recruiter account lifecycle"
        description="One recruiter identity can work with multiple colleges. Manage the person here, then grant or revoke college access separately so account status and tenant access remain understandable."
        scopeLabel={selectedCollegeId != null ? `College #${selectedCollegeId}` : selectedOrganizationId != null ? `Organization #${selectedOrganizationId}` : "Global recruiter directory"}
        scopeColor={selectedCollegeId != null ? "blue" : selectedOrganizationId != null ? "gold" : "green"}
        metrics={[
          { label: "Accounts", value: total, hint: selectedCollegeId != null ? "Visible in this college scope" : selectedOrganizationId != null ? "Visible in this organization scope" : "Current directory result" },
          { label: "Active on page", value: activeOnPage },
          { label: "Suspended on page", value: suspendedOnPage },
          { label: "Deleted on page", value: deletedOnPage },
        ]}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={actionBusy != null || Boolean(collegesError)}>Add recruiter</Button>}
      />
      {scoped && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={selectedCollegeId != null
            ? "Showing recruiters linked to the selected college"
            : "Showing recruiters linked to the selected organization"}
          description="College grant/revoke actions inside this scope remain available. Account-wide edit, suspend, delete and sign-out actions are disabled when a recruiter also has access history outside the current scope."
        />
      )}
      {loadError ? <Alert type="error" showIcon message="Recruiter accounts could not be loaded" description={loadError}
        action={<Button size="small" onClick={() => refresh()}>Retry</Button>} style={{ marginBottom: 12 }} /> : null}
      {collegesError ? <Alert type="warning" showIcon message="College access options unavailable" description={collegesError}
        action={<Button size="small" onClick={loadColleges}>Retry</Button>} style={{ marginBottom: 12 }} /> : null}
      <Card
        title="Recruiter accounts"
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Name, mobile or email"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (!value) {
                  setPage(0);
                  refresh(0, "");
                }
              }}
              onSearch={(v) => { setQuery(v); setPage(0); refresh(0, v); }}
              style={{ width: 240 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>Refresh</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          scroll={{ x: 960 }}
          pagination={{
            current: page + 1,
            pageSize: 25,
            total,
            showSizeChanger: false,
            onChange: (p) => { setPage(p - 1); refresh(p - 1); },
          }}
        />
      </Card>

      <Modal
        title={editing === "new" ? "Add recruiter" : `Edit ${fullName(editing)}`}
        open={editing != null}
        onCancel={() => {
          if (mutationRef.current) return;
          if (!form.isFieldsTouched()) { setEditing(null); form.resetFields(); return; }
          Modal.confirm({
            title: "Discard recruiter changes?",
            content: "Your unsaved recruiter details will be lost.",
            okText: "Discard",
            okButtonProps: { danger: true },
            cancelText: "Keep editing",
            onOk: () => { setEditing(null); form.resetFields(); },
          });
        }}
        onOk={onSave}
        okText={editing === "new" ? "Create" : "Save"}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item name="firstName" label="First name" rules={[{ required: true, whitespace: true, message: "First name is required" }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="lastName" label="Last name">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="contactMobile" label="Mobile (login)" rules={[{ required: editing === "new", message: "Mobile is required" }]}
            extra={editing !== "new" ? "Changing the mobile signs the recruiter out everywhere." : undefined}>
            <Input inputMode="tel" autoComplete="tel" maxLength={15} />
          </Form.Item>
          <Form.Item name="contactMail" label="Email" rules={[{ type: "email", message: "Enter a valid email" }]}>
            <Input inputMode="email" autoComplete="email" maxLength={255} />
          </Form.Item>
          <Form.Item name="companyName" label="Company">
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="designation" label="Designation">
            <Input maxLength={150} />
          </Form.Item>
          {editing === "new" && (
            <Form.Item name="collegeIds" label="Colleges"
              rules={scoped ? [{ required: true, message: "Pick at least one college in the current scope" }] : []}
              extra="You can add or remove colleges later.">
              <Select mode="multiple" showSearch optionFilterProp="label" options={collegeOptions} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        title={detail ? fullName(detail) : "Recruiter"}
        open={detail != null || detailLoading}
        onClose={() => { ++detailSeq.current; setDetailLoading(false); setDetail(null); }}
        width={640}
        destroyOnClose
        extra={detail && detail.status !== "DELETED" ? (
          <Tooltip title={!isAccountManageableHere(detail) ? scopeBlockedReason : undefined}>
          <span><Button danger disabled={!isAccountManageableHere(detail) || actionBusy != null} onClick={() => confirmAction({
            title: `Delete ${fullName(detail)}?`, danger: true, okText: "Delete",
            content: "They can no longer sign in. Re-adding the same mobile later restores this account.",
            run: () => deleteRecruiterAccount(detail.id), done: "Recruiter deleted",
          })}>Delete</Button></span>
          </Tooltip>
        ) : null}
      >
        {detailLoading && !detail ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: 180 }}>
            <Spin />
          </div>
        ) : null}
        {detail && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div>
              <Tag color={STATUS_COLOR[detail.status] || "default"}>Account: {String(detail.status || "").charAt(0) + String(detail.status || "").slice(1).toLowerCase()}</Tag>
              <Typography.Text type="secondary">
                {detail.contactMobile}{detail.companyName ? ` · ${detail.companyName}` : ""}{detail.designation ? ` · ${detail.designation}` : ""}
              </Typography.Text>
            </div>
            <Card size="small" title="College access">
              <Table rowKey="collegeId" size="small" pagination={false} dataSource={detail.colleges || []} columns={grantColumns}
                locale={{ emptyText: "No colleges yet." }} />
              <Space style={{ marginTop: 12 }} wrap>
                <Select
                  placeholder={detail.status === "DELETED" ? "Deleted account" : "Add a college"}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: 240 }}
                  value={grantCollegeId}
                  onChange={setGrantCollegeId}
                  disabled={detail.status === "DELETED"}
                  options={collegeOptions.filter((o) => !(detail.colleges || []).some((g) => g.active && g.collegeId === o.value))}
                />
                <DatePicker placeholder="Until (optional)" value={grantUntil} onChange={setGrantUntil} disabled={detail.status === "DELETED"} disabledDate={(current) => current && current.endOf("day").isBefore(dayjs())} />
                <Button type="primary" loading={actionBusy === "grant"} disabled={detail.status === "DELETED" || !grantCollegeId || Boolean(collegesError) || actionBusy != null} onClick={onGrant}>Give access</Button>
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
}
