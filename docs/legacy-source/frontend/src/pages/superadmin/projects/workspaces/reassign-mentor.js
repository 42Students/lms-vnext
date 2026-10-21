import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, AutoComplete, Button, Card, Empty, Form, Input, Popconfirm, Select, Skeleton, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import { showProjectErrorMessage } from "@/utils/projectErrorModal";
import { QuestionCircleOutlined, SwapOutlined } from "@ant-design/icons";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { bulkReassignProjectMentor, fetchWithErrorHandling, getFacultyByCollegeId, getProjectsByCollege } from "@/api/Services/AdminService";
import {
  asArray,
  isArchivedStatus,
  isProjectAtRisk,
  memberRoleLabel,
  normaliseCollegeScopedName,
  projectMentorMember,
  projectStatus,
  statusColor,
  statusLabel,
  textOrDash,
  unwrapApiList,
} from "@/components/admin/projects/adminProjectUtils";

const { Text, Paragraph } = Typography;

function SuperAdminProjectReassignMentorPageBody() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [fromMentorId, setFromMentorId] = useState(undefined);
  const [selectedIds, setSelectedIds] = useState([]);
  const [reassigning, setReassigning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [page, setPage] = useState(1);
  const [form] = Form.useForm();
  const selectedMentorId = Form.useWatch("toMentorId", form);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [facultyOptionsLoading, setFacultyOptionsLoading] = useState(false);
  const [facultyOptionsError, setFacultyOptionsError] = useState(null);
  const reassigningRef = useRef(false);

  const loadFacultyOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getFacultyByCollegeId(collegeId, { search }));
    if (!result?.success) throw new Error(result?.message || "Faculty options could not be loaded.");
    const raw = result?.data?.data ?? result?.data ?? [];
    return (Array.isArray(raw) ? raw : []).map((item) => ({
      value: item.id,
      label: `${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || item.contactMobile || `Faculty ${item.id}`,
    }));
  };

  // Two Selects share this options state, and each fires its own onFocus("") reset alongside
  // onSearch(query) — a slower "" request issued just before a query can resolve after it,
  // silently overwriting the correctly-filtered results with the full unfiltered roster. Guard
  // against that out-of-order response by only applying the reply from the most recent request.
  const facultySearchSeq = useRef(0);
  const handleFacultySearch = async (value) => {
    if (!collegeId) return;
    const requestId = ++facultySearchSeq.current;
    setFacultyOptionsLoading(true);
    setFacultyOptionsError(null);
    try {
      const options = await loadFacultyOptions(value);
      if (requestId !== facultySearchSeq.current) return;
      setFacultyOptions(options);
    } catch (error) {
      if (requestId !== facultySearchSeq.current) return;
      setFacultyOptions([]);
      setFacultyOptionsError(error?.message || "Faculty options could not be loaded.");
    } finally {
      if (requestId === facultySearchSeq.current) setFacultyOptionsLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) handleFacultySearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  // Keeps ?fromMentorId= as a shareable/bookmarkable deep link into a specific mentor's
  // workspaces — the "Mentor workload" panel below also sets this directly via setFromMentorId
  // without a navigation, but an external link (e.g. a future notification) can still land here
  // pre-filtered.
  useEffect(() => {
    if (!router.isReady) return;
    const fromMentorQuery = router.query?.fromMentorId;
    if (fromMentorQuery) {
      setFromMentorId(Number(fromMentorQuery));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query?.fromMentorId]);

  const load = async () => {
    if (!collegeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithErrorHandling(getProjectsByCollege(collegeId));
      if (result.success) {
        setProjects(asArray(unwrapApiList(result)).filter((project) => !isArchivedStatus(projectStatus(project))));
      } else {
        setProjects([]);
        setError(result?.message || "Failed to load project workspaces.");
      }
    } catch (e) {
      setProjects([]);
      setError(e?.message || "Failed to load project workspaces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const filteredProjects = useMemo(() => {
    if (fromMentorId === undefined || fromMentorId === null || fromMentorId === "") return projects;
    return projects.filter((project) => projectMentorMember(project)?.userId === Number(fromMentorId));
  }, [projects, fromMentorId]);

  // Per-mentor load, computed from the same `projects` this page already fetches — used to be a
  // separate /college-admin/projects/workload page the admin had to navigate to, then click a mentor to
  // land back here with the filter applied. That was a two-hop round trip for what's really one
  // workflow ("who's overloaded → reassign their workspaces"), so it's a panel here instead:
  // clicking a mentor sets the filter below directly, no navigation. `projects` is already
  // archived-filtered (see `load` above), so unlike the old page's 5-column table (Active/
  // Archived/Total/At-risk) there's only one meaningful workspace count here.
  const workload = useMemo(() => {
    const byMentor = new Map();
    asArray(projects).forEach((project) => {
      const mentorMember = projectMentorMember(project);
      const key = mentorMember?.userId ?? "unassigned";
      const name = mentorMember?.name || "Unassigned";
      if (!byMentor.has(key)) {
        byMentor.set(key, { key, mentorId: mentorMember?.userId ?? null, name, count: 0, atRisk: 0 });
      }
      const entry = byMentor.get(key);
      entry.count += 1;
      if (isProjectAtRisk(project)) entry.atRisk += 1;
    });
    return Array.from(byMentor.values()).sort((a, b) => b.count - a.count);
  }, [projects]);

  // Sort order alone doesn't visually flag an overloaded mentor — a mentor carrying 1.5x+ the
  // average active load (with a floor so 1-2 workspace differences among light loads don't
  // trigger it) gets a visible "Overloaded" cue instead of relying on the admin to notice.
  const assignedMentors = workload.filter((row) => row.mentorId);
  const averageLoad = assignedMentors.length
    ? assignedMentors.reduce((sum, row) => sum + row.count, 0) / assignedMentors.length
    : 0;
  const overloadThreshold = Math.max(averageLoad * 1.5, averageLoad + 3);

  const workloadColumns = [
    {
      title: "Mentor",
      dataIndex: "name",
      key: "name",
      render: (name, record) =>
        record.mentorId ? (
          <Button type="link" style={{ padding: 0, height: "auto", fontWeight: 600 }} onClick={() => setFromMentorId(record.mentorId)}>
            {name}
          </Button>
        ) : (
          <Tag color="default">{name}</Tag>
        ),
    },
    {
      title: (
        <Tooltip title="Flagged when a mentor's active workspace count is 50% or more above the college average.">
          <Space size={4}>
            Active workspaces
            <QuestionCircleOutlined />
          </Space>
        </Tooltip>
      ),
      dataIndex: "count",
      key: "count",
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: "descend",
      render: (value, record) =>
        record.mentorId && value > 0 && value >= overloadThreshold ? (
          <Space size={6}>
            <Text strong>{value}</Text>
            <Tag color="orange">Overloaded</Tag>
          </Space>
        ) : (
          value
        ),
    },
    {
      title: "At-risk",
      dataIndex: "atRisk",
      key: "atRisk",
      render: (value) => (value > 0 ? <Tag color="red">{value} at risk</Tag> : <Tag color="green">0</Tag>),
    },
  ];

  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
    setLastResult(null);
  }, [fromMentorId]);

  const selectedRoleLabel = Form.useWatch("roleLabel", form);

  // Lets the confirm dialog and result summary tell the admin up front how many of their
  // selected workspaces already have this exact mentor — those are safely skipped as no-ops by
  // the backend (see reassignMentorCore), not reassigned or re-notified, so the count that will
  // actually change is often smaller than the raw selection count. reassignMentorCore's no-op
  // check compares BOTH mentorId AND the (case-insensitive, blank-defaults-to-"Project Mentor")
  // role label — matching on userId alone here would tell the admin "will skip" for a workspace
  // the backend actually reassigns (soft-delete + re-insert + fresh notification) because the
  // Role label changed.
  const desiredRoleLabel = (selectedRoleLabel || "").trim() || "Project Mentor";
  const alreadyAssignedCount = useMemo(() => {
    if (!selectedMentorId) return 0;
    return selectedIds.reduce((count, projectId) => {
      const project = filteredProjects.find((item) => String(item?.id ?? item?.slug ?? item?.numericId) === String(projectId));
      const currentMentor = project ? projectMentorMember(project) : null;
      if (!currentMentor?.userId || String(currentMentor.userId) !== String(selectedMentorId)) return count;
      const currentRoleLabel = (memberRoleLabel(currentMentor) || "").trim() || "Project Mentor";
      return currentRoleLabel.toLowerCase() === desiredRoleLabel.toLowerCase() ? count + 1 : count;
    }, 0);
  }, [selectedIds, selectedMentorId, filteredProjects, desiredRoleLabel]);

  // Backend failures come back as "<projectId>: <error message>" (see bulkReassignProjectMentor)
  // — projectId is a raw UUID/numeric id the admin never sees anywhere in the UI. Resolve it
  // against `projects` (not just the currently-filtered subset — a failure can reference any
  // selected workspace) to show the workspace title they actually recognize instead.
  const describeFailure = (failure) => {
    const separatorIndex = failure.indexOf(": ");
    const rawId = separatorIndex === -1 ? failure : failure.slice(0, separatorIndex);
    const message = separatorIndex === -1 ? "" : failure.slice(separatorIndex + 2);
    const project = projects.find((item) => String(item?.id ?? item?.slug ?? item?.numericId) === String(rawId));
    const label = project ? normaliseCollegeScopedName(project, "Workspace") : rawId;
    return message ? `${label}: ${message}` : label;
  };

  const handleReassign = async (values) => {
    if (reassigningRef.current) return;
    if (!selectedIds.length) {
      message.warning("Select at least one workspace to reassign.");
      return;
    }
    reassigningRef.current = true;
    setReassigning(true);
    setLastResult(null);
    try {
      const result = await fetchWithErrorHandling(
        bulkReassignProjectMentor({
          collegeId,
          projectIds: selectedIds,
          mentorId: Number(values.toMentorId),
          roleLabel: values.roleLabel || undefined,
        })
      );
      if (result.success) {
        const payload = result?.data?.data ?? result?.data ?? {};
        const reassignedCount = payload.reassignedCount ?? 0;
        const skippedCount = payload.skippedCount ?? 0;
        const failures = asArray(payload.failures);
        const mentorName = facultyOptions.find((option) => String(option.value) === String(values.toMentorId))?.label;
        setLastResult({ reassignedCount, skippedCount, failures, mentorName: mentorName || `mentor ${values.toMentorId}` });
        if (reassignedCount) {
          message.success(`Reassigned ${reassignedCount} workspace(s) to ${mentorName || `mentor ${values.toMentorId}`}.`);
        } else if (!failures.length) {
          message.info("No workspaces needed changes — they already have this mentor.");
        }
        if (failures.length) {
          showProjectErrorMessage(
            `These workspaces were NOT reassigned: ${failures.map(describeFailure).join(", ")}`,
            { title: `${failures.length} reassignment(s) failed` }
          );
        }
        setSelectedIds([]);
        setPage(1);
        form.resetFields(["toMentorId", "roleLabel"]);
        load();
      } else {
        showProjectErrorMessage(result?.message || "Failed to reassign mentor.", { title: "Reassignment failed" });
      }
    } catch (e) {
      showProjectErrorMessage(e?.message || "Failed to reassign mentor.", { title: "Reassignment failed" });
    } finally {
      reassigningRef.current = false;
      setReassigning(false);
    }
  };

  const columns = [
    {
      title: "Workspace",
      key: "workspace",
      render: (_, project) => normaliseCollegeScopedName(project, "Workspace"),
    },
    {
      title: "Current mentor",
      key: "mentor",
      render: (_, project) => {
        const mentor = projectMentorMember(project);
        // Same userId + role-label match as alreadyAssignedCount / the backend's reassignMentorCore
        // no-op check — a userId-only match here would flag a "will skip" that the backend actually
        // reassigns because the Role label differs.
        const currentRoleLabel = (memberRoleLabel(mentor) || "").trim() || "Project Mentor";
        const isTargetMentor =
          selectedMentorId &&
          mentor?.userId &&
          String(mentor.userId) === String(selectedMentorId) &&
          currentRoleLabel.toLowerCase() === desiredRoleLabel.toLowerCase();
        return (
          <Space size={6}>
            <span>{mentor?.userId ? mentor.name : textOrDash(project?.mentor)}</span>
            {isTargetMentor ? <Tag color="default">Already this mentor — will skip</Tag> : null}
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, project) => <Tag color={statusColor(projectStatus(project))}>{statusLabel(projectStatus(project))}</Tag>,
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: (keys) => setSelectedIds(keys),
  };

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing scope is a state to recover from, and dropping the tab
            strip and every other navigation affordance is the one thing that makes it harder. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="No college selected"
              description="Pick a college in the header to reassign its mentors."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Bulk mentor reassignment</h1>
          <div className="admin-list-page__subtitle">Move multiple active workspaces to a new mentor at once.</div>
        </div>
        <Space wrap>
          <Button onClick={() => router.push("/superadmin/projects/workspaces")}>
            Back to workspaces
          </Button>
        </Space>
      </div>

      {error ? (
        <Alert type="error" message="Workspaces could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={load}>Retry</Button>} />
      ) : null}

      <Card style={{ marginBottom: 16 }} title="Mentor workload">
        <Skeleton loading={loading} active paragraph={{ rows: 4 }}>
          {workload.length ? (
            <Table
              rowKey="key"
              dataSource={workload}
              columns={workloadColumns}
              pagination={workload.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
              size="small"
            />
          ) : (
            <Empty description="No project workspaces available for this college" />
          )}
        </Skeleton>
      </Card>

      <Card style={{ marginBottom: 16 }} title="Filter by current mentor">
        <Form layout="vertical">
          <Form.Item label="Current mentor" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              style={{ minWidth: 240 }}
              options={facultyOptions}
              loading={facultyOptionsLoading}
              showSearch
              filterOption={false}
              onSearch={handleFacultySearch}
              onFocus={() => handleFacultySearch("")}
              placeholder="Any mentor — search by name"
              value={fromMentorId}
              onChange={setFromMentorId}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="Select workspaces"
        extra={<Text type="secondary">{selectedIds.length} selected</Text>}
        style={{ marginBottom: 16 }}
      >
        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {filteredProjects.length ? (
            <Table
              rowKey={(record) => record?.id || record?.slug || record?.numericId}
              rowSelection={rowSelection}
              dataSource={filteredProjects}
              columns={columns}
              pagination={{ current: page, pageSize: 10, showSizeChanger: false, onChange: setPage }}
            />
          ) : (
            <Empty description="No active workspaces match this filter" />
          )}
        </Skeleton>
      </Card>

      {facultyOptionsError ? <Alert type="error" showIcon message="Mentor options could not be loaded" description={facultyOptionsError} style={{ marginBottom: 16 }} action={<Button size="small" onClick={() => handleFacultySearch("")}>Retry mentors</Button>} /> : null}
      <Card title="Reassign to new mentor" extra={<SwapOutlined />}>
        <Paragraph type="secondary">
          The selected workspaces will get this mentor as their <strong>primary Project Mentor</strong>. Their
          previous primary mentor is removed from each workspace (but keeps every other workspace they manage);
          any Co-Mentors or Reviewers already on these workspaces are left untouched. This also cancels the
          outgoing mentor&apos;s meetings and clears their task assignments on each workspace — both the outgoing
          and incoming mentor are notified. Workspaces that already have this exact mentor are skipped
          automatically — nothing changes for them.
        </Paragraph>
        <Form form={form} layout="vertical" onFinish={handleReassign}>
          <Space wrap align="start" size={16}>
            <Form.Item name="toMentorId" label="New mentor" rules={[{ required: true, message: "Select a mentor" }]}>
              <Select
                style={{ minWidth: 240 }}
                options={facultyOptions}
                loading={facultyOptionsLoading}
                showSearch
                filterOption={false}
                onSearch={handleFacultySearch}
                onFocus={() => handleFacultySearch("")}
                placeholder="Search by mentor name"
              />
            </Form.Item>
            <Form.Item
              name="roleLabel"
              label="Role label"
              rules={[{ max: 80, message: "Keep the role label to 80 characters" }]}
              tooltip="Shown on the workspace's team roster in place of 'Project Mentor'. Leave blank unless you have a specific reason to relabel this role."
            >
              <AutoComplete
                options={[{ value: "Project Mentor" }]}
                style={{ minWidth: 220 }}
                filterOption={(inputValue, option) => option.value.toLowerCase().includes(inputValue.toLowerCase())}
              >
                <Input placeholder="Project Mentor" />
              </AutoComplete>
            </Form.Item>
          </Space>
          {selectedIds.length ? (
            <Paragraph type="secondary" style={{ marginTop: -8 }}>
              {selectedMentorId && alreadyAssignedCount > 0
                ? `${alreadyAssignedCount} of ${selectedIds.length} selected workspace(s) already have this mentor and will be skipped.`
                : `${selectedIds.length} workspace(s) selected.`}
            </Paragraph>
          ) : null}
          <Form.Item>
            <Popconfirm
              title={
                selectedMentorId
                  ? `Reassign ${selectedIds.length - alreadyAssignedCount} of ${selectedIds.length} selected workspace(s) to ${facultyOptions.find((o) => String(o.value) === String(selectedMentorId))?.label || "this mentor"}?`
                  : `Reassign ${selectedIds.length} workspace(s)?`
              }
              okText="Reassign"
              onConfirm={() => form.submit()}
              disabled={!selectedIds.length}
            >
              <Button type="primary" loading={reassigning} disabled={!selectedIds.length || Boolean(facultyOptionsError)}>
                Reassign selected
              </Button>
            </Popconfirm>
          </Form.Item>
        </Form>

        {lastResult ? (
          <Alert
            style={{ marginTop: 16 }}
            type={lastResult.failures.length ? "warning" : "success"}
            showIcon
            message={`Reassigned ${lastResult.reassignedCount} to ${lastResult.mentorName}${lastResult.skippedCount ? `, skipped ${lastResult.skippedCount} (already assigned)` : ""}${lastResult.failures.length ? `, ${lastResult.failures.length} failed` : ""}.`}
            description={lastResult.failures.length ? `Failed: ${lastResult.failures.map(describeFailure).join(", ")}` : undefined}
            closable
            onClose={() => setLastResult(null)}
          />
        ) : null}
      </Card>
      </SuperAdminGroupShell>
    </div>
  );
}

// BE-0154/0155/0175/0176/0186: the page starts afresh for each college, so a header switch can't leave the last college's
// rows, selections, open dialogs or late answers on screen (or let a save act on them).
export default function SuperAdminProjectReassignMentorPage(props) {
  const { selectedCollegeId } = useSuperAdminScope();
  return <SuperAdminProjectReassignMentorPageBody key={selectedCollegeId ?? "none"} {...props} />;
}

SuperAdminProjectReassignMentorPage.superAdminLayout = SuperAdminLayout;
