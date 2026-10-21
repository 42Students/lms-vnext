import { useState, useEffect, useRef } from "react";
import { Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, InputNumber, Tag, Space, Popconfirm, Modal, Switch } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { getProgramsByCollege, fetchWithErrorHandling } from "@/api/Services/AdminService";
import { createSemester, deleteSemester, getSemestersByProgram, updateSemester } from "@/api/Services/SemesterService";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Option } = Select;

function semesterSnapshot(values = {}) {
  return JSON.stringify({
    programId: values.programId ?? null,
    semesterNumber: Number(values.semesterNumber ?? 0),
    name: String(values.name ?? "").trim(),
    totalCredits: values.totalCredits ?? null,
    isActive: values.isActive !== false,
  });
}

const SemesterManagement = ({ collegeId = null }) => {
  const isScoped = collegeId != null && Number.isFinite(Number(collegeId)) && Number(collegeId) > 0;
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const filteredData = (Array.isArray(data) ? data : []).filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(r.name || "").toLowerCase().includes(q) ||
      String(r.semester_number ?? r.semesterNumber ?? "").includes(q) ||
      String(r.program_name ?? "").toLowerCase().includes(q)
    );
  });
  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsError, setProgramsError] = useState("");
  const [programsOwnerId, setProgramsOwnerId] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const semesterSeq = useRef(0);
  const programSeq = useRef(0);
  const semesterScopeKey = isScoped ? `${Number(collegeId)}:${selectedProgram ?? "all"}` : null;
  const hasCurrentSemesters = semesterScopeKey != null && loadedScopeKey === semesterScopeKey;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const originalEditRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const deleteRef = useRef(null);

  const fetchData = async (collegePrograms) => {
    const request = ++semesterSeq.current;
    const requestScopeKey = semesterScopeKey;
    if (!isScoped || !requestScopeKey) {
      setData([]);
      setLoadedScopeKey(null);
      setLoadError("");
      setTableLoading(false);
      return;
    }
    const sameScope = loadedScopeKey === requestScopeKey;
    setTableLoading(true);
    setLoadError("");
    if (!sameScope) setData([]);
    try {
      if (selectedProgram) {
        const result = await fetchWithErrorHandling(getSemestersByProgram(selectedProgram));
        if (request !== semesterSeq.current) return;
        if (!result.success) throw new Error(result.message || "Failed to load semesters");
        setData(Array.isArray(result.data) ? result.data : []);
        setLoadedScopeKey(requestScopeKey);
        return;
      }
      const sourcePrograms = Array.isArray(collegePrograms) ? collegePrograms : programs;
      if (!sourcePrograms.length) {
        if (request !== semesterSeq.current) return;
        setData([]);
        setLoadedScopeKey(requestScopeKey);
        return;
      }
      const results = await Promise.all(sourcePrograms.map((program) => fetchWithErrorHandling(getSemestersByProgram(program.id))));
      if (request !== semesterSeq.current) return;
      const failed = results.find((result) => !result.success);
      if (failed) throw new Error(failed.message || "Failed to load semesters");
      const merged = results.flatMap((result) => Array.isArray(result.data) ? result.data : []);
      setData(Array.from(new Map(merged.map((semester) => [semester.id, semester])).values()));
      setLoadedScopeKey(requestScopeKey);
    } catch (error) {
      if (request !== semesterSeq.current) return;
      if (!sameScope) setData([]);
      setLoadError(error?.message || "Failed to load semesters");
    } finally {
      if (request === semesterSeq.current) setTableLoading(false);
    }
  };

  const fetchPrograms = async () => {
    const request = ++programSeq.current;
    if (!isScoped) {
      setPrograms([]);
      setProgramsOwnerId(null);
      setProgramsLoading(false);
      setProgramsError("");
      return null;
    }
    const sameScope = Number(programsOwnerId) === Number(collegeId);
    setProgramsLoading(true);
    setProgramsError("");
    if (!sameScope) setPrograms([]);
    try {
      const result = await fetchWithErrorHandling(getProgramsByCollege(collegeId));
      if (request !== programSeq.current) return null;
      if (!result.success) throw new Error(result.message || "Failed to load programs");
      const list = Array.isArray(result.data) ? result.data : [];
      setPrograms(list);
      setProgramsOwnerId(collegeId);
      return list;
    } catch (error) {
      if (request !== programSeq.current) return null;
      if (!sameScope) setPrograms([]);
      setProgramsError(error?.message || "Failed to load programs");
      return null;
    } finally {
      if (request === programSeq.current) setProgramsLoading(false);
    }
  };

  useEffect(() => {
    ++semesterSeq.current;
    ++programSeq.current;
    setSelectedProgram(null);
    setData([]);
    setLoadedScopeKey(null);
    setLoadError("");
    setPrograms([]);
    setProgramsOwnerId(null);
    setProgramsError("");
    if (!isScoped) return undefined;
    fetchPrograms();
    return () => { ++semesterSeq.current; ++programSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  useEffect(() => {
    if (!isScoped || Number(programsOwnerId) !== Number(collegeId)) return;
    fetchData(programs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram, programsOwnerId]);

  const handleSubmit = async (values) => {
    if (!isScoped) {
      message.warning("Select a college first.");
      return;
    }
    setCreateError("");
    setLoading(true);
    try {
      const semesterNumber = Number(values.semesterNumber);
      if (!Number.isFinite(semesterNumber) || semesterNumber < 1) {
        message.error("Semester number must be 1 or more");
        setLoading(false);
        return;
      }
      const name = String(values.name ?? "").trim();
      if (!name) {
        message.error("Semester name is required");
        setLoading(false);
        return;
      }
      const payload = {
        program_id: values.programId,
        semester_number: semesterNumber,
        name,
        total_credits: values.totalCredits,
        is_active: true,
      };
      await createSemester(payload);
      message.success(`Created semester “${name}”. Next, map its courses and assign faculty.`);
      form.resetFields();
      setSelectedProgram(values.programId);
      const result = await fetchWithErrorHandling(getSemestersByProgram(values.programId));
      if (result.success) {
        setData(Array.isArray(result.data) ? result.data : []);
        setLoadedScopeKey(`${Number(collegeId)}:${values.programId}`);
        setLoadError("");
      } else {
        setLoadError(result.message || "Semester was created, but the refreshed list could not be loaded");
      }
    } catch (error) {
      const fieldError = applyServerFieldErrors(form, error, {
        program_id: "programId", semester_number: "semesterNumber", total_credits: "totalCredits", is_active: "isActive",
      });
      const errorMessage = getServerFormError(error, "Failed to create semester.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    if (!isScoped) {
      message.warning("Select a college first.");
      return;
    }
    setEditingRecord(record);
    setEditError("");
    const values = {
      programId: record.program_id,
      semesterNumber: record.semester_number,
      name: record.name,
      totalCredits: record.total_credits,
      isActive: record.is_active !== false,
    };
    editForm.resetFields();
    editForm.setFieldsValue(values);
    originalEditRef.current = semesterSnapshot(values);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!isScoped) {
      message.warning("Select a college first.");
      return;
    }
    try {
      const values = await editForm.validateFields();
      setEditError("");
      setEditLoading(true);
      const semesterNumber = Number(values.semesterNumber);
      if (!Number.isFinite(semesterNumber) || semesterNumber < 1) {
        message.error("Semester number must be 1 or more");
        setEditLoading(false);
        return;
      }
      const name = String(values.name ?? "").trim();
      if (!name) {
        message.error("Semester name is required");
        setEditLoading(false);
        return;
      }
      const payload = {
        program_id: values.programId,
        semester_number: semesterNumber,
        name,
        total_credits: values.totalCredits,
        is_active: values.isActive,
      };
      await updateSemester(editingRecord.id, payload);
      message.success("Semester updated successfully!");
      finishEditClose();
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      const fieldError = applyServerFieldErrors(editForm, error, {
        program_id: "programId", semester_number: "semesterNumber", total_credits: "totalCredits", is_active: "isActive",
      });
      const errorMessage = getServerFormError(error, "Failed to update semester.");
      setEditError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (record, rejectOnFailure = true) => {
    if (!isScoped || deleteRef.current != null) {
      if (!isScoped) message.warning("Select a college first.");
      return false;
    }
    deleteRef.current = record.id;
    setDeletingId(record.id);
    setDeleteError(null);
    try {
      await deleteSemester(record.id);
      message.success("Semester deleted successfully!");
      fetchData();
      return true;
    } catch (error) {
      const errorMessage = "Failed to delete semester: " + (error?.response?.data?.message || error?.message || "Unknown error");
      setDeleteError({ record, message: errorMessage });
      message.error(errorMessage);
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      deleteRef.current = null;
      setDeletingId(null);
    }
  };

  const finishEditClose = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    setEditError("");
    originalEditRef.current = null;
    editForm.resetFields();
  };

  const handleEditCancel = () => {
    if (editLoading) return;
    if (!editingRecord || semesterSnapshot(editForm.getFieldsValue(true)) === originalEditRef.current) {
      finishEditClose();
      return;
    }
    Modal.confirm({
      title: "Discard semester changes?",
      content: "Your unsaved semester edits will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      onOk: finishEditClose,
    });
  };

  const columns = [
    { 
      title: "Program", 
      dataIndex: "program_name", 
      key: "program_name",
      render: (name, record) => name || programs.find(p => p.id === record.program_id)?.name || "-"
    },
    { 
      title: "Semester #", 
      dataIndex: "semester_number", 
      key: "semester_number",
      width: 100,
      render: (num) => <Tag color="blue">Sem {num}</Tag>
    },
    { title: "Name", dataIndex: "name", key: "name" },
    // Sum of the mapped courses' credits, the same total students see. The old hand-typed
    // "Total Credits" was read by nothing and drifted (3 credits on a semester with 19 courses).
    { title: "Credits", key: "credits", width: 80,
      render: (_, r) => {
        const list = Array.isArray(r.courses) ? r.courses : [];
        const sum = list.reduce((t, c) => t + (Number(c.credits) || 0), 0);
        return list.length ? sum : "—";
      } },
    { 
      title: "Courses", 
      dataIndex: "courses", 
      key: "courses",
      width: 80,
      render: (courses) => courses?.length || 0
    },
    { 
      title: "Status", 
      dataIndex: "is_active", 
      key: "is_active",
      width: 80,
      render: (active) => (
        <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            title="Edit"
          />
          <Popconfirm
            title="Delete this semester?"
            description="This is blocked while any courses are mapped to this semester — remove the course mappings first."
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            cancelButtonProps={{ disabled: deletingId === record.id }}
            disabled={deletingId != null && deletingId !== record.id}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" title="Delete"
              loading={deletingId === record.id} disabled={deletingId != null && deletingId !== record.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {!isScoped && (
        <Alert
          type="warning"
          showIcon
          message="Select a College to manage Semesters"
          description="Semesters are always college-scoped in Superadmin. Use the header Organization/College selector."
          style={{ marginBottom: 16 }}
        />
      )}
      <h1 className="admin-list-page__title">Semesters</h1>
      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="Create New Semester" size="small">
            {createError ? <Alert type="error" showIcon message="Semester was not created" description={createError}
              closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
            <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={loading}>
              <Form.Item
                name="programId"
                label="Program"
                rules={[{ required: true, message: "Please select program" }]}
              >
                <Select placeholder={programsError ? "Programs unavailable" : programsLoading ? "Loading programs…" : "Select program"}
                  loading={programsLoading} disabled={programsLoading || Boolean(programsError)}>
                  {programs.map((program) => (
                    <Option key={program.id} value={program.id}>
                      {program.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="semesterNumber"
                    label="Semester Number"
                    rules={[{ required: true, message: "Enter semester number" }]}
                  >
                    <InputNumber min={1} max={12} style={{ width: "100%" }} placeholder="1, 2, 3..." />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="name"
                label="Semester Name"
                rules={[
                  { required: true, whitespace: true, message: "Please enter semester name" },
                  { max: 255, message: "Name must be 255 characters or less" },
                ]}
              >
                <Input placeholder="e.g., First Year - Term 1" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                  Create Semester
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Semesters"
            size="small"
            extra={
              <Space>
                <Select
                  placeholder={programsError ? "Programs unavailable" : programsLoading ? "Loading programs…" : "Filter by program"}
                  allowClear
                  loading={programsLoading}
                  disabled={programsLoading || Boolean(programsError)}
                  style={{ width: 200 }}
                  onChange={(val) => setSelectedProgram(val)}
                >
                  {programs.map((program) => (
                    <Option key={program.id} value={program.id}>
                      {program.name}
                    </Option>
                  ))}
                </Select>
                <AdminTableToolbar
                  searchValue={search}
                  onSearch={setSearch}
                  searchPlaceholder="Search semesters"
                  onRefresh={fetchData}
                  loading={tableLoading}
                  exportFileName="semesters.csv"
                  exportRows={() =>
                    // Row data comes back snake_case (see the table columns/handleEdit above,
                    // which all read record.program_id / .semester_number / etc) — the camelCase
                    // keys this used to read don't exist on the row, so every exported column but
                    // "name" came out blank.
                    filteredData.map((r) => ({
                      id: r.id,
                      name: r.name ?? "",
                      semesterNumber: r.semester_number ?? r.semesterNumber ?? "",
                      programId: r.program_id ?? r.programId ?? "",
                      totalCredits: (Array.isArray(r.courses) ? r.courses : []).reduce((t, c) => t + (Number(c.credits) || 0), 0),
                      isActive: (r.is_active ?? r.isActive) === false ? "no" : "yes",
                    }))
                  }
                />
              </Space>
            }
          >
            {deleteError ? (
              <Alert
                type="error"
                showIcon
                message="Semester was not deleted"
                description={deleteError.message}
                action={<Button size="small" onClick={() => handleDelete(deleteError.record, false)} disabled={deletingId != null}>Retry delete</Button>}
                closable
                onClose={() => setDeleteError(null)}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            {programsError && (
              <Alert type="error" showIcon message="Programs could not be loaded" description={programsError}
                action={<Button size="small" onClick={fetchPrograms} loading={programsLoading}>Retry programs</Button>}
                style={{ marginBottom: 12 }} />
            )}
            {tableLoading && hasCurrentSemesters ? <RefreshStatus label="Refreshing semesters…" /> : null}
            {loadError && (
              <Alert type={hasCurrentSemesters ? "warning" : "error"} showIcon
                message={hasCurrentSemesters ? "Couldn't refresh semesters" : "Could not load semester data"}
                description={hasCurrentSemesters ? "Showing the last semesters loaded for this program scope." : loadError}
                action={<Button size="small" onClick={() => fetchData(programs)}>Retry</Button>} style={{ marginBottom: 12 }} />
            )}
            {tableLoading && !hasCurrentSemesters ? (
              <TableSkeleton rows={8} columns={6} label="Loading semesters" />
            ) : loadError && !hasCurrentSemesters ? null : (
              <Table
                dataSource={filteredData}
                columns={columns}
                rowKey="id"
                size="small"
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
                locale={{ emptyText: "No semesters found. Create a program first, then add semesters." }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title="Edit Semester"
        open={editModalVisible}
        onOk={() => editForm.submit()}
        onCancel={handleEditCancel}
        confirmLoading={editLoading}
        okButtonProps={{ disabled: editLoading }}
        cancelButtonProps={{ disabled: editLoading }}
        okText="Save Changes"
        cancelText="Cancel"
        maskClosable={false}
        className="admin-list-page-modal"
        closable={!editLoading}
        keyboard={!editLoading}
      >
        {editError ? <Alert type="error" showIcon message="Semester was not updated" description={editError}
          closable onClose={() => setEditError("")} style={{ marginBottom: 12 }} /> : null}
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} disabled={editLoading}>
          <Form.Item
            name="programId"
            label="Program"
            rules={[{ required: true, message: "Please select program" }]}
            tooltip="Program cannot be changed after a semester is created."
          >
            <Select placeholder="Select program" disabled>
              {programs.map((program) => (
                <Option key={program.id} value={program.id}>
                  {program.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="semesterNumber"
                label="Semester Number"
                rules={[{ required: true, message: "Enter semester number" }]}
                tooltip="Semester number cannot be changed after a semester is created."
              >
                <InputNumber min={1} max={12} style={{ width: "100%" }} placeholder="1, 2, 3..." disabled />
              </Form.Item>
            </Col>
            {/* Kept hidden so saving an edit doesn't clear a stored value; credits are now the courses' total. */}
            <Form.Item name="totalCredits" hidden><InputNumber /></Form.Item>
          </Row>

          <Form.Item
            name="name"
            label="Semester Name"
            rules={[
              { required: true, whitespace: true, message: "Please enter semester name" },
              { max: 255, message: "Name must be 255 characters or less" },
            ]}
          >
            <Input placeholder="e.g., First Year - Term 1" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
            extra="Batches can only be promoted into an active semester."
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SemesterManagement;
