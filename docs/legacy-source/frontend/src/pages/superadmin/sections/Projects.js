import { useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Typography, message } from "antd";
import { PlusOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import {
  createProject,
  assignProjectMentor,
  assignProjectLearners,
  archiveProject,
  deleteProject,
  getProjectsByCollege,
  getFacultyByCollegeId,
  getLearnersByCollegeId,
  getClassesByCollege,
  fetchWithErrorHandling,
} from "@/api/Services/AdminService";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { PanelEmpty, StatusBadge } from "@/components/Common/PanelStates";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";

const { Text } = Typography;

function normalize(value) {
  return value == null || value === "" ? "—" : value;
}

/** A stored constant ("IN_PROGRESS", "PROJECT_MENTOR") as words ("In progress", "Project mentor"); other text is kept as it is. */
function readable(value) {
  if (value == null || value === "") return "—";
  const text = String(value);
  // Short acronyms ("TA", "HR") stay as they are.
  return /^[A-Z0-9_]+$/.test(text) && (text.includes("_") || text.length > 3) ? text.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()) : text;
}

function projectStatusBadge(status) {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized.includes("DONE") || normalized.includes("COMPLETE")) {
    return <StatusBadge status="evaluated" label={readable(status)} />;
  }
  if (normalized.includes("BLOCK")) {
    return <StatusBadge status="failed" label={readable(status)} />;
  }
  if (normalized.includes("REVIEW")) {
    return <StatusBadge status="pending" label={readable(status)} />;
  }
  return <StatusBadge status={status || "closed"} label={readable(status)} />;
}

function resultAsFormError(result, fallback) {
  const data = result?.data && typeof result.data === "object"
    ? result.data
    : { message: result?.error || result?.message || fallback };
  return { response: { data } };
}

export default function Projects({ collegeId }) {
  const isScoped = collegeId != null && Number.isFinite(Number(collegeId)) && Number(collegeId) > 0;
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [loadedCollegeId, setLoadedCollegeId] = useState(null);
  const projectSeq = useRef(0);
  const hasCurrentProjects = isScoped && Number(loadedCollegeId) === Number(collegeId);
  const [selectedProject, setSelectedProject] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [projectMutationKey, setProjectMutationKey] = useState(null);
  const [projectMutationError, setProjectMutationError] = useState(null);
  const projectMutationRef = useRef(null);
  const [mentorAssignOpen, setMentorAssignOpen] = useState(false);
  const [mentorAssignLoading, setMentorAssignLoading] = useState(false);
  const [mentorAssignError, setMentorAssignError] = useState("");
  const [mentorAssignForm] = Form.useForm();
  const [learnerAssignOpen, setLearnerAssignOpen] = useState(false);
  const [learnerAssignLoading, setLearnerAssignLoading] = useState(false);
  const [learnerAssignError, setLearnerAssignError] = useState("");
  const [learnerAssignForm] = Form.useForm();
  const [createForm] = Form.useForm();

  const [facultyOptions, setFacultyOptions] = useState([]);
  const [learnerOptions, setLearnerOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const normalizeList = (result) => {
    const raw = result?.data?.data ?? result?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  };

  const loadFacultyOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getFacultyByCollegeId(collegeId, { search }));
    return normalizeList(result).map((item) => ({
      value: item.id,
      label: `${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || item.contactMobile || `Faculty ${item.id}`,
    }));
  };

  const loadLearnerOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getLearnersByCollegeId(collegeId, { search }));
    return normalizeList(result).map((item) => ({
      value: item.id,
      label: `${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || item.rollNumber || item.contactMobile || `Learner ${item.id}`,
    }));
  };

  const loadClassOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getClassesByCollege(collegeId, { search }));
    return normalizeList(result).map((item) => ({
      value: item.id,
      label: item.name ?? item.className ?? item.class_name ?? `Class ${item.id}`,
    }));
  };

  const loadOptions = async () => {
    if (!isScoped) return;
    setLoadingOptions(true);
    try {
      const [faculty, learners, classes] = await Promise.all([
        loadFacultyOptions(),
        loadLearnerOptions(),
        loadClassOptions(),
      ]);
      setFacultyOptions(faculty);
      setLearnerOptions(learners);
      setClassOptions(classes);
    } catch {
      setFacultyOptions([]);
      setLearnerOptions([]);
      setClassOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchProjects = async () => {
    const request = ++projectSeq.current;
    if (!isScoped) {
      setProjects([]);
      setLoadedCollegeId(null);
      setLoading(false);
      setFetchError(null);
      return;
    }
    const sameScope = Number(loadedCollegeId) === Number(collegeId);
    setLoading(true);
    setFetchError(null);
    if (!sameScope) setProjects([]);
    try {
      const result = await fetchWithErrorHandling(getProjectsByCollege(collegeId));
      if (request !== projectSeq.current) return;
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : result.data?.data ?? [];
        setProjects(Array.isArray(list) ? list : []);
        setLoadedCollegeId(collegeId);
      } else {
        setFetchError(result?.error || result?.message || "Failed to load projects.");
      }
    } catch (error) {
      if (request !== projectSeq.current) return;
      setFetchError(error?.message || "Failed to load projects.");
    } finally {
      if (request === projectSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    ++projectSeq.current;
    setProjects([]);
    setLoadedCollegeId(null);
    setFetchError(null);
    setSelectedProject(null);
    setDrawerOpen(false);
    setProjectMutationKey(null);
    setProjectMutationError(null);
    projectMutationRef.current = null;
    fetchProjects();
    loadOptions();
    return () => { ++projectSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const handleFacultySearch = async (value) => {
    setLoadingOptions(true);
    try {
      setFacultyOptions(await loadFacultyOptions(value));
    } catch {
      setFacultyOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleLearnerSearch = async (value) => {
    setLoadingOptions(true);
    try {
      setLearnerOptions(await loadLearnerOptions(value));
    } catch {
      setLearnerOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleClassSearch = async (value) => {
    setLoadingOptions(true);
    try {
      setClassOptions(await loadClassOptions(value));
    } catch {
      setClassOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const openCreate = () => {
    createForm.resetFields();
    setCreateError("");
    createForm.setFieldsValue({
      status: "IN_PROGRESS",
      phase: "Planning",
      progress: 0,
      learnerIds: [],
    });
    setCreateOpen(true);
  };

  const openAssignMentor = (project) => {
    if (!project) return;
    mentorAssignForm.resetFields();
    setMentorAssignError("");
    mentorAssignForm.setFieldsValue({
      projectId: project.slug || project.id,
      collegeId,
      mentorId: project.members?.find((member) => String(member.userType || "").toUpperCase() === "FACULTY")?.userId,
      roleLabel: "Project Mentor",
    });
    setSelectedProject(project);
    setMentorAssignOpen(true);
  };

  const openAssignLearners = (project) => {
    if (!project) return;
    learnerAssignForm.resetFields();
    setLearnerAssignError("");
    learnerAssignForm.setFieldsValue({
      projectId: project.slug || project.id,
      collegeId,
      learnerIds: Array.isArray(project.members)
        ? project.members.filter((member) => String(member.userType || "").toUpperCase() === "LEARNER").map((member) => member.userId).filter(Boolean)
        : [],
      roleLabel: "Project Contributor",
      replaceExisting: true,
    });
    setSelectedProject(project);
    setLearnerAssignOpen(true);
  };

  const onAssignMentor = async () => {
    try {
      const values = await mentorAssignForm.validateFields();
      setMentorAssignError("");
      setMentorAssignLoading(true);
      const result = await fetchWithErrorHandling(assignProjectMentor(values.projectId, {
        collegeId,
        mentorId: values.mentorId,
        roleLabel: values.roleLabel?.trim() || "Project Mentor",
      }));
      if (!result.success) {
        const error = resultAsFormError(result, "Failed to assign mentor.");
        const fieldError = applyServerFieldErrors(mentorAssignForm, error, {
          mentor_id: "mentorId",
          role_label: "roleLabel",
          college_id: "collegeId",
          project_id: "projectId",
        });
        const errorMessage = getServerFormError(error, "Failed to assign mentor.");
        setMentorAssignError(errorMessage);
        if (!fieldError) message.error(errorMessage);
        return;
      }
      message.success("Mentor assigned successfully");
      setMentorAssignOpen(false);
      mentorAssignForm.resetFields();
      fetchProjects();
    } catch (error) {
      if (error?.errorFields) return;
      const fieldError = applyServerFieldErrors(mentorAssignForm, error, {
        mentor_id: "mentorId", role_label: "roleLabel", college_id: "collegeId", project_id: "projectId",
      });
      const errorMessage = getServerFormError(error, "Failed to assign mentor.");
      setMentorAssignError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      setMentorAssignLoading(false);
    }
  };

  // BE-0201: "replace" removes every current learner who is not in the new list. Those people are named and confirmed
  // first; nobody is taken off a project without the admin seeing who.
  const onAssignLearners = async () => {
    let values;
    try {
      values = await learnerAssignForm.validateFields();
    } catch (error) {
      if (error?.errorFields) return;
      throw error;
    }
    const keep = new Set((values.learnerIds || []).map(String));
    const removed = values.replaceExisting === false ? [] : (Array.isArray(selectedProject?.members) ? selectedProject.members : [])
      .filter((m) => String(m.userType || "").toUpperCase() === "LEARNER" && m.userId != null && !keep.has(String(m.userId)));
    if (removed.length === 0) return submitAssignLearners(values);
    Modal.confirm({
      title: `Remove ${removed.length} ${removed.length === 1 ? "student" : "students"} from this project?`,
      content: (
        <div data-testid="projects-learner-removal-confirm">
          <p>Saving with &quot;replace&quot; takes these students off the project:</p>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            {removed.slice(0, 20).map((m) => <li key={m.userId}>{String(m.name || "").trim() || `Student #${m.userId}`}</li>)}
          </ul>
          {removed.length > 20 && <p>and {removed.length - 20} more.</p>}
        </div>
      ),
      okText: "Remove and save",
      okButtonProps: { danger: true },
      cancelText: "Keep them",
      onOk: () => submitAssignLearners(values),
    });
  };

  const submitAssignLearners = async (values) => {
    try {
      setLearnerAssignError("");
      setLearnerAssignLoading(true);
      const result = await fetchWithErrorHandling(assignProjectLearners(values.projectId, {
        collegeId,
        learnerIds: values.learnerIds || [],
        roleLabel: values.roleLabel?.trim() || "Project Contributor",
        replaceExisting: values.replaceExisting !== false,
      }));
      if (!result.success) {
        const error = resultAsFormError(result, "Failed to assign learners.");
        const fieldError = applyServerFieldErrors(learnerAssignForm, error, {
          learner_ids: "learnerIds",
          role_label: "roleLabel",
          replace_existing: "replaceExisting",
          college_id: "collegeId",
          project_id: "projectId",
        });
        const errorMessage = getServerFormError(error, "Failed to assign learners.");
        setLearnerAssignError(errorMessage);
        if (!fieldError) message.error(errorMessage);
        return;
      }
      message.success("Learners assigned successfully");
      setLearnerAssignOpen(false);
      learnerAssignForm.resetFields();
      fetchProjects();
    } catch (error) {
      if (error?.errorFields) return;
      const fieldError = applyServerFieldErrors(learnerAssignForm, error, {
        learner_ids: "learnerIds", role_label: "roleLabel", replace_existing: "replaceExisting",
        college_id: "collegeId", project_id: "projectId",
      });
      const errorMessage = getServerFormError(error, "Failed to assign learners.");
      setLearnerAssignError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      setLearnerAssignLoading(false);
    }
  };

  const closeProjectForm = (kind, force = false) => {
    const config = kind === "mentor"
      ? { form: mentorAssignForm, loading: mentorAssignLoading, close: () => setMentorAssignOpen(false), clear: () => setMentorAssignError(""), label: "mentor assignment" }
      : kind === "learners"
        ? { form: learnerAssignForm, loading: learnerAssignLoading, close: () => setLearnerAssignOpen(false), clear: () => setLearnerAssignError(""), label: "learner assignment" }
        : { form: createForm, loading: createLoading, close: () => setCreateOpen(false), clear: () => setCreateError(""), label: "project" };

    if (config.loading) return;
    const finish = () => {
      config.close();
      config.clear();
      config.form.resetFields();
    };
    if (force || !config.form.isFieldsTouched()) {
      finish();
      return;
    }
    Modal.confirm({
      title: "Discard unsaved changes?",
      content: `Your unsaved ${config.label} changes will be lost.`,
      okText: "Discard changes",
      okButtonProps: { danger: true },
      onOk: finish,
    });
  };

  const performProjectMutation = async (project, kind) => {
    const key = `${kind}:${project.id ?? project.slug}`;
    if (projectMutationRef.current) return Promise.reject(new Error("Another project action is already in progress."));
    const actionCollegeId = collegeId;
    projectMutationRef.current = key;
    setProjectMutationKey(key);
    setProjectMutationError(null);
    try {
      const result = await fetchWithErrorHandling(
        kind === "archive"
          ? archiveProject(project.slug || project.id, actionCollegeId)
          : deleteProject(project.slug || project.id, actionCollegeId)
      );
      if (!result.success) {
        throw new Error(result?.error || result?.message || `Failed to ${kind} project`);
      }
      if (Number(actionCollegeId) === Number(collegeId)) {
        message.success(kind === "archive" ? "Project archived" : "Project deleted");
        if (kind === "archive" && selectedProject?.id === project.id) {
          setSelectedProject(result.data?.data ?? result.data ?? selectedProject);
        }
        if (kind === "delete" && selectedProject?.id === project.id) {
          setDrawerOpen(false);
          setSelectedProject(null);
        }
        fetchProjects();
      }
      return true;
    } catch (error) {
      if (Number(actionCollegeId) === Number(collegeId)) {
        setProjectMutationError({
          kind,
          project,
          message: error?.message || `Failed to ${kind} project`,
        });
        message.error(error?.message || `Failed to ${kind} project`);
      }
      // Static Modal.confirm remains open when its returned promise rejects, so the
      // admin can retry the same destructive action without reopening the dialog.
      throw error;
    } finally {
      projectMutationRef.current = null;
      setProjectMutationKey(null);
    }
  };

  const onArchiveProject = (project) => {
    if (projectMutationRef.current) return;
    Modal.confirm({
      title: "Archive project?",
      content: "Archived projects remain visible in the admin list but are treated as archived for other surfaces.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: () => performProjectMutation(project, "archive"),
    });
  };

  const onDeleteProject = (project) => {
    if (projectMutationRef.current) return;
    Modal.confirm({
      title: "Delete project?",
      content: "This uses soft delete so the project is hidden from normal surfaces without losing the record.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () => performProjectMutation(project, "delete"),
    });
  };

  const onCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateError("");
      setCreateLoading(true);
      const payload = {
        title: values.title?.trim(),
        summary: values.summary?.trim(),
        courseLabel: values.courseLabel?.trim(),
        status: values.status,
        phase: values.phase,
        progress: values.progress ?? 0,
        blocker: values.blocker?.trim(),
        nextAction: values.nextAction?.trim(),
        dueLabel: values.dueLabel?.trim(),
        organizationId: values.organizationId ?? undefined,
        collegeId,
        classId: values.classId,
        mentorId: values.mentorId,
        learnerIds: values.learnerIds ?? [],
      };
      const result = await fetchWithErrorHandling(createProject(payload));
      if (!result.success) {
        const error = resultAsFormError(result, "Failed to create project.");
        const fieldError = applyServerFieldErrors(createForm, error, {
          course_label: "courseLabel",
          college_id: "collegeId",
          class_id: "classId",
          mentor_id: "mentorId",
          learner_ids: "learnerIds",
          next_action: "nextAction",
          due_label: "dueLabel",
        });
        const errorMessage = getServerFormError(error, "Failed to create project.");
        setCreateError(errorMessage);
        if (!fieldError) message.error(errorMessage);
        return;
      }
      message.success("Project created successfully");
      setCreateOpen(false);
      createForm.resetFields();
      fetchProjects();
    } catch (error) {
      if (error?.errorFields) return;
      const fieldError = applyServerFieldErrors(createForm, error, {
        course_label: "courseLabel", college_id: "collegeId", class_id: "classId",
        mentor_id: "mentorId", learner_ids: "learnerIds", next_action: "nextAction", due_label: "dueLabel",
      });
      const errorMessage = getServerFormError(error, "Failed to create project.");
      setCreateError(errorMessage);
      if (!fieldError) message.error(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      title: "Project",
      dataIndex: "title",
      key: "title",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{normalize(value)}</Text>
          <Text type="secondary">{normalize(record.slug || record.id)}</Text>
        </Space>
      ),
    },
    { title: "Course", dataIndex: "course", key: "course", render: normalize },
    { title: "Mentor", dataIndex: "mentor", key: "mentor", render: normalize },
    { title: "Phase", dataIndex: "phase", key: "phase", render: normalize },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      render: (value) => `${Number(value ?? 0)}%`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => projectStatusBadge(value),
    },
    { title: "Due", dataIndex: "dueLabel", key: "dueLabel", render: normalize },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const archiveKey = `archive:${record.id ?? record.slug}`;
        const deleteKey = `delete:${record.id ?? record.slug}`;
        const rowBusy = projectMutationKey === archiveKey || projectMutationKey === deleteKey;
        return (
          <Space wrap>
            <Button icon={<EyeOutlined />} onClick={() => { setSelectedProject(record); setDrawerOpen(true); }} disabled={rowBusy}>
              View
            </Button>
            <Button onClick={() => openAssignMentor(record)} disabled={rowBusy}>
              Assign Mentor
            </Button>
            <Button onClick={() => openAssignLearners(record)} disabled={rowBusy}>
              Assign Learners
            </Button>
            <Button
              icon={<InboxOutlined />}
              onClick={() => onArchiveProject(record)}
              loading={projectMutationKey === archiveKey}
              disabled={rowBusy && projectMutationKey !== archiveKey}
            >
              Archive
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDeleteProject(record)}
              loading={projectMutationKey === deleteKey}
              disabled={rowBusy && projectMutationKey !== deleteKey}
            >
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  if (!isScoped) {
    return (
      <Alert
        type="info"
        showIcon
        message="Select a College to manage Projects"
        description="Projects are college-scoped. Use the header Organization/College selector."
      />
    );
  }

  return (
    <div className="admin-list-page">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Projects</h1>
          <div className="admin-list-page__subtitle">College project workspaces for students and mentors.</div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchProjects} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create Project
          </Button>
        </Space>
      </div>

      {projectMutationError ? (
        <Alert
          type="error"
          showIcon
          message={projectMutationError.kind === "archive" ? "Project was not archived" : "Project was not deleted"}
          description={projectMutationError.message}
          action={
            <Button
              size="small"
              onClick={() => projectMutationError.kind === "archive"
                ? onArchiveProject(projectMutationError.project)
                : onDeleteProject(projectMutationError.project)}
              disabled={Boolean(projectMutationKey)}
            >
              Retry
            </Button>
          }
          closable
          onClose={() => setProjectMutationError(null)}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {loading && hasCurrentProjects ? <RefreshStatus label="Refreshing projects…" /> : null}
      {fetchError ? (
        <Alert
          type={hasCurrentProjects ? "warning" : "error"}
          showIcon
          message={hasCurrentProjects ? "Couldn't refresh projects" : fetchError}
          description={hasCurrentProjects ? "Showing the last projects loaded for this college." : undefined}
          action={<Button size="small" onClick={fetchProjects}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {loading && !hasCurrentProjects ? (
        <TableSkeleton rows={8} columns={6} label="Loading projects" />
      ) : fetchError && !hasCurrentProjects ? null : (
        <Table
          rowKey={(record) => record.id ?? record.slug}
          dataSource={projects}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{
            emptyText: (
              <PanelEmpty
                compact
                title="No projects yet"
                description="Create the first project workspace for this college to start assigning mentors and learners."
                ctaLabel="Create project"
                onCta={openCreate}
              />
            ),
          }}
          scroll={{ x: 1200 }}
        />
      )}

      <Drawer
        title={selectedProject ? selectedProject.title : "Project details"}
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {selectedProject ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div><Text type="secondary">Slug</Text><div>{normalize(selectedProject.slug)}</div></div>
            <div><Text type="secondary">Course</Text><div>{normalize(selectedProject.course)}</div></div>
            <div><Text type="secondary">Mentor</Text><div>{normalize(selectedProject.mentor)}</div></div>
            <div><Text type="secondary">Phase</Text><div>{readable(selectedProject.phase)}</div></div>
            <div><Text type="secondary">Status</Text><div>{projectStatusBadge(selectedProject.status)}</div></div>
            <div><Text type="secondary">Progress</Text><div>{selectedProject.progress != null ? `${selectedProject.progress}%` : "—"}</div></div>
            <div><Text type="secondary">Due</Text><div>{normalize(selectedProject.dueLabel)}</div></div>
            <div><Text type="secondary">Blocker</Text><div>{normalize(selectedProject.blocker)}</div></div>
            <div><Text type="secondary">Next Action</Text><div>{normalize(selectedProject.nextAction)}</div></div>
            <div>
              <Text type="secondary">Members</Text>
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {Array.isArray(selectedProject.members) && selectedProject.members.length > 0 ? (
                  selectedProject.members.map((member) => (
                    <div key={member.id} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
                      <div><Text strong>{normalize(member.name)}</Text></div>
                      <div><Text type="secondary">{readable(member.role)} · {readable(member.userType)}</Text></div>
                      <div><StatusBadge status={member.status || "closed"} label={readable(member.status)} /></div>
                    </div>
                  ))
                ) : (
                  <Text type="secondary">No members linked yet.</Text>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        title="Assign Mentor"
        open={mentorAssignOpen}
        onCancel={() => closeProjectForm("mentor")}
        onOk={onAssignMentor}
        confirmLoading={mentorAssignLoading}
        okText="Assign"
        okButtonProps={{ disabled: mentorAssignLoading }}
        cancelButtonProps={{ disabled: mentorAssignLoading }}
        closable={!mentorAssignLoading}
        maskClosable={false}
        keyboard={!mentorAssignLoading}
        destroyOnClose
      >
        {mentorAssignError ? <Alert type="error" showIcon message="Mentor was not assigned" description={mentorAssignError}
          closable onClose={() => setMentorAssignError("")} style={{ marginBottom: 12 }} /> : null}
        <Form layout="vertical" form={mentorAssignForm}>
          <Form.Item name="projectId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="collegeId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="mentorId" label="Mentor" rules={[{ required: true, message: "Select a mentor" }]}>
            <Select
              options={facultyOptions}
              loading={loadingOptions}
              showSearch
              filterOption={false}
              onSearch={handleFacultySearch}
              onFocus={() => handleFacultySearch("")}
              placeholder="Select mentor"
            />
          </Form.Item>
          <Form.Item name="roleLabel" label="Role label">
            <Input placeholder="Project Mentor" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Assign Learners"
        open={learnerAssignOpen}
        onCancel={() => closeProjectForm("learners")}
        onOk={onAssignLearners}
        confirmLoading={learnerAssignLoading}
        okText="Assign"
        okButtonProps={{ disabled: learnerAssignLoading }}
        cancelButtonProps={{ disabled: learnerAssignLoading }}
        closable={!learnerAssignLoading}
        maskClosable={false}
        keyboard={!learnerAssignLoading}
        width={760}
        destroyOnClose
      >
        {learnerAssignError ? <Alert type="error" showIcon message="Learners were not assigned" description={learnerAssignError}
          closable onClose={() => setLearnerAssignError("")} style={{ marginBottom: 12 }} /> : null}
        <Form layout="vertical" form={learnerAssignForm}>
          <Form.Item name="projectId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="collegeId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="learnerIds" label="Learners" rules={[{ required: true, message: "Select at least one learner" }]}>
            <Select
              mode="multiple"
              options={learnerOptions}
              loading={loadingOptions}
              showSearch
              filterOption={false}
              onSearch={handleLearnerSearch}
              onFocus={() => handleLearnerSearch("")}
              placeholder="Select learners"
            />
          </Form.Item>
          <Form.Item name="roleLabel" label="Role label">
            <Input placeholder="Project Contributor" />
          </Form.Item>
          <Form.Item name="replaceExisting" valuePropName="checked">
            <Checkbox>Replace existing learner allocation</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create Project"
        open={createOpen}
        onCancel={() => closeProjectForm("create")}
        onOk={onCreate}
        confirmLoading={createLoading}
        okText="Create"
        okButtonProps={{ disabled: createLoading }}
        cancelButtonProps={{ disabled: createLoading }}
        closable={!createLoading}
        maskClosable={false}
        keyboard={!createLoading}
        width={760}
        destroyOnClose
      >
        {createError ? <Alert type="error" showIcon message="Project was not created" description={createError}
          closable onClose={() => setCreateError("")} style={{ marginBottom: 12 }} /> : null}
        <Form layout="vertical" form={createForm} initialValues={{ status: "IN_PROGRESS", phase: "Planning", progress: 0 }}>
          <Form.Item name="title" label="Project Title" rules={[{ required: true, message: "Enter a project title" }]}>
            <Input placeholder="Project title" />
          </Form.Item>
          <Form.Item name="summary" label="Summary">
            <Input.TextArea rows={3} placeholder="Short summary" />
          </Form.Item>
          <Form.Item name="courseLabel" label="Course / Context">
            <Input placeholder="Course label" />
          </Form.Item>
          <Form.Item name="classId" label="Class" rules={[{ required: true, message: "Select a class" }]}>
            <Select
              options={classOptions}
              loading={loadingOptions}
              showSearch
              filterOption={false}
              onSearch={handleClassSearch}
              onFocus={() => handleClassSearch("")}
              placeholder="Select class"
            />
          </Form.Item>
          <Form.Item name="mentorId" label="Mentor" rules={[{ required: true, message: "Select a mentor" }]}>
            <Select
              options={facultyOptions}
              loading={loadingOptions}
              showSearch
              filterOption={false}
              onSearch={handleFacultySearch}
              onFocus={() => handleFacultySearch("")}
              placeholder="Select mentor"
            />
          </Form.Item>
          <Form.Item name="learnerIds" label="Learners">
            <Select
              mode="multiple"
              options={learnerOptions}
              loading={loadingOptions}
              showSearch
              filterOption={false}
              onSearch={handleLearnerSearch}
              onFocus={() => handleLearnerSearch("")}
              placeholder="Select learners"
            />
          </Form.Item>
          <Form.Item name="phase" label="Phase">
            <Input placeholder="Planning / Execution / Review" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "NOT_STARTED", label: "Not Started" },
                { value: "BLOCKED", label: "Blocked" },
                { value: "DONE", label: "Done" },
              ]}
            />
          </Form.Item>
          <Form.Item name="progress" label="Progress">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="dueLabel" label="Due Label">
            <Input placeholder="Due Friday / Due 12 Aug" />
          </Form.Item>
          <Form.Item name="blocker" label="Blocker">
            <Input.TextArea rows={2} placeholder="What is blocking the project?" />
          </Form.Item>
          <Form.Item name="nextAction" label="Next Action">
            <Input.TextArea rows={2} placeholder="What should happen next?" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
