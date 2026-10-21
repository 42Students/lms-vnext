import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Typography,
  message,
} from "antd";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import WorkspaceTeamOverview from "@/components/admin/projects/WorkspaceTeamOverview";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import { appAction } from "@/redux/store";
import { showProjectError } from "@/utils/projectErrorModal";
import { useAdminWorkspace } from "@/components/admin/projects/adminWorkspaceSection";
import {
  assignProjectLearners,
  assignProjectMentor,
  fetchWithErrorHandling,
  getFacultyByCollegeId,
  getLearnersByCollegeId,
} from "@/api/Services/AdminService";
import {
  asArray,
  isArchivedStatus,
  memberRoleLabel,
  normaliseCollegeScopedName,
  projectMentorMember,
  projectStatus,
} from "@/components/admin/projects/adminProjectUtils";

const { Paragraph } = Typography;

// A workspace can carry up to 500 learners (see the Manage learners modal's cap below) — an
// unbounded wrapped Tag cloud at that size is the same unbounded-scroll problem the array
// sections use `List` pagination to avoid; a show-more toggle keeps the tag-cloud look intact.

// Which member role a given member entry represents, relative to the workspace's primary mentor
// — used to color/label the Members list so a mentor, a co-mentor, and a learner are visually
// distinguishable instead of an undifferentiated wall of grey tags.
const memberRole = (member, primaryMentorId) => {
  const type = String(member?.userType || "").toUpperCase();
  if (type === "FACULTY") {
    if (primaryMentorId && String(member?.userId) === String(primaryMentorId)) {
      return { label: "Mentor", color: "blue" };
    }
    return { label: memberRoleLabel(member) || "Faculty", color: "purple" };
  }
  if (type === "LEARNER") return { label: memberRoleLabel(member) || "Learner", color: "green" };
  return { label: memberRoleLabel(member) || type || "Member", color: "default" };
};

export default function AdminProjectWorkspaceTeamPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;
  const workspaceId = router.query.workspaceId;


  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorSaving, setMentorSaving] = useState(false);
  const [mentorForm] = Form.useForm();
  const selectedMentorId = Form.useWatch("mentorId", mentorForm);

  const [learnersOpen, setLearnersOpen] = useState(false);
  const [learnersSaving, setLearnersSaving] = useState(false);
  const [learnersForm] = Form.useForm();
  const learnersReplaceExisting = Form.useWatch("replaceExisting", learnersForm);
  const selectedLearnerIds = Form.useWatch("learnerIds", learnersForm);

  const [facultyOptions, setFacultyOptions] = useState([]);
  const [learnerOptions, setLearnerOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // The two header buttons each just called their own setXOpen(true) with no guard against the
  // other modal already being open — nothing stopped both stacking, at which point the shared
  // Escape handler below (fixed close-priority order) could close the wrong (bottom) one while
  // the visibly-open one stayed put. Route every open through here so only one is ever open.
  const openOnlyModal = (which) => {
    setMentorOpen(which === "mentor");
    setLearnersOpen(which === "learners");
  };

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);

  // AntD's own Escape handling on these Modals wasn't reliably closing them — wire it explicitly.
  useEffect(() => {
    if (!mentorOpen && !learnersOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      // An open antd Select dropdown (inside either modal) should collapse on Escape first —
      // without this check, hitting Escape to back out of a mentor/learner search dropdown closed
      // the whole modal instead, discarding the in-progress search.
      if (document.querySelector(".ant-select-open")) return;
      if (mentorOpen) {
        setMentorOpen(false);
        mentorForm.resetFields();
      } else if (learnersOpen) {
        setLearnersOpen(false);
        learnersForm.resetFields();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mentorOpen, learnersOpen, mentorForm, learnersForm]);

  const normalizeList = (result) => {
    const raw = result?.data?.data ?? result?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  };

  // Each loader throws on a failed fetch (rather than silently resolving to []) so both the
  // initial load and each search handler below can tell "nothing matched" apart from "the request
  // failed" and say so, instead of always rendering an unexplained empty Select.
  const loadFacultyOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getFacultyByCollegeId(collegeId, { search }));
    if (!result.success) throw new Error(result?.message || "Failed to load faculty");
    return normalizeList(result).map((item) => ({
      value: item.id,
      label:
        `${`${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || "Faculty"} · ID ${item.id}`,
    }));
  };

  const loadLearnerOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getLearnersByCollegeId(collegeId, { search }));
    if (!result.success) throw new Error(result?.message || "Failed to load learners");
    return normalizeList(result).map((item) => ({
      value: item.id,
      label:
        `${`${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || "Learner"} · ${item.rollNumber ? `Roll ${item.rollNumber}` : `ID ${item.id}`}`,
    }));
  };

  // Each search replaces the whole `options` array with the new result set — if the currently
  // selected value(s) aren't in that new set (because the admin selected one, then searched for
  // a different name), antd Select has no label left to render for them and falls back to
  // showing the raw id instead of the name.
  const mergeSelectedIntoOptions = (newOptions, selectedValues, previousOptions) => {
    const selected = asArray(selectedValues);
    if (!selected.length) return newOptions;
    const missing = selected
      .map((val) => previousOptions.find((o) => String(o.value) === String(val)))
      .filter(Boolean)
      .filter((opt) => !newOptions.some((o) => String(o.value) === String(opt.value)));
    return missing.length ? [...missing, ...newOptions] : newOptions;
  };

  // onSearch and onFocus both call this for the same Select — guard against a slower "" reset
  // request resolving after a more specific query and silently overwriting its filtered results.
  const facultySearchSeq = useRef(0);
  const handleFacultySearch = async (value) => {
    const requestId = ++facultySearchSeq.current;
    try {
      const options = await loadFacultyOptions(value);
      if (requestId === facultySearchSeq.current) {
        setFacultyOptions((prev) => mergeSelectedIntoOptions(options, selectedMentorId ? [selectedMentorId] : [], prev));
      }
    } catch (e) {
      if (requestId === facultySearchSeq.current) message.error(e?.message || "Failed to search faculty");
    }
  };
  const learnerSearchSeq = useRef(0);
  const handleLearnerSearch = async (value) => {
    const requestId = ++learnerSearchSeq.current;
    try {
      const options = await loadLearnerOptions(value);
      if (requestId === learnerSearchSeq.current) {
        setLearnerOptions((prev) => mergeSelectedIntoOptions(options, selectedLearnerIds, prev));
      }
    } catch (e) {
      if (requestId === learnerSearchSeq.current) message.error(e?.message || "Failed to search learners");
    }
  };

  useEffect(() => {
    if (!collegeId) return undefined;
    let mounted = true;
    (async () => {
      setOptionsLoading(true);
      try {
        const [faculty, learners] = await Promise.all([loadFacultyOptions(), loadLearnerOptions()]);
        if (!mounted) return;
        setFacultyOptions(faculty);
        setLearnerOptions(learners);
      } catch (e) {
        if (mounted) message.error(e?.message || "Failed to load mentor/learner options");
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const { workspace, loading, error, reload: load } = useAdminWorkspace(workspaceId, collegeId);

  const members = asArray(workspace?.members || workspace?.resolvedMembers);
  const primaryMentor = workspace ? projectMentorMember(workspace) : null;
  const currentLearnerCount = members.filter((member) => String(member?.userType || "").toUpperCase() === "LEARNER").length;
  const currentLearnerIds = useMemo(
    () => new Set(members.filter((m) => String(m?.userType || "").toUpperCase() === "LEARNER").map((m) => m?.userId)),
    [members]
  );
  const alreadyMemberLearnerCount = useMemo(() => {
    if (learnersReplaceExisting !== false) return 0;
    return asArray(selectedLearnerIds).filter((id) => currentLearnerIds.has(Number(id))).length;
  }, [selectedLearnerIds, currentLearnerIds, learnersReplaceExisting]);

  const handleAssignMentor = async (values) => {
    setMentorSaving(true);
    try {
      await assignProjectMentor(workspaceId, {
        collegeId,
        mentorId: values.mentorId,
        roleLabel: values.roleLabel || undefined,
      });
      message.success("Mentor assigned");
      setMentorOpen(false);
      mentorForm.resetFields();
      load();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to assign mentor" });
    } finally {
      setMentorSaving(false);
    }
  };

  const handleAssignLearners = async (values) => {
    const learnerIds = Array.isArray(values.learnerIds) ? values.learnerIds.map(Number) : [];
    const removed = values.replaceExisting !== false
      ? members.filter((m) => String(m?.userType || "").toUpperCase() === "LEARNER" && !learnerIds.includes(Number(m.userId)))
      : [];
    if (removed.length) {
      const confirmed = await new Promise((resolve) => Modal.confirm({
        title: `Remove ${removed.length} learner${removed.length === 1 ? "" : "s"} from this workspace?`,
        content: `Access will be removed for: ${removed.map((m) => m.name || m.displayName || `Learner ${m.userId}`).join(", ")}. Prior work is retained, but they cannot access it until re-added.`,
        okText: "Replace roster", okType: "danger",
        onOk: () => resolve(true), onCancel: () => resolve(false),
      }));
      if (!confirmed) return;
    }
    setLearnersSaving(true);
    try {
      await assignProjectLearners(workspaceId, {
        collegeId,
        learnerIds,
        roleLabel: values.roleLabel || undefined,
        replaceExisting: values.replaceExisting !== false,
      });
      message.success("Learners updated");
      setLearnersOpen(false);
      learnersForm.resetFields();
      load();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update learners" });
    } finally {
      setLearnersSaving(false);
    }
  };

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing college is a state to recover from, and dropping the
            tab strip and every other navigation affordance is the one thing that makes it
            harder. */}
        <AdminWorkspaceShell workspaceId={workspaceId} title="Project workspace">
          <Alert
            type="warning"
            message="Admin not assigned to a college"
            description="You must be assigned to a college to view project workspaces."
            showIcon
          />
        </AdminWorkspaceShell>
      </div>
    );
  }

  const archived = isArchivedStatus(projectStatus(workspace));

  return (
    <div className="ln-module admin-list-page">
      <AdminWorkspaceShell
        workspaceId={workspaceId}
        title={workspace ? normaliseCollegeScopedName(workspace, "Workspace") : "Project workspace"}
        subtitle="Manage mentor ownership, student membership and workload across this workspace."
        actions={
          <Space wrap>
            {/* An ellipsis suffix is the standard convention for "opens a dialog here". The backend
                rejects both of these outright on an archived workspace (requireProjectNotArchived
                in ProjectWorkspaceServiceImpl), so leaving them enabled let an admin fill out a
                whole form only to hit a generic error at the very end. */}
            <Button icon={<UserOutlined />} onClick={() => openOnlyModal("mentor")} disabled={archived}>
              Reassign mentor…
            </Button>
            <Button icon={<TeamOutlined />} onClick={() => openOnlyModal("learners")} disabled={archived}>
              Manage students…
            </Button>
          </Space>
        }
      >
        <Modal
          title="Reassign mentor"
          open={mentorOpen}
          onCancel={() => {
            setMentorOpen(false);
            mentorForm.resetFields();
          }}
          onOk={() => mentorForm.submit()}
          confirmLoading={mentorSaving}
          okText="Assign"
        >
          <Form form={mentorForm} layout="vertical" onFinish={handleAssignMentor}>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Reassigning replaces the current mentor${
                primaryMentor?.name ? ` (${primaryMentor.name})` : ""
              }: their meetings on this workspace are cancelled, their task assignments are cleared, and both the outgoing and incoming mentor are notified.`}
            />
            <Form.Item name="mentorId" label="Mentor" rules={[{ required: true, message: "Mentor is required" }]}>
              <Select
                allowClear
                options={facultyOptions}
                loading={optionsLoading}
                showSearch
                filterOption={false}
                onSearch={handleFacultySearch}
                onFocus={() => handleFacultySearch("")}
                placeholder="Search by faculty name"
              />
            </Form.Item>
            <Form.Item
              name="roleLabel"
              label="Role label (optional)"
              tooltip="Shown on the workspace's team roster in place of 'Project Mentor'. Leave blank unless you have a specific reason to relabel this role."
            >
              <Input placeholder="Project Mentor" />
            </Form.Item>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Reassigning several workspaces at once, or want to see mentor workload first?{" "}
              <Link href="/college-admin/projects/workspaces/reassign-mentor">Use the bulk Reassign Mentor page</Link>.
            </Paragraph>
          </Form>
        </Modal>

        <Modal
          title="Manage students"
          open={learnersOpen}
          onCancel={() => {
            setLearnersOpen(false);
            learnersForm.resetFields();
          }}
          onOk={() => learnersForm.submit()}
          confirmLoading={learnersSaving}
          okText="Save"
        >
          <Form form={learnersForm} layout="vertical" onFinish={handleAssignLearners} initialValues={{ replaceExisting: false }}>
            {learnersReplaceExisting !== false && currentLearnerCount > 0 ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message={`Replacing existing learners will remove ${currentLearnerCount} current learner${
                  currentLearnerCount === 1 ? "" : "s"
                } from this workspace, along with their access to it. Their prior task/delivery history is retained but they will no longer be able to view or edit it.`}
              />
            ) : null}
            {learnersReplaceExisting === false && alreadyMemberLearnerCount > 0 ? (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`${alreadyMemberLearnerCount} of the selected learner${
                  alreadyMemberLearnerCount === 1 ? "" : "s"
                } already on this workspace.`}
              />
            ) : null}
            <Form.Item
              name="learnerIds"
              label="Students"
              rules={[
                { required: true, message: "At least one learner is required" },
                // The 500 cap is on the workspace's TOTAL active membership, not this batch alone
                // (the backend enforces that in assignProjectLearners) — so this must account for
                // currentLearnerCount/alreadyMemberLearnerCount too, not just this array's length.
                {
                  validator: (_, value) => {
                    const selected = Array.isArray(value) ? value : [];
                    const resultingTotal =
                      learnersReplaceExisting === false
                        ? currentLearnerCount + (selected.length - alreadyMemberLearnerCount)
                        : selected.length;
                    if (resultingTotal > 500) {
                      return Promise.reject(
                        new Error(
                          `This would exceed the 500-learner limit for this workspace — currently ${
                            learnersReplaceExisting === false ? currentLearnerCount : 0
                          }, adding ${
                            learnersReplaceExisting === false ? selected.length - alreadyMemberLearnerCount : selected.length
                          }.`
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Select
                mode="multiple"
                maxCount={500}
                options={learnerOptions}
                loading={optionsLoading}
                showSearch
                filterOption={false}
                onSearch={handleLearnerSearch}
                onFocus={() => handleLearnerSearch("")}
                placeholder="Search by student name"
              />
            </Form.Item>
            <Form.Item name="roleLabel" label="Role label (optional)">
              <Input placeholder="Project Contributor" />
            </Form.Item>
            <Form.Item name="replaceExisting" valuePropName="checked">
              <Checkbox onChange={(event) => {
                  if (event.target.checked) {
                    const existing = members.filter((m) => String(m?.userType || "").toUpperCase() === "LEARNER");
                    learnersForm.setFieldsValue({ learnerIds: existing.map((m) => m.userId) });
                    setLearnerOptions((current) => {
                      const missing = existing.filter((m) => !current.some((opt) => String(opt.value) === String(m.userId)));
                      return [...current, ...missing.map((m) => ({ value: m.userId, label: m.name || m.displayName || `Learner ${m.userId}` }))];
                    });
                  }
                }}>Replace existing learners (unchecked appends instead)</Checkbox>
            </Form.Item>
          </Form>
        </Modal>

        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={load}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <>
              <WorkspaceTeamOverview
                workspace={workspace}
                workspaceId={workspaceId}
                collegeId={collegeId}
                members={members}
                primaryMentor={primaryMentor}
                roleOf={(member) => memberRole(member, primaryMentor?.userId)}
                onRepaired={load}
              />
            </>
          ) : (
            !loading && <Alert type="warning" message="Workspace not found" showIcon />
          )}
        </Skeleton>
      </AdminWorkspaceShell>
    </div>
  );
}

AdminProjectWorkspaceTeamPage.adminLayout = AdminLayout;
