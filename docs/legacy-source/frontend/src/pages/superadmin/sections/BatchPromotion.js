import { useState, useEffect, useRef } from "react";
import { Table, Card, message, Select, Tag, Space, Button, Modal, Input, Alert, Tooltip, Form, Switch, Popconfirm, Typography } from "antd";
import { ReloadOutlined, ArrowUpOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { getProgramsByCollege, getBatchesByCollege, promoteBatch, previewBatchPromotion, updateBatch, fetchWithErrorHandling } from "@/api/Services/AdminService";

const { Text } = Typography;
// COMPLETED is the normal end of a batch's life, not an error, so it must not share INACTIVE's colour.
const BATCH_STATUS_TAG = {
  ACTIVE: { color: "green", label: "Active" },
  INACTIVE: { color: "orange", label: "Inactive" },
  COMPLETED: { color: "default", label: "Completed" },
};

const { Option } = Select;

const isCanonicalAcademicYear = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return false;
  return Number(match[2]) === ((Number(match[1]) + 1) % 100);
};

const BatchPromotion = ({ collegeId = null }) => {
  const isScoped = collegeId != null && Number.isFinite(Number(collegeId)) && Number(collegeId) > 0;
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [programs, setPrograms] = useState([]);
  const [programError, setProgramError] = useState("");
  const [selectedProgram, setSelectedProgram] = useState(null);
  // Promotion only ever applies to ACTIVE batches; completed / inactive ones were listed with a
  // dead button, which at 30+ batches buried the ones that actually need promoting.
  const [showAll, setShowAll] = useState(false);
  const [graduatingId, setGraduatingId] = useState(null);
  const [graduationError, setGraduationError] = useState(null);
  const graduationRef = useRef(null);
  const [promotingBatchId, setPromotingBatchId] = useState(null);
  const [promoteError, setPromoteError] = useState(null);
  const promotionRef = useRef(null);
  const [promoteModalBatch, setPromoteModalBatch] = useState(null);
  const [promoteForm] = Form.useForm();
  const [promotePreview, setPromotePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewRequestSeq = useRef(0);
  const batchRequestSeq = useRef(0);
  const programRequestSeq = useRef(0);

  const fetchData = async () => {
    const request = ++batchRequestSeq.current;
    if (!isScoped) {
      setData([]);
      setLoadError("");
      setTableLoading(false);
      return;
    }
    setTableLoading(true);
    setLoadError("");
    try {
      const result = await fetchWithErrorHandling(getBatchesByCollege(collegeId));
      if (request !== batchRequestSeq.current) return;
      const batches = Array.isArray(result.data) ? result.data : (result.data?.data || []);
      if (!result.success || !Array.isArray(batches)) {
        throw new Error(result.message || "Could not load batches");
      }
      setData(batches);
    } catch (error) {
      if (request !== batchRequestSeq.current) return;
      setData([]);
      setLoadError(error?.message || "Could not load batches");
    } finally {
      if (request === batchRequestSeq.current) setTableLoading(false);
    }
  };

  const fetchPrograms = async () => {
    const request = ++programRequestSeq.current;
    if (!isScoped) {
      setPrograms([]);
      setProgramError("");
      return;
    }
    setProgramError("");
    try {
      const result = await fetchWithErrorHandling(getProgramsByCollege(collegeId));
      if (request !== programRequestSeq.current) return;
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(result.message || "Could not load programs");
      }
      setPrograms(result.data);
    } catch (error) {
      if (request !== programRequestSeq.current) return;
      setPrograms([]);
      setProgramError(error?.message || "Could not load programs");
    }
  };

  useEffect(() => {
    setData([]);
    setPrograms([]);
    setSelectedProgram(null);
    setLoadError("");
    setProgramError("");
    setPromoteError(null);
    setPromotingBatchId(null);
    promotionRef.current = null;
    fetchData();
    fetchPrograms();
    return () => {
      ++batchRequestSeq.current;
      ++programRequestSeq.current;
      ++previewRequestSeq.current;
    };
  }, [collegeId]);

  const batchStatus = (batch) => String(batch?.status ?? batch?.statusType ?? "").trim().toUpperCase();
  const isActiveBatch = (batch) => batchStatus(batch) === "ACTIVE";
  const filteredData = data
    .filter((batch) => showAll || isActiveBatch(batch))
    .filter((batch) => selectedProgram == null || Number(batch.programId ?? batch.program_id) === Number(selectedProgram));
  const hiddenCount = showAll ? 0 : data.filter((batch) => !isActiveBatch(batch)).length;

  // A batch in its program's final semester has nowhere to be promoted to. Its next step is
  // graduation, which used to live only behind Batches -> Edit -> Status, so the Promote button
  // here just went grey with no explanation. updateBatch writes every field, so send them all.
  const handleGraduate = async (batch, rejectOnFailure = true) => {
    if (graduationRef.current != null) return false;
    graduationRef.current = batch.id;
    setGraduatingId(batch.id);
    setGraduationError(null);
    try {
      await updateBatch(batch.id, {
        batchName: batch.batchName,
        programId: batch.programId ?? batch.program_id,
        startDate: batch.startDate ?? null,
        endDate: batch.endDate ?? null,
        academicYear: batch.academicYear ?? batch.academic_year ?? null,
        status: "COMPLETED",
      });
      message.success(`Marked “${batch.batchName}” as graduated (Completed).`);
      fetchData();
      return true;
    } catch (error) {
      const errorMessage = "Could not mark the batch as graduated: " + (error?.response?.data?.message || error?.message || "Unknown error");
      setGraduationError({ batch, message: errorMessage });
      message.error(errorMessage);
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      graduationRef.current = null;
      setGraduatingId(null);
    }
  };

  const getProgramForBatch = (batch) => {
    const programId = batch.programId ?? batch.program_id;
    return programs.find((p) => Number(p.id) === Number(programId));
  };

  const getMaxSemester = (program) => {
    if (!program) return null;
    const years = program.durationYears ?? program.duration_years ?? 0;
    if (years < 1) return null;
    return years * 2;
  };

  const handlePromote = (batch) => {
    const status = batchStatus(batch);
    if (status !== "ACTIVE") {
      message.warning(status ? "Only ACTIVE batches can be promoted." : "This batch has no valid status, so promotion is disabled until it is fixed.");
      return;
    }
    const programId = batch.programId ?? batch.program_id;
    const program = getProgramForBatch(batch);
    if (programId != null && !program) {
      message.warning("Program not found. Cannot determine max semester. Refresh the page or assign a valid program to this batch.");
      return;
    }
    const currentSem = batch.currentSemester || batch.current_semester || 1;
    const nextSem = currentSem + 1;
    const maxSem = getMaxSemester(program);
    if (maxSem != null && nextSem > maxSem) {
      message.warning(`Cannot promote: program duration allows only up to Semester ${maxSem}.`);
      return;
    }
    promoteForm.resetFields();
    setPromoteError(null);
    setPromotePreview(null);
    setPromoteModalBatch(batch);
    fetchPreview(batch.id, nextSem);
  };

  // Ignore stale responses when the target semester or batch changes while a preview is in flight.
  const fetchPreview = async (batchId, targetSemester) => {
    const requestSeq = ++previewRequestSeq.current;
    setPreviewLoading(true);
    setPromotePreview(null);
    try {
      const result = await fetchWithErrorHandling(previewBatchPromotion(batchId, targetSemester));
      if (requestSeq === previewRequestSeq.current) {
        // A failed/unavailable preview must never be represented as approval.
        setPromotePreview(result.success && result.data ? result.data : { valid: false, message: "Could not verify this promotion. Please retry." });
      }
    } catch (error) {
      if (requestSeq === previewRequestSeq.current) {
        setPromotePreview({ valid: false, message: "Could not verify this promotion. Please retry." });
      }
    } finally {
      if (requestSeq === previewRequestSeq.current) setPreviewLoading(false);
    }
  };

  const handlePromoteModalOk = async (submittedValues = null) => {
    if (promotionRef.current != null) return;
    if (!isScoped) {
      message.warning("Select a college first.");
      return;
    }
    if (!promoteModalBatch || promotingBatchId != null || previewLoading || promotePreview?.valid !== true) return;
    let values = submittedValues;
    if (!values) {
      values = await promoteForm.validateFields().catch(() => null);
      if (values === null) return;
    }
    const currentSem = promoteModalBatch.currentSemester ?? promoteModalBatch.current_semester ?? 1;
    const effectiveNextSem = currentSem + 1;
    const newAcademicYear = values.new_academic_year && String(values.new_academic_year).trim() ? String(values.new_academic_year).trim() : null;
    const batchId = promoteModalBatch.id;

    setPromoteError(null);
    // Fail closed if the server cannot revalidate; a previous preview may be stale.
    const previewResult = await fetchWithErrorHandling(previewBatchPromotion(batchId, effectiveNextSem));
    if (!previewResult.success) {
      setPromoteError("Could not verify this promotion. Nothing was changed; retry the verification before promoting.");
      return;
    }
    const freshPreview = previewResult.data;
    if (freshPreview?.valid !== true
        || Number(freshPreview.currentSemester) !== Number(currentSem)
        || Number(freshPreview.targetSemester) !== Number(effectiveNextSem)) {
      setPromoteError(freshPreview?.message || "This batch changed after you opened the dialog. Refresh and review it again.");
      return;
    }

    promotionRef.current = batchId;
    setPromotingBatchId(batchId);
    try {
      const payload = { target_semester: effectiveNextSem };
      if (newAcademicYear != null) payload.new_academic_year = newAcademicYear;
      await promoteBatch(batchId, payload);
      finishPromoteModalClose();
      fetchData();
      message.success(`Batch promoted to Semester ${effectiveNextSem}.`);
    } catch (error) {
      setPromoteError("Failed to promote batch: " + (error?.response?.data?.message || error.message));
    } finally {
      promotionRef.current = null;
      setPromotingBatchId(null);
    }
  };

  const finishPromoteModalClose = () => {
    ++previewRequestSeq.current;
    setPreviewLoading(false);
    setPromoteModalBatch(null);
    setPromotePreview(null);
    setPromoteError(null);
    promoteForm.resetFields();
  };

  const handlePromoteModalCancel = () => {
    if (promotionRef.current != null || promotingBatchId != null) return;
    if (!promoteForm.isFieldsTouched()) {
      finishPromoteModalClose();
      return;
    }
    Modal.confirm({
      title: "Discard promotion changes?",
      content: "Your academic-year override will be cleared. Nothing has been promoted yet.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep reviewing",
      onOk: finishPromoteModalClose,
    });
  };

  const columns = [
    { title: "Batch Name", dataIndex: "batchName", key: "batchName" },
    {
      title: "Program",
      dataIndex: "programName",
      key: "programName",
      render: (name, record) => {
        if (name) return name;
        const prog = programs.find(p => p.id === (record.programId || record.program_id));
        return prog?.name || "-";
      }
    },
    {
      title: "Semester", dataIndex: "currentSemester", key: "currentSemester",
      width: 130,
      render: (sem, record) => {
        const semester = sem || record.current_semester || 1;
        const maxSem = getMaxSemester(getProgramForBatch(record));
        return (
          <Tag color="blue">
            Semester {semester}{maxSem ? ` of ${maxSem}` : ""}
          </Tag>
        );
      }
    },
    {
      title: "Academic Year", dataIndex: "academicYear", key: "academicYear",
      width: 120,
      render: (year, record) => year || record.academic_year || "-"
    },
    { title: "Students", dataIndex: "currentStudents", key: "currentStudents", width: 80 },
    {
      title: "Status", dataIndex: "status", key: "status", width: 110,
      render: (status) => {
        const tag = BATCH_STATUS_TAG[status] || { color: "default", label: status || "Unknown" };
        return <Tag color={tag.color}>{tag.label}</Tag>;
      }
    },
    {
      title: "Action", key: "action", width: 170,
      render: (_, record) => {
        const status = batchStatus(record);
        const isActive = status === "ACTIVE";
        const programId = record.programId ?? record.program_id;
        const program = getProgramForBatch(record);
        const hasProgramButMissing = programId != null && !program;
        const maxSem = getMaxSemester(program);
        const currentSem = record.currentSemester ?? record.current_semester ?? 1;
        const atMaxSemester = maxSem != null && currentSem >= maxSem;
        if (isActive && atMaxSemester && !hasProgramButMissing) {
          return (
            <Popconfirm
              title={`Graduate “${record.batchName}”?`}
              description="Semester promotion is finished for this batch. Marking it Completed removes it from this list; it can be reactivated from Batches → Edit."
              okText="Mark graduated"
              onConfirm={() => handleGraduate(record)}
              okButtonProps={{ loading: graduatingId === record.id }}
              disabled={graduatingId != null && graduatingId !== record.id}
            >
              <Button size="small" icon={<CheckCircleOutlined />} loading={graduatingId === record.id}
                disabled={graduatingId != null && graduatingId !== record.id}>
                Mark graduated
              </Button>
            </Popconfirm>
          );
        }
        if (!isActive) return <Text type="secondary">{status ? "Not active" : "Status unavailable"}</Text>;
        const disabled = !isActive || atMaxSemester || hasProgramButMissing;
        const button = (
          <Button
            type="primary"
            icon={<ArrowUpOutlined />}
            size="small"
            onClick={() => handlePromote(record)}
            loading={promotingBatchId === record.id}
            disabled={disabled}
          >
            Promote
          </Button>
        );
        return hasProgramButMissing ? (
          <Tooltip title="Program not found. Cannot determine max semester. Refresh or assign a valid program.">
            <span>{button}</span>
          </Tooltip>
        ) : button;
      },
    },
  ];

  return (
    <div>
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Batch Promotion</h1>
          <div className="admin-list-page__subtitle">Move a cohort to the next semester only after curriculum and staffing checks are ready.</div>
        </div>
      </div>
      {!isScoped && (
        <Alert
          type="warning"
          showIcon
          message="Select a College to promote batches"
          description="Batch promotion is always college-scoped in Superadmin. Use the header Organization/College selector."
          style={{ marginBottom: 16 }}
        />
      )}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Promotion moves a whole batch to its next semester. Set up that semester's courses and faculty first; the server checks the curriculum before allowing it."
      />

      <Card
        title="Batch Promotion"
        extra={
          <Space wrap>
            <Select
              placeholder="Filter by program"
              allowClear
              style={{ width: 200 }}
              onChange={(val) => setSelectedProgram(val)}
            >
              {programs.map((program) => (
                <Option key={program.id} value={program.id}>
                  {program.name}
                </Option>
              ))}
            </Select>
            <Space size={6}>
              <Switch size="small" checked={showAll} onChange={setShowAll} aria-label="Show completed and inactive batches" />
              <Text type="secondary">Show completed / inactive{hiddenCount ? ` (${hiddenCount})` : ""}</Text>
            </Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Refresh
            </Button>
          </Space>
        }
      >
        {graduationError ? (
          <Alert
            type="error"
            showIcon
            message="Batch was not marked graduated"
            description={graduationError.message}
            action={<Button size="small" onClick={() => handleGraduate(graduationError.batch, false)} disabled={graduatingId != null}>Retry</Button>}
            closable
            onClose={() => setGraduationError(null)}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {loadError && <Alert type="error" showIcon message="Could not load batches"
          description={loadError} action={<Button size="small" onClick={fetchData}>Retry</Button>}
          style={{ marginBottom: 12 }} />}
        {programError && <Alert type="error" showIcon message="Could not load programs"
          description={programError} action={<Button size="small" onClick={fetchPrograms}>Retry</Button>}
          style={{ marginBottom: 12 }} />}
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={tableLoading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
          locale={{ emptyText: hiddenCount ? "No active batches. Turn on “Show completed / inactive” to see the rest." : "No batches found." }}
        />
      </Card>

      <Modal
        title={promoteModalBatch ? `Promote "${promoteModalBatch.batchName}"` : "Promote Batch"}
        open={!!promoteModalBatch}
        onOk={() => promoteForm.submit()}
        onCancel={handlePromoteModalCancel}
        okText="Yes, Promote"
        cancelText="Cancel"
        confirmLoading={!!promotingBatchId}
        // Fail closed, not open: a failed preview fetch sets promotePreview to null (see
        // fetchPreview), which previously left OK enabled since `null?.valid === false` is
        // false — an admin could promote a batch the safety check never actually verified.
        // Require an explicit `valid === true` instead of merely "not explicitly false".
        okButtonProps={{ disabled: previewLoading || promotePreview?.valid !== true || promotingBatchId != null }}
        cancelButtonProps={{ disabled: promotingBatchId != null }}
        closable={promotingBatchId == null}
        maskClosable={false}
        keyboard={promotingBatchId == null}
        destroyOnClose
      >
        {promoteModalBatch && (() => {
          const currentSem = promoteModalBatch.currentSemester ?? promoteModalBatch.current_semester ?? 1;
          const nextSem = currentSem + 1;
          const program = getProgramForBatch(promoteModalBatch);
          const maxSem = getMaxSemester(program);
          const studentCount = promotePreview?.studentCount ?? promoteModalBatch.currentStudents ?? promoteModalBatch.current_students ?? 0;
          const classCount = promotePreview?.classCount ?? promoteModalBatch.classCount ?? promoteModalBatch.class_count ?? 0;
          return (
            <div>
              <Alert
                message={`This will affect ${studentCount} student${studentCount === 1 ? "" : "s"} across ${classCount} class${classCount === 1 ? "" : "es"}`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <p>This will:</p>
              <ul>
                <li>Update the batch&apos;s current semester from <strong>Semester {currentSem}</strong> to <strong>Semester {nextSem}</strong></li>
                {promotePreview?.assignmentsToDeactivateCount != null ? (
                  <li>Deactivate <strong>{promotePreview.assignmentsToDeactivateCount}</strong> active faculty assignment{promotePreview.assignmentsToDeactivateCount === 1 ? "" : "s"} for Semester {currentSem}</li>
                ) : (
                  <li>Deactivate active faculty assignments for Semester {currentSem}</li>
                )}
                <li>{studentCount === 1 ? <>The <strong>1</strong> student</> : <>All <strong>{studentCount}</strong> students</>} in this batch will see the new semester&apos;s courses</li>
                {promotePreview?.suggestedAcademicYear && promotePreview?.suggestedAcademicYear !== promotePreview?.currentAcademicYear && (
                  <li>Advance academic year from <strong>{promotePreview.currentAcademicYear}</strong> to <strong>{promotePreview.suggestedAcademicYear}</strong> unless overridden</li>
                )}
                {maxSem != null && <li>Program max semester: <strong>{maxSem}</strong></li>}
              </ul>
              <Form form={promoteForm} layout="vertical" style={{ marginTop: 16 }}
                onFinish={handlePromoteModalOk} disabled={promotingBatchId != null}>
                <Form.Item name="new_academic_year" label="Academic year override (optional)"
                  extra={promotePreview?.suggestedAcademicYear
                    ? `Leave blank to use ${promotePreview.suggestedAcademicYear} automatically.`
                    : "Leave blank to keep the current academic year."}
                  rules={[{ validator: (_, value) => {
                    if (value == null || String(value).trim() === "") return Promise.resolve();
                    return isCanonicalAcademicYear(value)
                      ? Promise.resolve()
                      : Promise.reject(new Error("Use consecutive years, e.g. 2026-27"));
                  } }]}>
                  <Input placeholder={promotePreview?.suggestedAcademicYear || "e.g. 2026-27"} maxLength={7} />
                </Form.Item>
              </Form>
              {promoteError ? (
                <Alert
                  message="Batch was not promoted"
                  description={promoteError}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setPromoteError(null)}
                  style={{ marginTop: 16 }}
                />
              ) : null}
              {previewLoading ? (
                <Alert message="Verifying with server…" type="info" showIcon style={{ marginTop: 16 }} />
              ) : promotePreview == null ? (
                // The preview fetch itself failed (see fetchPreview) — this used to render
                // identically to the "looks fine" Note below, which is exactly the "fails open"
                // gap the disabled OK button above now closes; the copy has to match that intent
                // instead of implying everything is fine.
                <Alert
                  message="Couldn't verify this promotion with the server"
                  description="The safety check failed to run, so promoting is disabled until it can. Try again in a moment."
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              ) : promotePreview.valid === false ? (
                <Alert
                  message="Can’t promote yet"
                  description={promotePreview.message || "This promotion is not currently valid."}
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              ) : (
                <Space direction="vertical" style={{ width: "100%", marginTop: 16 }} size={8}>
                  <Alert
                    message="Server-verified promotion is ready"
                    description={`Semester ${promotePreview.targetSemester} has ${promotePreview.mappedCourseCount ?? 0} mapped course(s) and ${promotePreview.activeFacultyAssignmentCount ?? 0} active faculty assignment(s).`}
                    type="success"
                    showIcon
                  />
                  {promotePreview.staffingReady === false && (
                    <Alert
                      message="Faculty setup is still incomplete"
                      description="No active faculty assignment was found for the target semester. Promotion is allowed, but assign faculty before teaching begins."
                      type="warning"
                      showIcon
                    />
                  )}
                </Space>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default BatchPromotion;
