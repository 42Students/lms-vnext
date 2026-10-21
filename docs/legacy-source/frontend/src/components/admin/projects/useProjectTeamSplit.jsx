import { useState } from "react";
import { Alert, Button, Card, Form, InputNumber, Modal, Radio, Select, Space, Table, Tag, Typography, message } from "antd";
import { createProjectTeams, fetchWithErrorHandling, getLearnersByClass } from "@/api/Services/AdminService";
import { moveLearner, splitIntoTeams, teamTitle } from "@/utils/projectTeams";

// Shared by the college-admin and superadmin "Create workspace" pages so the two can't drift apart
// again (project teams on groups, docs/groups/PROJECT-TEAMS.md).

const rowsOf = (result) => {
  const raw = result?.data?.data ?? result?.data ?? [];
  return Array.isArray(raw) ? raw : [];
};
// The class roster endpoint returns snake_case rows whose id is learner_id, not id.
const learnerIdOf = (l) => l?.id ?? l?.learner_id ?? l?.learnerId;
const learnerLabel = (l) => {
  const name = `${l.firstName ?? l.first_name ?? ""} ${l.lastName ?? l.last_name ?? ""}`.trim() || "Learner";
  const roll = l.rollNumber ?? l.roll_number;
  return `${name} · ${roll ? `Roll ${roll}` : `ID ${learnerIdOf(l)}`}`;
};

/** "Or add a whole class": adds every learner of a class to the form's learnerIds (dedup, 500 cap). */
export function useWholeClassAdd(form, setLearnerOptions) {
  const [addingClass, setAddingClass] = useState(false);
  const addWholeClass = async (classId) => {
    if (!classId) return;
    setAddingClass(true);
    try {
      const result = await fetchWithErrorHandling(getLearnersByClass(classId));
      if (!result?.success) throw new Error(result?.message || "Could not load that class's learners.");
      const rows = rowsOf(result).filter((l) => !(l?.isDeleted ?? l?.is_deleted) && learnerIdOf(l) != null);
      const options = rows.map((l) => ({ value: learnerIdOf(l), label: learnerLabel(l) }));
      const current = form.getFieldValue("learnerIds") || [];
      const merged = [...new Set([...current, ...options.map((o) => o.value)])];
      if (merged.length > 500) {
        message.error(`That would make ${merged.length} learners; a workspace can have at most 500.`);
        return;
      }
      setLearnerOptions((prev) => {
        const byId = new Map(prev.map((o) => [o.value, o]));
        options.forEach((o) => byId.set(o.value, o));
        return [...byId.values()];
      });
      form.setFieldsValue({ learnerIds: merged });
      const added = merged.length - current.length;
      message.success(added ? `Added ${added} learner${added === 1 ? "" : "s"} from the class.` : "Everyone in that class is already selected.");
    } catch (error) {
      message.error(error?.message || "Could not add the class.");
    } finally {
      setAddingClass(false);
    }
  };
  return { addingClass, addWholeClass };
}

/**
 * "Split a class into teams": preview state, controls, preview card, outcome report and the
 * create call. The caller renders `controls` inside its Form (needs teamSize/teamOrder initial
 * values) and `previewCard` / `reportCard` below it.
 */
export function useProjectTeamSplit({ form, collegeId, organizationId, onAllCreated }) {
  const [teamPreview, setTeamPreview] = useState(null);
  // Fixed titles for the teams in the preview. Set only after a partial failure, when the preview is cut down to the
  // failed teams: their titles must stay what they were, not be renumbered from their new positions.
  const [retryTitles, setRetryTitles] = useState(null);
  const titleAt = (base, index) => (retryTitles && retryTitles[index]) || teamTitle(base, index);
  const [teamSeed, setTeamSeed] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [teamsReport, setTeamsReport] = useState(null);
  const teamOrder = Form.useWatch("teamOrder", form);
  const titleValue = Form.useWatch("title", form);

  const reset = () => { setTeamPreview(null); setTeamsReport(null); setRetryTitles(null); };

  const buildTeamPreview = async (seedOverride) => {
    const values = form.getFieldsValue(["classId", "teamSize", "teamOrder"]);
    if (!values.classId) { message.error("Pick a class to split into teams."); return; }
    setPreviewLoading(true);
    try {
      const result = await fetchWithErrorHandling(getLearnersByClass(values.classId));
      if (!result?.success) throw new Error(result?.message || "Could not load that class's learners.");
      const learners = rowsOf(result)
        .filter((l) => !(l?.isDeleted ?? l?.is_deleted) && !l?.suspendedAt && learnerIdOf(l) != null)
        .map((l) => ({
          id: learnerIdOf(l),
          rollNumber: l.rollNumber ?? l.roll_number ?? "",
          name: `${l.firstName ?? l.first_name ?? ""} ${l.lastName ?? l.last_name ?? ""}`.trim() || `Learner ${learnerIdOf(l)}`,
        }));
      if (!learners.length) { message.warning("That class has no active learners."); setTeamPreview(null); return; }
      setRetryTitles(null);
      setTeamPreview(splitIntoTeams(learners, values.teamSize || 5, { order: values.teamOrder || "roll", seed: seedOverride ?? teamSeed }));
    } catch (error) {
      message.error(error?.message || "Could not build the teams.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const createTeams = async (values) => {
    if (!teamPreview || !teamPreview.length) { message.error("Preview the teams first."); return; }
    if (teamPreview.some((team) => team.length === 0)) { message.error("One of the teams is empty; move someone into it or rebuild the preview."); return; }
    const payload = {
      collegeId: Number(collegeId),
      organizationId: organizationId ? Number(organizationId) : undefined,
      classId: Number(values.classId),
      templateId: Number(values.templateId),
      mentorId: values.mentorId ? Number(values.mentorId) : undefined,
      status: values.status,
      summary: values.summary,
      teams: teamPreview.map((team, index) => ({ title: titleAt(values.title, index), learnerIds: team.map((l) => l.id) })),
    };
    const confirmed = await new Promise((resolve) => Modal.confirm({
      title: `Create ${payload.teams.length} team workspace${payload.teams.length === 1 ? "" : "s"}?`,
      content: `${payload.teams.reduce((n, t) => n + t.learnerIds.length, 0)} learners. Each team gets its own workspace and team group, created one at a time, so one failure does not undo the others.`,
      okText: "Create teams",
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    }));
    if (!confirmed) return;
    const response = await createProjectTeams(payload);
    const data = response?.data?.data ?? response?.data ?? {};
    const created = Array.isArray(data.created) ? data.created : [];
    const failures = Array.isArray(data.failures) ? data.failures : [];
    setTeamsReport({ created, failures });
    if (failures.length) {
      // Pressing Create again used to resend every team and duplicate the ones that had succeeded (Projects audit R6-01).
      // Keep only the failed teams, with their original titles, so a retry creates exactly those.
      const failedTitles = new Set(failures.map((row) => String(row?.title || "").trim().toLowerCase()));
      const keep = payload.teams
        .map((team, index) => ({ team, index }))
        .filter(({ team }) => failedTitles.has(String(team.title).trim().toLowerCase()));
      setTeamPreview(keep.map(({ index }) => teamPreview[index]));
      setRetryTitles(keep.map(({ team }) => team.title));
      message.warning(`${created.length} team(s) created; ${failures.length} failed. The preview now holds only the failed teams, so Create retries just those.`);
      return;
    }
    setRetryTitles(null);
    message.success(`Created ${created.length} team workspace${created.length === 1 ? "" : "s"}.`);
    onAllCreated?.();
  };

  const controls = (
    <Space wrap align="end" style={{ marginBottom: 16 }}>
      <Form.Item name="teamSize" label="Learners per team" style={{ marginBottom: 0 }} rules={[{ required: true, message: "Team size is required" }]}>
        <InputNumber min={1} max={50} style={{ width: 140 }} />
      </Form.Item>
      <Form.Item name="teamOrder" label="Fill teams" style={{ marginBottom: 0 }}>
        <Radio.Group options={[{ value: "roll", label: "By roll number" }, { value: "random", label: "Randomly" }]} />
      </Form.Item>
      <Button onClick={() => buildTeamPreview()} loading={previewLoading}>Preview teams</Button>
      {teamPreview && teamOrder === "random" ? (
        <Button onClick={() => { const next = teamSeed + 1; setTeamSeed(next); buildTeamPreview(next); }}>Shuffle again</Button>
      ) : null}
    </Space>
  );

  const previewCard = teamPreview ? (
    <Card title={`Teams preview — ${teamPreview.length} teams, ${teamPreview.reduce((n, t) => n + t.length, 0)} learners`} style={{ marginTop: 16 }}>
      <Typography.Paragraph type="secondary">Team sizes differ by at most one. Move a learner with the selector next to their name; nothing is created until you press Create.</Typography.Paragraph>
      <div className="project-teams-preview">
        {teamPreview.map((team, index) => (
          <Card key={index} size="small" title={`${titleAt(titleValue || "Project", index)} (${team.length})`}>
            {team.length === 0 ? <Typography.Text type="warning">Empty team</Typography.Text> : null}
            {team.map((learner) => (
              <div key={learner.id} className="project-teams-preview__row">
                <span>{learner.name}{learner.rollNumber ? <Typography.Text type="secondary"> · {learner.rollNumber}</Typography.Text> : null}</span>
                <Select
                  size="small"
                  value={index}
                  style={{ width: 110 }}
                  aria-label={`Move ${learner.name} to another team`}
                  options={teamPreview.map((_, i) => ({ value: i, label: `Team ${i + 1}` }))}
                  onChange={(to) => setTeamPreview((current) => moveLearner(current, learner.id, to))}
                />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </Card>
  ) : null;

  const reportCard = teamsReport ? (
    <Card title="Team creation outcome" style={{ marginTop: 16 }}>
      {teamsReport.failures.length ? <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={`${teamsReport.failures.length} team(s) failed`} description="The created teams stay. The preview above now holds only the failed teams; fix the problem and press Create to retry them." /> : null}
      <Table size="small" pagination={false} rowKey={(row) => `${row.outcome}-${row.title}`}
        dataSource={[
          ...teamsReport.created.map((row) => ({ ...row, outcome: "Created" })),
          ...teamsReport.failures.map((row) => ({ ...row, outcome: "Failed" })),
        ]}
        columns={[
          { title: "Team", dataIndex: "title", key: "title" },
          { title: "Result", dataIndex: "outcome", key: "outcome", render: (v) => <Tag color={v === "Created" ? "green" : "red"}>{v}</Tag> },
          { title: "Learners / reason", key: "detail", render: (_, row) => (row.outcome === "Created" ? row.learnerCount : row.message) },
        ]} />
    </Card>
  ) : null;

  return { teamPreview, setTeamPreview, reset, createTeams, controls, previewCard, reportCard };
}

export const CREATE_MODES = [
  { value: "single", label: "One team" },
  { value: "teams", label: "Split a class into teams" },
  { value: "cohort", label: "One workspace per student" },
];

export const TEAMS_MODE_HELP = "Pick a class and a team size, preview the teams, move anyone between teams, then create. Each team gets its own workspace named after the title (“Title - Team 1”, “Title - Team 2”…), with the same template and mentor.";
