import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Form, Input, Button, Table, Card, Row, Col, message, Select, InputNumber, Popconfirm, Modal, Space } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { 
  createLectureHall, 
  getLectureHalls, 
  getLectureHallsByCollege,
  getColleges, 
  getDepartments, 
  getDepartmentsByCollege,
  fetchWithErrorHandling,
  updateLectureHall,
  deleteLectureHall
} from "@/api/Services/AdminService";

const { Option } = Select;
const { TextArea } = Input;

const snapshot = (values) => JSON.stringify({
  name: String(values?.name || "").trim(),
  collegeId: values?.collegeId ?? null,
  deptId: values?.deptId ?? null,
  capacity: values?.capacity ?? 50,
  roomType: values?.roomType ?? null,
  description: String(values?.description || "").trim(),
});

const roomTypes = [
  { value: "CLASSROOM", label: "Classroom" },
  { value: "LECTURE_HALL", label: "Lecture Hall" },
  { value: "LAB", label: "Laboratory" },
  { value: "SEMINAR_HALL", label: "Seminar Hall" },
  { value: "AUDITORIUM", label: "Auditorium" },
  { value: "CONFERENCE_ROOM", label: "Conference Room" },
];

const LectureHalls = ({ collegeId }) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const filteredData = (Array.isArray(data) ? data : []).filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(r.name || "").toLowerCase().includes(q) ||
      String(r.roomType || "").toLowerCase().includes(q)
    );
  });
  const [colleges, setColleges] = useState([]);
  const [collegesError, setCollegesError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsError, setDepartmentsError] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const dataSeq = useRef(0);
  const collegeSeq = useRef(0);
  const departmentSeq = useRef(0);
  const originalEditRef = useRef(null);

  const fetchData = useCallback(async () => {
    const request = ++dataSeq.current;
    setTableLoading(true);
    setLoadError("");
    const apiCall = collegeId ? getLectureHallsByCollege(collegeId) : getLectureHalls();
    const result = await fetchWithErrorHandling(apiCall);
    if (request !== dataSeq.current) return;
    if (!result.success || !Array.isArray(result.data)) {
      setLoadError(result?.data?.message || result?.data?.error || result?.message || "Could not load lecture halls");
      setData([]);
    } else {
      setData(result.data);
    }
    setTableLoading(false);
  }, [collegeId]);

  const fetchColleges = useCallback(async () => {
    const request = ++collegeSeq.current;
    setCollegesError("");
    const result = await fetchWithErrorHandling(getColleges());
    if (request !== collegeSeq.current) return;
    if (!result.success || !Array.isArray(result.data)) {
      setColleges([]);
      setCollegesError(result?.data?.message || result?.data?.error || result?.message || "Could not load colleges");
      return;
    }
    setColleges(result.data);
  }, []);

  const fetchDepartments = useCallback(async () => {
    const request = ++departmentSeq.current;
    setDepartmentsError("");
    const apiCall = collegeId ? getDepartmentsByCollege(collegeId) : getDepartments();
    const result = await fetchWithErrorHandling(apiCall);
    if (request !== departmentSeq.current) return;
    if (!result.success || !Array.isArray(result.data)) {
      setDepartments([]);
      setDepartmentsError(result?.data?.message || result?.data?.error || result?.message || "Could not load departments");
      return;
    }
    setDepartments(result.data);
  }, [collegeId]);

  useEffect(() => {
    // BE-0098: the old college's rooms and any open edit go away at once (an edit must not save into the new college).
    setData([]);
    setEditModalVisible(false);
    setEditingRecord(null);
    editForm.resetFields();
    fetchData();
    if (!collegeId) fetchColleges();
    else { setColleges([]); setCollegesError(""); }
    fetchDepartments();
  }, [collegeId, fetchData, fetchColleges, fetchDepartments, editForm]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const resolvedCollegeId = collegeId ?? values.collegeId;
      if (!resolvedCollegeId) {
        message.error("College is required.");
        setLoading(false);
        return;
      }
      const payload = {
        name: (values.name || "").trim(),
        college_id: resolvedCollegeId,
        dept_id: values.deptId ?? 0,
        capacity: values.capacity ?? 50,
        room_type: values.roomType,
        description: (values.description || "").trim(),
      };
      await createLectureHall(payload);
      message.success("Lecture hall created successfully!");
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not create the room. Try again.");
    }
    setLoading(false);
  };

  const handleEdit = (record) => {
    const values = {
      name: record.name,
      collegeId: record.collegeId,
      deptId: record.deptId || undefined,
      capacity: record.capacity,
      roomType: record.roomType,
      description: record.description,
    };
    setEditingRecord(record);
    editForm.resetFields();
    editForm.setFieldsValue(values);
    originalEditRef.current = snapshot(values);
    setEditModalVisible(true);
  };

  const finishEdit = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    editForm.resetFields();
    originalEditRef.current = null;
  };

  const handleEditCancel = () => {
    if (editLoading) return;
    if (!editingRecord || snapshot(editForm.getFieldsValue(true)) === originalEditRef.current) {
      finishEdit();
      return;
    }
    Modal.confirm({
      title: `Discard edits to “${editingRecord.name || "this lecture hall"}”?`,
      content: "Your unsaved changes will be lost.",
      okText: "Discard edits",
      okButtonProps: { danger: true },
      onOk: finishEdit,
    });
  };

  const handleEditSubmit = async (values) => {
    if (!editingRecord) return;
    setEditLoading(true);
    try {
      const resolvedCollegeId = collegeId ?? values.collegeId ?? editingRecord.collegeId;
      if (!resolvedCollegeId) {
        message.error("College is required.");
        setEditLoading(false);
        return;
      }
      const payload = {
        name: (values.name || "").trim(),
        college_id: resolvedCollegeId,
        dept_id: values.deptId ?? 0,
        capacity: values.capacity ?? 50,
        room_type: values.roomType,
        description: (values.description || "").trim(),
      };
      await updateLectureHall(editingRecord.id, payload);
      message.success("Lecture hall updated successfully!");
      finishEdit();
      fetchData();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not save the room. Try again.");
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (deletingId != null) return;
    setDeletingId(id);
    try {
      await deleteLectureHall(id);
      message.success("Lecture hall deleted successfully!");
      await fetchData();
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not delete the room. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { 
      title: "Room Type", 
      dataIndex: "roomType", 
      key: "roomType",
      render: (roomType) => {
        const type = roomTypes.find(t => t.value === roomType);
        return type?.label || roomType;
      }
    },
    { title: "Capacity", dataIndex: "capacity", key: "capacity", width: 80 },
    { 
      title: "College", 
      dataIndex: "collegeId", 
      key: "collegeId",
      render: (collegeId) => {
        const college = colleges.find(c => c.id === collegeId);
        return college?.name || collegeId;
      }
    },
    { 
      title: "Department", 
      dataIndex: "deptId", 
      key: "deptId",
      render: (deptId) => {
        if (!deptId || deptId === 0) return "-";
        const dept = departments.find(d => d.id === deptId);
        return dept?.name || deptId;
      }
    },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={deletingId != null}
            size="small"
            title="Edit"
            aria-label="Edit lecture hall"
          />
          <Popconfirm
            title="Delete this room?"
            description="A room with scheduled class sessions can't be deleted until they move to another room."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
              disabled={deletingId != null && deletingId !== record.id}
              size="small"
              title="Delete"
              aria-label="Delete lecture hall"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <h1 className="admin-list-page__title">Lecture Halls</h1>
      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="Create New Lecture Hall / Room" size="small">
            {!collegeId && collegesError && <Alert type="error" showIcon message="Colleges could not be loaded"
              description={collegesError} action={<Button size="small" onClick={fetchColleges}>Retry</Button>} style={{ marginBottom: 12 }} />}
            {departmentsError && <Alert type="warning" showIcon message="Departments could not be loaded"
              description="Department assignment is unavailable. You can retry, or leave the optional department blank."
              action={<Button size="small" onClick={fetchDepartments}>Retry</Button>} style={{ marginBottom: 12 }} />}
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              {!collegeId && (
                <Form.Item
                  name="collegeId"
                  label="College"
                  rules={[{ required: true, message: "Please select college" }]}
                >
                  <Select placeholder={collegesError ? "Colleges unavailable — Retry above" : "Select college"} disabled={Boolean(collegesError)}>
                    {colleges.map((college) => (
                      <Option key={college.id} value={college.id}>
                        {college.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item name="deptId" label="Department (Optional)">
                <Select placeholder={departmentsError ? "Departments unavailable — Retry above" : "Select department"} allowClear disabled={Boolean(departmentsError)}>
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="name"
                label="Room Name"
                rules={[
                  { required: true, whitespace: true, message: "Please enter room name" },
                  { max: 255, message: "Room name must be 255 characters or less" },
                ]}
              >
                <Input placeholder="e.g., Room 101, Lab A" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="roomType"
                    label="Room Type"
                    rules={[{ required: true, message: "Select a room type" }]}
                  >
                    <Select placeholder="Select type">
                      {roomTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="capacity" label="Capacity" initialValue={50}>
                    <InputNumber min={1} max={1000} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="Description">
                <TextArea rows={2} placeholder="e.g., AC room, projector available" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}
                  disabled={!collegeId && Boolean(collegesError)}>
                  Create Lecture Hall
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Existing Lecture Halls / Rooms"
            size="small"
            extra={
              <AdminTableToolbar
                searchValue={search}
                onSearch={setSearch}
                searchPlaceholder="Search halls"
                onRefresh={fetchData}
                loading={tableLoading}
                exportFileName="lecture-halls.csv"
                exportRows={() =>
                  filteredData.map((r) => ({
                    id: r.id,
                    name: r.name ?? "",
                    capacity: r.capacity ?? "",
                    roomType: r.roomType ?? "",
                    departmentId: r.deptId ?? "",
                    description: r.description ?? "",
                  }))
                }
              />
            }
          >
            {loadError && <Alert type="error" showIcon message="Could not load lecture halls" description={loadError}
              action={<Button size="small" onClick={fetchData}>Retry</Button>} style={{ marginBottom: 12 }} />}
            <Table
              dataSource={filteredData}
              columns={collegeId ? columns.filter((c) => c.key !== "collegeId") : columns}
              rowKey="id"
              loading={tableLoading}
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
              locale={{ emptyText: loadError ? "Could not load lecture halls; use Retry above." : "No lecture halls found." }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title="Edit Lecture Hall"
        open={editModalVisible}
        onCancel={handleEditCancel}
        maskClosable={!editLoading}
        keyboard={!editLoading}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          {!collegeId && (
            <Form.Item
              name="collegeId"
              label="College"
              rules={[{ required: true, message: "Please select college" }]}
            >
              <Select placeholder={collegesError ? "Colleges unavailable — Retry above" : "Select college"} disabled={Boolean(collegesError)}>
                {colleges.map((college) => (
                  <Option key={college.id} value={college.id}>
                    {college.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="deptId" label="Department (Optional)">
            <Select placeholder={departmentsError ? "Departments unavailable — Retry above" : "Select department"} allowClear disabled={Boolean(departmentsError)}>
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Room Name"
            rules={[
              { required: true, whitespace: true, message: "Please enter room name" },
              { max: 255, message: "Room name must be 255 characters or less" },
            ]}
          >
            <Input placeholder="e.g., Room 101, Lab A" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="roomType"
                label="Room Type"
                rules={[{ required: true, message: "Select a room type" }]}
              >
                <Select placeholder="Select type">
                  {roomTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capacity" label="Capacity">
                <InputNumber min={1} max={1000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="e.g., AC room, projector available" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleEditCancel} disabled={editLoading}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={editLoading}
                disabled={(!collegeId && Boolean(collegesError))}>
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LectureHalls;
