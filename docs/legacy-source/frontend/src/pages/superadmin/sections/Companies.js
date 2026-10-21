import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, Table, Button, Space, Modal, message, Typography, Form, Input, Popconfirm, Statistic, Row, Col, Empty, Checkbox, Tag, Divider, Spin, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, GlobalOutlined, UndoOutlined, LockOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv, columnsFromRows } from "@/utils/csvExport";
import moment from "moment";
import {
  getAdminCompanies,
  createAdminCompany,
  updateAdminCompany,
  deleteAdminCompany,
  restoreAdminCompany,
  getAdminCompanyJobs,
  getAdminCompanyStats,
} from "@/api/Services/AdminService";
import PlacementsCompanyAvatar from "@/components/Placements/PlacementsCompanyAvatar";
import { DashboardSkeleton, RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";
import PlacementsPageOverview from "@/components/admin/placements/PlacementsPageOverview";

const { Text } = Typography;
const { TextArea } = Input;

/**
 * Admin Companies page — create a recruiting company once (name, logo, contact details) and
 * reuse it across job postings instead of retyping the same information for every drive.
 * @param {number|null} collegeId
 */
export default function Companies({ collegeId = null }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedScopeKeyRef = useRef(loadedScopeKey);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form] = Form.useForm();
  const [deleteLoading, setDeleteLoading] = useState({});

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailCompany, setDetailCompany] = useState(null);
  const [detailJobs, setDetailJobs] = useState([]);
  const [detailStats, setDetailStats] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const detailCompanyIdRef = useRef(null);
  const companyScopeKey = collegeId ? JSON.stringify([Number(collegeId), Boolean(showDeleted)]) : null;
  const hasCurrentCompanies = companyScopeKey != null && loadedScopeKey === companyScopeKey;
  const currentFetchError = errorScopeKey === companyScopeKey ? fetchError : null;
  const initialCompaniesLoading = Boolean(companyScopeKey && loading && !hasCurrentCompanies && !currentFetchError);
  const companiesRefreshing = Boolean(companyScopeKey && loading && hasCurrentCompanies);

  const fetchCompanies = useCallback(async () => {
    if (!collegeId || !companyScopeKey) return;
    const requestScopeKey = companyScopeKey;
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) setCompanies([]);
    setLoading(true);
    setFetchError(null);
    setErrorScopeKey(null);
    try {
      const res = await getAdminCompanies(collegeId, showDeleted);
      if (res?.data?.status === "success") {
        setCompanies(Array.isArray(res.data.data) ? res.data.data : []);
        setLoadedScopeKey(requestScopeKey);
      } else {
        setFetchError(res?.data?.message || "Failed to load companies");
        setErrorScopeKey(requestScopeKey);
      }
    } catch (err) {
      setFetchError(err?.response?.data?.message || "Failed to load companies");
      setErrorScopeKey(requestScopeKey);
    } finally {
      setLoading(false);
    }
  }, [collegeId, showDeleted, companyScopeKey]);

  const filteredCompanies = companies.filter((c) => {
    if (!searchText.trim()) return true;
    const q = searchText.trim().toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.industry || "").toLowerCase().includes(q);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, showDeleted]);

  // Clamp currentPage down if a delete/restore (or search/filter change) shrinks the
  // result set below the current page — otherwise the table can render an empty page.
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [filteredCompanies.length, pageSize, currentPage]);

  const handleRestore = async (company) => {
    setRestoreLoading((prev) => ({ ...prev, [company.id]: true }));
    try {
      const res = await restoreAdminCompany(company.id, collegeId);
      if (res?.data?.status === "success") {
        message.success("Company restored");
        fetchCompanies();
      } else {
        message.error(res?.data?.message || "Failed to restore company");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to restore company");
    } finally {
      setRestoreLoading((prev) => ({ ...prev, [company.id]: false }));
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreate = () => {
    setEditingCompany(null);
    setFormError("");
    form.resetFields();
    setFormVisible(true);
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({
      name: company.name,
      logoUrl: company.logoUrl,
      website: company.website,
      industry: company.industry,
      description: company.description,
      contactPersonName: company.contactPersonName,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      internalNotes: company.internalNotes,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormError("");
      setSaving(true);
      const res = editingCompany
        ? await updateAdminCompany(editingCompany.id, values, collegeId)
        : await createAdminCompany(values, collegeId);
      if (res?.data?.status === "success") {
        message.success(editingCompany ? "Company updated" : "Company created");
        setFormVisible(false);
        setFormError("");
        form.resetFields();
        fetchCompanies();
      } else {
        const pseudoError = { response: { data: res?.data || { message: "Failed to save company" } } };
        const fieldError = applyServerFieldErrors(form, pseudoError, {
          logo_url: "logoUrl",
          contact_person_name: "contactPersonName",
          contact_email: "contactEmail",
          contact_phone: "contactPhone",
          internal_notes: "internalNotes",
        });
        const errorMessage = getServerFormError(pseudoError, "Failed to save company.");
        setFormError(errorMessage);
        if (!fieldError) message.error(errorMessage);
      }
    } catch (err) {
      if (err?.errorFields) return; // antd validation error, already shown inline
      const fieldError = applyServerFieldErrors(form, err, {
        logo_url: "logoUrl",
        contact_person_name: "contactPersonName",
        contact_email: "contactEmail",
        contact_phone: "contactPhone",
        internal_notes: "internalNotes",
      });
      const errorMessage = getServerFormError(err, "Failed to save company.");
      setFormError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    setDeleteLoading((prev) => ({ ...prev, [company.id]: true }));
    try {
      const res = await deleteAdminCompany(company.id, collegeId);
      if (res?.data?.status === "success") {
        message.success("Company deleted");
        fetchCompanies();
      } else {
        message.error(res?.data?.message || "Failed to delete company");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete company");
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [company.id]: false }));
    }
  };

  const openDetail = async (company) => {
    detailCompanyIdRef.current = company.id;
    setDetailCompany(company);
    setDetailVisible(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailJobs([]);
    setDetailStats(null);
    try {
      const [jobsRes, statsRes] = await Promise.all([
        getAdminCompanyJobs(company.id, collegeId),
        getAdminCompanyStats(company.id, collegeId),
      ]);
      if (company.id !== detailCompanyIdRef.current) return;
      if (jobsRes?.data?.status !== "success" || statsRes?.data?.status !== "success") {
        throw new Error(jobsRes?.data?.message || statsRes?.data?.message || "Failed to load company history");
      }
      setDetailJobs(Array.isArray(jobsRes.data.data) ? jobsRes.data.data : []);
      setDetailStats(statsRes.data.data || null);
    } catch (err) {
      if (company.id !== detailCompanyIdRef.current) return;
      setDetailError(err?.response?.data?.message || err?.message || "Failed to load company history");
    } finally {
      if (company.id === detailCompanyIdRef.current) setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: "Company",
      key: "name",
      render: (_, record) => (
        <Space>
          <PlacementsCompanyAvatar companyName={record.name} companyLogo={record.logoUrl} size={32} />
          <div>
            <div style={{ fontWeight: 600 }}>
              {record.name}
              {record.verifiedBy42 && <Tag color="blue" style={{ marginLeft: 8 }}>Verified by 42</Tag>}
              {record.isDeleted && <Tag color="default" style={{ marginLeft: 8 }}>Deleted</Tag>}
            </div>
            {record.industry && <Text type="secondary" style={{ fontSize: 12 }}>{record.industry}</Text>}
            {record.domains?.length > 0 && <div><Text type="secondary" style={{ fontSize: 12 }}>{record.domains.join(", ")}</Text></div>}
          </div>
        </Space>
      ),
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <div>
          {record.contactPersonName && <div>{record.contactPersonName}</div>}
          {record.contactEmail && <Text type="secondary" style={{ fontSize: 12 }}>{record.contactEmail}</Text>}
        </div>
      ),
    },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (website) => (website && /^https?:\/\//i.test(String(website))) ? (
        <a href={website} target="_blank" rel="noopener noreferrer"><GlobalOutlined /> Visit</a>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: "Drives",
      dataIndex: "driveCount",
      key: "driveCount",
      width: 90,
      sorter: (a, b) => (a.driveCount ?? 0) - (b.driveCount ?? 0),
      render: (count) => count ?? 0,
    },
    {
      title: "Last active",
      dataIndex: "lastActiveAt",
      key: "lastActiveAt",
      width: 130,
      sorter: (a, b) => new Date(a.lastActiveAt || 0) - new Date(b.lastActiveAt || 0),
      defaultSortOrder: "descend",
      render: (date) => date ? moment.utc(date).local().format("DD MMM YYYY") : <Text type="secondary">Never posted</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.isDeleted ? (
          <Popconfirm
            title="Restore this company?"
            description="It will reappear across job postings."
            onConfirm={() => handleRestore(record)}
            okText="Restore"
            cancelText="Cancel"
          >
            <Button size="small" icon={<UndoOutlined />} loading={restoreLoading[record.id]}>
              Restore
            </Button>
          </Popconfirm>
        ) : (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>History</Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Edit</Button>
            {(record.driveCount ?? 0) > 0 ? (
              <Tooltip title="Can't delete — this company has drives linked to it">
                <Button size="small" danger icon={<DeleteOutlined />} disabled>Delete</Button>
              </Tooltip>
            ) : (
              <Popconfirm
                title="Delete this company?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record)}
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button size="small" danger icon={<DeleteOutlined />} loading={deleteLoading[record.id]}>Delete</Button>
              </Popconfirm>
            )}
          </Space>
        ),
    },
  ];

  if (!collegeId) {
    return (
      <Alert
        type="warning"
        message="Admin not assigned to a college"
        description="You must be assigned to a college to manage companies."
        showIcon
      />
    );
  }

  return (
    <div>
      <PlacementsPageOverview
        title="Companies"
        description="Maintain each recruiting company once and reuse it across drives. Deleted records stay recoverable without cluttering the default working list."
        metrics={[
          { label: "Companies", value: companies.filter((item) => !item.isDeleted).length },
          { label: "Deleted", value: companies.filter((item) => item.isDeleted).length },
          { label: "Visible now", value: filteredCompanies.length, hint: searchText.trim() || showDeleted ? "After search and filters" : "Current working list" },
          { label: "With drives", value: companies.filter((item) => Number(item.driveCount ?? 0) > 0 && !item.isDeleted).length },
        ]}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add company</Button>}
      />
      {companiesRefreshing ? <RefreshStatus label="Refreshing companies…" /> : null}
      {currentFetchError ? (
        <Alert
          type={hasCurrentCompanies ? "warning" : "error"}
          message={hasCurrentCompanies ? "Couldn't refresh companies" : currentFetchError}
          description={hasCurrentCompanies ? "Showing the last companies loaded for this view." : undefined}
          showIcon
          action={<Button size="small" onClick={fetchCompanies}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Input.Search
          placeholder="Search by name or industry"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
        />
        <Space>
          <Checkbox checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)}>
            Show deleted
          </Checkbox>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            disabled={!filteredCompanies.length}
            onClick={() => {
              // exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns list —
              // this used to call it with only (filename, rows), silently passing the row array
              // in as `columns` and leaving `rows` undefined.
              const rows = filteredCompanies.map((c) => ({
                id: c.id,
                name: c.name ?? "",
                industry: c.industry ?? "",
                website: c.website ?? "",
                contactPersonName: c.contactPersonName ?? "",
                contactEmail: c.contactEmail ?? "",
                contactPhone: c.contactPhone ?? "",
                driveCount: c.driveCount ?? "",
                isDeleted: c.isDeleted ? "yes" : "no",
              }));
              exportRowsToCsv("companies.csv", columnsFromRows(rows), rows);
            }}
          >
            Export CSV
          </Button>
        </Space>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Showing {filteredCompanies.length} of {companies.length} compan{companies.length === 1 ? "y" : "ies"}
          {showDeleted ? " (including deleted)" : ""}
          {searchText.trim() ? " — searching name & industry only" : ""}
        </Text>
      </div>
      {initialCompaniesLoading ? (
        <TableSkeleton rows={8} columns={6} label="Loading companies" />
      ) : currentFetchError && !hasCurrentCompanies ? null : (
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredCompanies}
        scroll={{ x: 'max-content' }}
        rowClassName={(record) => (record.isDeleted ? "companies-row-deleted" : "")}
        onRow={(record) => (record.isDeleted ? { style: { opacity: 0.55 } } : {})}
        pagination={{
          current: currentPage,
          pageSize,
          showSizeChanger: true,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
        }}
        locale={{
          emptyText: (
            <Empty
              description={
                companies.length > 0
                  ? "No companies match your search or filter."
                  : "No companies yet — add one to start reusing it across job postings."
              }
            />
          ),
        }}
      />
      )}

      <Modal
        title={editingCompany ? "Edit Company" : "Add Company"}
        open={formVisible}
        onCancel={() => {
          if (saving) return;
          if (form.isFieldsTouched()) {
            Modal.confirm({
              title: "Discard unsaved changes?",
              content: "You have unsaved changes in this form. Closing now will discard them.",
              okText: "Discard",
              okType: "danger",
              cancelText: "Keep editing",
              onOk: () => setFormVisible(false),
            });
          } else {
            setFormVisible(false);
          }
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editingCompany ? "Save" : "Create"}
        okButtonProps={{ disabled: saving }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={false}
        keyboard={!saving}
        destroyOnClose
        width={560}
      >
        {formError ? <Alert type="error" showIcon message="Company was not saved" description={formError}
          closable onClose={() => setFormError("")} style={{ marginBottom: 12 }} /> : null}
        <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={saving}>
          <Divider orientation="left" style={{ marginTop: 0 }}>Identity</Divider>
          <Form.Item name="name" label="Company name" rules={[{ required: true, whitespace: true, message: "Company name is required" }, { min: 2, max: 150, message: "Company name must be between 2 and 150 characters" }]}>
            <Input placeholder="e.g. Infosys Limited" maxLength={150} />
          </Form.Item>
          <Form.Item name="logoUrl" label="Logo URL" rules={[{ type: "url", message: "Must be a valid URL" }, { pattern: /^https:\/\//i, message: "Logo URL must start with https://" }]}>
            <Input placeholder="https://..." maxLength={500} />
          </Form.Item>
          <Form.Item name="website" label="Website" extra="A company is kept once across colleges by its website or company email domain: add at least one of them."
            rules={[{ type: "url", message: "Must be a valid URL" }, { pattern: /^https:\/\//i, message: "Website must start with https://" }]}>
            <Input placeholder="https://..." maxLength={500} />
          </Form.Item>
          <Form.Item name="industry" label="Industry">
            <Input placeholder="e.g. IT Services" maxLength={100} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>

          <Divider orientation="left">Contact</Divider>
          <Form.Item name="contactPersonName" label="Contact person">
            <Input placeholder="Recruiter contact name" maxLength={150} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact email" rules={[{ type: "email", message: "Must be a valid email" }]}>
            <Input placeholder="recruiter@company.com" maxLength={150} />
          </Form.Item>
          <Form.Item name="contactPhone" label="Contact phone" rules={[{ pattern: /^[+()\d][\d\s().-]{6,29}$/, message: "Enter a valid phone number" }]}>
            <Input maxLength={30} />
          </Form.Item>

          <Divider orientation="left">Internal only</Divider>
          <div style={{ padding: 12, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8 }}>
            <Form.Item
              name="internalNotes"
              label={<span><LockOutlined style={{ marginRight: 6 }} />Internal notes</span>}
              tooltip="Visible only to your placement team, not to students."
              style={{ marginBottom: 0 }}
            >
              <TextArea rows={2} maxLength={2000} showCount />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={detailCompany ? `${detailCompany.name} — Drive history` : "Company history"}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>Close</Button>}
        width={720}
        destroyOnClose
      >
        {detailLoading ? (
          <DashboardSkeleton metrics={3} label="Loading company history" />
        ) : detailError ? (
          <Alert
            type="error"
            showIcon
            message="Company history could not be loaded"
            description={detailError}
            action={<Button size="small" onClick={() => detailCompany && openDetail(detailCompany)}>Retry</Button>}
          />
        ) : (
          <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}><Statistic title="Drives run" value={detailStats?.totalDrives ?? 0} /></Col>
            <Col span={8}><Statistic title="Total applications" value={detailStats?.totalApplications ?? 0} /></Col>
            <Col span={8}><Statistic title="Total hired" value={detailStats?.totalHired ?? 0} /></Col>
          </Row>
          <div style={{ minHeight: 160 }}>
            <Table
              rowKey="id"
              size="small"
              dataSource={detailJobs}
              pagination={detailJobs.length > 10 ? { pageSize: 10 } : false}
              locale={{ emptyText: "No job postings linked to this company yet." }}
              onRow={(record) => {
                const openJob = () => window.open(`/college-admin/jobs/${record.id}`, "_blank");
                return {
                  onClick: openJob,
                  onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openJob();
                    }
                  },
                  tabIndex: 0,
                  role: "button",
                  "aria-label": `Open job posting ${record.jobTitle || ""} in a new tab`,
                  style: { cursor: "pointer" },
                };
              }}
              columns={[
                { title: "Job title", dataIndex: "jobTitle", key: "jobTitle" },
                { title: "Applicants", key: "applicantCount", render: (_, r) => r.applicationCount ?? r.applicantCount ?? 0 },
                { title: "Status", key: "status", render: (_, r) => r.isDraft ? "Draft" : (r.isActive ? "Active" : "Closed") },
              ]}
            />
          </div>
          </>
        )}
      </Modal>
    </div>
  );
}
