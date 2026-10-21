import React from "react";
import { Alert, Button, DatePicker, Empty, Form, Input, Popconfirm, Select, Spin, Tag } from "antd";
import { EyeOutlined, SwapOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

// "Activity" and "Comments" are both backed by the same ProjectTaskComment record — a status
// change (Move to review, Flag as blocked, Mark complete) posts one of these under the hood with
// a canned message, exactly like a human note does. The two sections below are a client-side
// split of that one stream by commentType: SYSTEM_EVENT_TYPES are only ever produced by the
// quick-action buttons (never offered as a choice in the human composer below), so — going
// forward — that's a reliable enough signal to tell "this happened automatically" apart from
// "someone wrote this." Existing rows created before this split still render correctly either way.
const SYSTEM_EVENT_TYPES = new Set(["STATUS_UPDATE", "REVIEW", "BLOCKED"]);

const SYSTEM_EVENT_META = {
  STATUS_UPDATE: { icon: <SwapOutlined />, label: "Status changed" },
  REVIEW: { icon: <EyeOutlined />, label: "Sent for review" },
  BLOCKED: { icon: <WarningOutlined />, label: "Flagged blocked" },
};

// Only types a person can meaningfully choose while writing their own note — status/review/
// blocked events are produced exclusively by the dedicated action buttons above, never picked
// from this dropdown, so the composer can't be used to fake a state change that never happened.
const HUMAN_COMMENT_TYPE_OPTIONS = [
  { value: "NOTE", label: "Note" },
  { value: "PROGRESS", label: "Progress update" },
  { value: "NEEDS_HELP", label: "Flag for mentor" },
];

const COMMENT_TYPE_OPTIONS = [
  ...HUMAN_COMMENT_TYPE_OPTIONS,
  { value: "REVIEW", label: "Review" },
  { value: "BLOCKED", label: "Blocker" },
  { value: "STATUS_UPDATE", label: "Status update" },
];

// Jackson serializes LocalDateTime as [year, month, day, hour, minute, second] rather than an
// ISO string, which dayjs() cannot parse directly (it silently produces an "Invalid Date").
const formatCommentTimestamp = (value) => {
  if (!value) return "";
  const parsed = Array.isArray(value)
    ? dayjs(new Date(value[0], (value[1] || 1) - 1, value[2] || 1, value[3] || 0, value[4] || 0, value[5] || 0))
    : dayjs(value);
  return parsed.isValid() ? parsed.format("MMM D, h:mm A") : "";
};

// Some legacy tasks carry a raw enum-style status (e.g. "TO_DO") instead of a lane name — map
// through the same keyword-based lookup the kanban board itself uses (taskLaneOf), so the
// displayed status always matches the board's real column label ("To Do" — see
// BOARD_LANE_LABEL.Backlog in ProjectDetailContent.jsx; "Backlog" stays the internal lane key,
// this modal only ever shows the label). This used to return "Backlog" to match the column's
// then-current header text; it wasn't updated when that header was renamed to "To Do", so this
// kicker tag was quietly calling the same status something different from every other surface
// on the same page.
const humanizeStatusLabel = (value) => {
  const status = String(value || "").toLowerCase();
  if (status.includes("todo") || status.includes("backlog") || status.includes("pending")) return "To Do";
  if (status.includes("progress") || status.includes("doing")) return "In Progress";
  if (status.includes("review") || status.includes("ready")) return "In Review";
  if (status.includes("block")) return "Blocked";
  if (status.includes("done") || status.includes("complete")) return "Completed";
  return "To Do";
};

// Same scheme-check ProjectDetailContent's own deliveryOpenUrl already applies before rendering
// a stored URL as a clickable href (MRMD-01) -- submissionUrl is equally a value someone else
// typed that ends up in an href, so it needs the same guard against javascript:/data: values.
const safeTaskUrl = (rawUrl) => {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl, typeof window !== "undefined" ? window.location.origin : undefined);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
};

const taskEstimateOptionsFor = (unit) => {
  const hours = String(unit || "POINTS").toUpperCase() === "HOURS";
  const values = hours ? [1, 2, 4, 8, 16, 24, 40] : [1, 2, 3, 5, 8, 13];
  return values.map((value) => ({ value, label: hours ? `${value} hr${value === 1 ? "" : "s"}` : `${value} pt${value === 1 ? "" : "s"}` }));
};

const TASK_TYPE_OPTIONS = [
  { value: "STORY", label: "Story" },
  { value: "BUG", label: "Bug" },
  { value: "CHORE", label: "Chore" },
  { value: "SPIKE", label: "Spike" },
];

const COMMENT_TYPE_TONE = {
  NOTE: "default",
  PROGRESS: "blue",
  NEEDS_HELP: "magenta",
  REVIEW: "gold",
  BLOCKED: "volcano",
  STATUS_UPDATE: "cyan",
};

function TaskDetailsModal({
  selectedTask,
  estimationUnit,
  dueState,
  taskComments,
  resolveMemberName,
  taskActivityFilter,
  setTaskActivityFilter,
  loadingTaskDetail,
  taskDetailLoadError,
  retryTaskDetail,
  // Audit fix: this was named `isMentor`, but the caller (ProjectDetailContent.jsx) has only
  // ever passed `canManageMentor` -- the properly-verified "is an active faculty member of THIS
  // project" check, not the looser "is on the /mentor route" one. Since no prop named `isMentor`
  // was ever actually passed, this was permanently undefined: every mentor opening a task saw
  // the read-only "Student view" branch below -- no edit form, no quick-action buttons, nothing.
  // Renamed to match what the caller actually sends, rather than adding a second, redundant prop.
  canManageMentor,
  taskCommentForm,
  handleSaveTaskComment,
  savingTaskComment,
  taskDetailEditForm,
  onTaskDetailFormChange,
  handleSaveTaskDetail,
  savingTaskDetailEdit,
  handleTaskStatusAction,
  statusActionLoading,
  taskAssigneeOptions,
  taskSprintOptions,
  taskStatusOptions,
  taskDetailId,
  handleRemoveTask,
  resetTaskDetail,
  currentUserId,
  onSubmitForReview,
  onLearnerStatusChange,
  submitForReviewLoading,
}) {
  // Must run before the early return below (rules of hooks — every render needs the same hook
  // calls in the same order, regardless of whether selectedTask is set yet).
  const editFormStatus = Form.useWatch("status", taskDetailEditForm);

  if (!selectedTask) return null;

  // Learner and faculty ids are separate sequences: a matching number alone could be a mentor's task (Projects audit R4-02).
  // createdByType is what the server checks before it allows the delete.
  const ownsTask =
    !canManageMentor && selectedTask.createdBy != null && currentUserId != null && String(selectedTask.createdBy) === String(currentUserId)
    && String(selectedTask.createdByType || "").toUpperCase() === "LEARNER";
  const assigneeType = String(selectedTask.assigneeType || "").toUpperCase();
  const assignedToALearner = !assigneeType || assigneeType === "LEARNER" || assigneeType === "STUDENT";
  // Audit fix: ownsTask means "I created this task" (used, correctly, only for the delete
  // permission -- mirrors the backend's own creator-only delete rule). It does NOT mean "this
  // task is assigned to me," which is the actually-relevant question for every other student
  // action on this page (submitting work, appearing in "My tasks," etc.) -- a student assigned a
  // MENTOR-created task (the normal case) has ownsTask === false and, before this fix, had
  // nothing at all to do in this modal: no submit action, nothing. isAssignee is that real check.
  const isAssignee =
    !canManageMentor && assignedToALearner && selectedTask.assigneeId != null && currentUserId != null && String(selectedTask.assigneeId) === String(currentUserId);
  // Resubmission is allowed from any pre-completed state (including re-submitting from In Review
  // with an updated link) -- once a mentor marks it Completed, that's the mentor's call to make,
  // not something a resubmission should be able to quietly reopen.
  const canSubmitForReview = isAssignee && String(selectedTask.status || "").toLowerCase() !== "completed";

  // addProjectTaskComment on the backend deliberately does NOT call requireTaskMutationAccess
  // (the ownership gate that protects title/status/assignee edits) — it only requires active
  // project membership, which is already the sole gate on reaching this modal at all (the board/
  // task-list read path itself requires active membership). Gating the comment box here to
  // mentor-or-assignee was stricter than what the backend actually allows or intends: any
  // teammate could open a task and comment server-side, but a non-assignee's box rendered
  // disabled here with no way to do it. This modal renders only for active project members, so
  // that alone is the correct and sufficient condition — same as the backend's own comment.
  const canComment = true;
  // The backend returns both streams ordered oldest-first (ORDER BY id ASC) — fine for a
  // discussion thread read top-to-bottom, wrong for a timeline whose job is "what happened most
  // recently." Reverse client-side so the newest event/comment is the first thing visible instead
  // of requiring a scroll to the bottom to find it.
  const allComments = Array.isArray(taskComments) ? [...taskComments].reverse() : [];
  const activityEvents = allComments.filter((comment) => SYSTEM_EVENT_TYPES.has(String(comment?.commentType || "").toUpperCase()));
  const discussionFilter = String(taskActivityFilter || "All").toUpperCase();
  const discussionComments = allComments
    .filter((comment) => !SYSTEM_EVENT_TYPES.has(String(comment?.commentType || "").toUpperCase()))
    .filter((comment) => discussionFilter === "ALL" || String(comment?.commentType || "").toUpperCase() === discussionFilter);

  const normalizedStatus = String(selectedTask.status || "To Do").toLowerCase();
  const learnerTaskIsBlocked = normalizedStatus.includes("block");
  const learnerTaskIsInReview = normalizedStatus.includes("review");
  const learnerTaskIsComplete = normalizedStatus.includes("done") || normalizedStatus.includes("complete") || normalizedStatus.includes("closed");
  const learnerTaskCanStart = isAssignee && !learnerTaskIsComplete && !learnerTaskIsInReview && !normalizedStatus.includes("progress") && !learnerTaskIsBlocked;
  const learnerTaskCanReportBlocker = isAssignee && !learnerTaskIsComplete && !learnerTaskIsInReview && !learnerTaskIsBlocked;
  const statusTone =
    normalizedStatus.includes("block")
      ? "volcano"
      : normalizedStatus.includes("review")
        ? "gold"
        : normalizedStatus.includes("done") || normalizedStatus.includes("complete")
          ? "green"
          : "blue";

  const priorityTone =
    String(selectedTask.priority || "Medium").toLowerCase() === "high"
      ? "volcano"
      : String(selectedTask.priority || "Medium").toLowerCase() === "medium"
        ? "gold"
        : "green";

  const dueText = selectedTask.dueLabel || selectedTask.due || "Not set";
  const estimateOptions = taskEstimateOptionsFor(estimationUnit);
  const estimateLabel = selectedTask.estimatePoints
    ? (String(estimationUnit || "POINTS").toUpperCase() === "HOURS" ? `${selectedTask.estimatePoints} hr${selectedTask.estimatePoints === 1 ? "" : "s"}` : `${selectedTask.estimatePoints} pt${selectedTask.estimatePoints === 1 ? "" : "s"}`)
    : null;

  return (
    <div className="learn-projects-detail__task-modal-shell">
      <div className="learn-projects-detail__task-modal-hero">
        <div className="learn-projects-detail__task-modal-kicker">
          <span>Task details</span>
          <Tag color={statusTone}>{humanizeStatusLabel(selectedTask.status)}</Tag>
        </div>
        <h3 className="learn-projects-detail__task-modal-title">{selectedTask.title || "Untitled task"}</h3>
        <p className="learn-projects-detail__task-modal-description">{selectedTask.description || "No description available."}</p>
        <div className="learn-projects-detail__tags">
          <Tag color={priorityTone}>{selectedTask.priority || "Medium"} priority</Tag>
          <Tag color={dueState === "overdue" ? "error" : dueState === "dueSoon" ? "warning" : "default"}>
            Due {dueText}
          </Tag>
          <Tag>{selectedTask.assigneeName ? `Assigned to ${selectedTask.assigneeName}` : "Unassigned"}</Tag>
          {selectedTask.sprintLabel ? <Tag color="cyan">Sprint: {selectedTask.sprintLabel}</Tag> : null}
          {/* Stage 3: read-only for everyone (learner and mentor) — sizing is set from the edit
              form below (mentor-only), but both roles should be able to see it at a glance. */}
          {selectedTask.estimatePoints ? (
            <Tag color="geekblue">{estimateLabel}</Tag>
          ) : null}
          {selectedTask.taskType && selectedTask.taskType !== "STORY" ? (
            <Tag>Type: {selectedTask.taskType.charAt(0) + selectedTask.taskType.slice(1).toLowerCase().replace(/_/g, " ")}</Tag>
          ) : null}
          {selectedTask.carriedOverFromSprintKey ? (
            <Tag color="orange">Carried over</Tag>
          ) : null}
          {/* Audit fix: removedFromTemplate (task either never came from the template, or the
              template was later edited/republished without it) had zero visual signal anywhere
              -- a mentor across several sections built from the same template had no way to tell
              "is this the official curriculum, or something extra" without comparing task lists
              by hand. */}
          {selectedTask.removedFromTemplate ? (
            <Tag color="purple" title="This task isn't in the template's current task list -- either added directly here, or removed from the template since this workspace was created.">
              Not in template
            </Tag>
          ) : null}
        </div>
        {/* Audit fix: createdBy/updatedBy/createdAt/updatedAt all exist on the task but were
            never shown anywhere -- unlike a sprint card, which already states "Started by X" /
            "Completed by X". A mentor had no way to tell who added a task or when, or whether it
            had been edited since. resolveMemberName can return null (e.g. the member has since
            left the project); each line only renders when it actually resolves to a name. */}
        {(resolveMemberName?.(selectedTask.createdBy) || resolveMemberName?.(selectedTask.updatedBy)) ? (
          <div className="learn-projects-detail__task-modal-attribution">
            {resolveMemberName?.(selectedTask.createdBy) ? (
              <span>
                Created by <strong>{resolveMemberName(selectedTask.createdBy)}</strong>
                {formatCommentTimestamp(selectedTask.createdAt) ? ` · ${formatCommentTimestamp(selectedTask.createdAt)}` : ""}
              </span>
            ) : null}
            {/* Only worth a second line when it actually adds information beyond "Created by" --
                otherwise a never-edited task would redundantly restate the same name and time. */}
            {/* createdAt/updatedAt may be Jackson's [year,month,day,...] array form (see
                formatCommentTimestamp above) -- comparing the raw values with !== would compare
                array references, not the instants they represent, and always be true for two
                distinct arrays even when they encode the same moment. Compare the formatted
                strings instead. */}
            {resolveMemberName?.(selectedTask.updatedBy) &&
            (String(selectedTask.updatedBy) !== String(selectedTask.createdBy) ||
              formatCommentTimestamp(selectedTask.updatedAt) !== formatCommentTimestamp(selectedTask.createdAt)) ? (
              <span>
                Last edited by <strong>{resolveMemberName(selectedTask.updatedBy)}</strong>
                {formatCommentTimestamp(selectedTask.updatedAt) ? ` · ${formatCommentTimestamp(selectedTask.updatedAt)}` : ""}
              </span>
            ) : null}
          </div>
        ) : null}
        {selectedTask.acceptanceCriteria ? (
          <div className="learn-projects-detail__task-modal-acceptance">
            <span className="learn-projects-detail__task-modal-acceptance-label">Done when</span>
            <p>{selectedTask.acceptanceCriteria}</p>
          </div>
        ) : null}
        {selectedTask.approach ? (
          <div className="learn-projects-detail__task-modal-acceptance">
            <span className="learn-projects-detail__task-modal-acceptance-label">Approach</span>
            <p>{selectedTask.approach}</p>
          </div>
        ) : null}
        {selectedTask.blockerReason ? (
          <Alert
            type="warning"
            showIcon
            message="Blocked"
            description={selectedTask.blockerReason}
            className="learn-projects-detail__task-modal-blocker-alert"
          />
        ) : null}
        {/* Per-task submission: visible to the whole team, same transparency Board already gives
            everyone about everyone's status -- not hidden to just the assignee and mentor. */}
        {selectedTask.submissionUrl ? (
          <div className="learn-projects-detail__task-modal-acceptance">
            <span className="learn-projects-detail__task-modal-acceptance-label">Submission</span>
            <p>
              <a href={safeTaskUrl(selectedTask.submissionUrl) || "#"} target="_blank" rel="noopener noreferrer" style={{ overflowWrap: "anywhere" }}>
                {selectedTask.submissionUrl}
              </a>
              {resolveMemberName?.(selectedTask.submittedBy) ? (
                <span className="learn-projects-detail__muted"> · submitted by {resolveMemberName(selectedTask.submittedBy)}</span>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>

      {canManageMentor ? (
        <div className="learn-projects-detail__task-modal-panel">
          <div className="learn-projects-detail__task-modal-section-header">
            <div>
              <p className="learn-projects-detail__task-modal-section-title">Task actions</p>
              <p className="learn-projects-detail__task-modal-section-note">Change task state or remove it from the board.</p>
            </div>
          </div>
          <div className="learn-projects-detail__task-modal-actions">
            <Button
              size="small"
              loading={statusActionLoading}
              disabled={statusActionLoading}
              onClick={() => handleTaskStatusAction("In Progress", "Moved task to In Progress.", "STATUS_UPDATE")}
            >
              Move to in progress
            </Button>
            <Button
              size="small"
              loading={statusActionLoading}
              disabled={statusActionLoading}
              onClick={() => handleTaskStatusAction("In Review", "Moved task to review.", "REVIEW")}
            >
              Move to review
            </Button>
            <Button
              size="small"
              loading={statusActionLoading}
              disabled={statusActionLoading}
              onClick={() => handleTaskStatusAction("Blocked", "Task has been flagged for attention.", "BLOCKED")}
            >
              Flag as blocked
            </Button>
            <Button
              size="small"
              loading={statusActionLoading}
              disabled={statusActionLoading}
              onClick={() => handleTaskStatusAction("Done", "Marked task as done.", "STATUS_UPDATE")}
            >
              Mark complete
            </Button>
            <Popconfirm
              title="Delete this task?"
              description="This permanently removes the task from the project board. It cannot be undone."
              onConfirm={async () => {
                // MST-01: gating on selectedTask?.id silently no-op'd for a virtual/template-only
                // task (no materialized numeric id yet, only a taskKey) — the Popconfirm appeared
                // to work but nothing happened. taskDetailId is already resolved upstream (see
                // openTaskDetail) via the same id-or-taskKey fallback the backend's
                // resolveOrMaterializeProjectTask uses, so it is the correct thing to guard on.
                if (taskDetailId) {
                  await handleRemoveTask(taskDetailId);
                  resetTaskDetail();
                }
              }}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger disabled={statusActionLoading}>
                Delete
              </Button>
            </Popconfirm>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div className="learn-projects-detail__task-modal-section-header">
              <div>
                <p className="learn-projects-detail__task-modal-section-title">Edit task</p>
                <p className="learn-projects-detail__task-modal-section-note">Update title, assignment, sprint, and status.</p>
              </div>
            </div>
            <Form layout="vertical" form={taskDetailEditForm} onFinish={handleSaveTaskDetail} onValuesChange={onTaskDetailFormChange}>
              <div className="learn-projects-detail__grid">
                {/* MST-02/MST-03: matches the backend's PROJECT_TASK_TITLE_MAX_LENGTH — without
                    this, an over-length title threw a raw DB error surfaced as a misleading
                    "someone else changed this" 409 conflict. */}
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[
                    { required: true, message: "Task title is required" },
                    { max: 200, message: "Task title must be 200 characters or fewer" },
                  ]}
                >
                  <Input placeholder="Task title" maxLength={200} showCount />
                </Form.Item>
                <Form.Item label="Status" name="status" rules={[{ required: true, message: "Status is required" }]}>
                  <Select options={taskStatusOptions} />
                </Form.Item>
                <Form.Item label="Priority" name="priority" rules={[{ required: true, message: "Priority is required" }]}>
                  <Select
                    options={[
                      { value: "Low", label: "Low" },
                      { value: "Medium", label: "Medium" },
                      { value: "High", label: "High" },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Assignee" name="assigneeId">
                  <Select allowClear placeholder="Assign to a team member" options={taskAssigneeOptions} />
                </Form.Item>
                <Form.Item label="Sprint" name="sprintKey">
                  <Select allowClear placeholder="Leave blank for the backlog" options={taskSprintOptions} />
                </Form.Item>
                <Form.Item label="Due" name="due">
                  <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Estimate" name="estimatePoints" tooltip="Relative size, not a time guess.">
                  <Select allowClear placeholder="Not yet estimated" options={estimateOptions} />
                </Form.Item>
                <Form.Item label="Type" name="taskType">
                  <Select options={TASK_TYPE_OPTIONS} />
                </Form.Item>
              </div>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} placeholder="Task description" />
              </Form.Item>
              <Form.Item
                label="Done when (optional)"
                name="acceptanceCriteria"
                tooltip="The concrete condition that makes this task finished — not a restatement of the description."
              >
                <Input.TextArea rows={2} placeholder="e.g. Form submits and shows a confirmation screen" />
              </Form.Item>
              <Form.Item
                label="Approach (optional)"
                name="approach"
                tooltip="The worked, how-to-do-this guidance for this task."
              >
                <Input.TextArea rows={3} placeholder="How to actually go about this task" />
              </Form.Item>
              {editFormStatus === "Blocked" ? (
                // Only shown while Status is actually Blocked — this form's Save button calls
                // handleSaveTaskDetail directly (not through handleTaskStatusAction), so it never
                // went through the blocker-reason prompt used by the quick-action buttons and the
                // board's drag-and-drop. Flipping Status to Blocked here and saving with this
                // field empty hit the backend's hard validation error with no way to fix it
                // in-place. Requiring it right here, in the same form as the Status field that
                // triggers it, catches that before the request ever goes out.
                <Form.Item
                  label="Blocker note"
                  name="blockerReason"
                  rules={[{ required: true, whitespace: true, message: "A reason is required while this task is marked Blocked" }]}
                >
                  <Input.TextArea rows={3} placeholder="Describe what is blocking progress" />
                </Form.Item>
              ) : null}
              <Button type="primary" htmlType="submit" loading={savingTaskDetailEdit} block>
                Save changes
              </Button>
            </Form>
          </div>
        </div>
      ) : (
        <div className="learn-projects-detail__task-modal-panel">
          <div className="learn-projects-detail__task-modal-section-header">
            <div>
              <p className="learn-projects-detail__task-modal-section-title">{isAssignee ? "Your work" : "Task access"}</p>
              <p className="learn-projects-detail__task-modal-section-note">
                {isAssignee
                  ? learnerTaskIsInReview
                    ? "Your work is with the mentor for review. You can still update the submission if needed."
                    : learnerTaskIsBlocked
                      ? "This task is blocked. Resume it when the blocker is cleared, or keep the team updated in comments."
                      : "This task is assigned to you. Keep its status current and submit your work when it is ready."
                  : ownsTask
                    ? "You created this task, so you can remove it if it is no longer needed."
                    : "You can follow this team task and contribute comments, but only its assignee can change progress."}
              </p>
            </div>
            <Tag color="cyan">{isAssignee ? "Assigned to you" : ownsTask ? "Created by you" : "Team task"}</Tag>
          </div>
          <p className="learn-projects-detail__task-modal-note">
            Everyone on the project can add notes, progress updates, or requests for help in Comments below.
            {isAssignee ? " As the assignee, you can also update this task's working state here." : ""}
          </p>
          {isAssignee || ownsTask ? (
            <div className="learn-projects-detail__task-modal-actions">
              {learnerTaskCanStart ? (
                <Button size="small" loading={statusActionLoading} disabled={statusActionLoading} onClick={() => onLearnerStatusChange?.("In Progress")}>
                  Start work
                </Button>
              ) : null}
              {isAssignee && learnerTaskIsBlocked ? (
                <Button size="small" loading={statusActionLoading} disabled={statusActionLoading} onClick={() => onLearnerStatusChange?.("In Progress")}>
                  Blocker resolved
                </Button>
              ) : null}
              {learnerTaskCanReportBlocker ? (
                <Button size="small" loading={statusActionLoading} disabled={statusActionLoading} onClick={() => onLearnerStatusChange?.("Blocked")}>
                  I’m blocked
                </Button>
              ) : null}
              {/* Audit fix: a student ASSIGNED a mentor-created task (the normal case -- ownsTask
                  only covers tasks the student made themselves) previously had zero actions
                  available here, including no way to submit their work at all except by dragging
                  the card on Board -- which locks out touch/mobile and anyone who doesn't think to
                  drag. Same accessible-fallback reasoning as the mentor's reassign Select. */}
              {canSubmitForReview ? (
                <Button type="primary" size="small" loading={submitForReviewLoading} onClick={onSubmitForReview}>
                  {learnerTaskIsInReview ? "Resubmit for review" : "Submit for review"}
                </Button>
              ) : null}
              {ownsTask ? (
                <Popconfirm
                  title="Delete this task?"
                  description="This permanently removes the task from the project board. It cannot be undone."
                  onConfirm={async () => {
                    // MST-01: see the other Delete Popconfirm above — gate on taskDetailId (already
                    // resolved upstream via id-or-taskKey), not selectedTask?.id, so a virtual/
                    // template-only task can actually be deleted.
                    if (taskDetailId) {
                      await handleRemoveTask(taskDetailId);
                      resetTaskDetail();
                    }
                  }}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger>
                    Delete task
                  </Button>
                </Popconfirm>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {taskDetailLoadError ? (
        <Alert
          type="warning"
          showIcon
          message="Task history unavailable"
          description={taskDetailLoadError}
          action={<Button size="small" onClick={retryTaskDetail}>Retry history</Button>}
        />
      ) : null}

      <div className="learn-projects-detail__task-modal-panel">
        <div className="learn-projects-detail__task-modal-section-header">
          <div>
            <p className="learn-projects-detail__task-modal-section-title">Activity</p>
            <p className="learn-projects-detail__task-modal-section-note">
              Automatic record of status changes on this task — logged by the buttons above, not something anyone writes.
            </p>
          </div>
        </div>
        <Spin spinning={Boolean(loadingTaskDetail)}>
          {taskDetailLoadError ? null : activityEvents.length === 0 ? (
            <Empty description="No status changes yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="learn-projects-detail__task-modal-activity-list" style={{ maxHeight: 320, overflowY: "auto" }}>
              {activityEvents.map((event) => {
                const meta = SYSTEM_EVENT_META[String(event.commentType || "").toUpperCase()] || SYSTEM_EVENT_META.STATUS_UPDATE;
                return (
                  <div key={event.id ?? `${event.commenterId}-${event.createdAt}`} className="learn-projects-detail__task-modal-activity-item">
                    <span className="learn-projects-detail__task-modal-activity-icon">{meta.icon}</span>
                    <span className="learn-projects-detail__task-modal-activity-text">
                      <strong>{event.commenterName || "Someone"}</strong> {event.message || meta.label}
                    </span>
                    <span className="learn-projects-detail__task-modal-activity-time">{formatCommentTimestamp(event.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Spin>
      </div>

      <div className="learn-projects-detail__task-modal-panel">
        <div className="learn-projects-detail__task-modal-section-header">
          <div>
            <p className="learn-projects-detail__task-modal-section-title">Comments</p>
            <p className="learn-projects-detail__task-modal-section-note">Notes and progress updates people on this task have written.</p>
          </div>
          <Select
            size="small"
            value={taskActivityFilter || "All"}
            onChange={setTaskActivityFilter}
            style={{ minWidth: 160 }}
            options={[{ value: "All", label: "All comments" }, ...HUMAN_COMMENT_TYPE_OPTIONS]}
          />
        </div>

        <Spin spinning={Boolean(loadingTaskDetail)}>
          {taskDetailLoadError ? null : discussionComments.length === 0 ? (
            <Empty description="No comments yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: "grid", gap: 10, maxHeight: 320, overflowY: "auto" }}>
              {discussionComments.map((comment) => (
                <div key={comment.id ?? `${comment.commenterId}-${comment.createdAt}`} className="learn-projects-detail__task-modal-comment">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong className="learn-projects-detail__task-modal-comment-name">{comment.commenterName || "Unknown"}</strong>
                      <Tag color={COMMENT_TYPE_TONE[comment.commentType] || "default"}>
                        {(COMMENT_TYPE_OPTIONS.find((opt) => opt.value === comment.commentType) || {}).label || comment.commentType || "Note"}
                      </Tag>
                    </div>
                    <span className="learn-projects-detail__task-modal-comment-time">
                      {formatCommentTimestamp(comment.createdAt)}
                    </span>
                  </div>
                  {comment.message ? <p className="learn-projects-detail__task-modal-comment-body">{comment.message}</p> : null}
                </div>
              ))}
            </div>
          )}
        </Spin>

        {canComment ? (
          <Form layout="vertical" form={taskCommentForm} onFinish={handleSaveTaskComment} initialValues={{ commentType: "NOTE" }} disabled={Boolean(taskDetailLoadError)}>
            <Form.Item label="Type" name="commentType">
              <Select options={HUMAN_COMMENT_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item label="Message" name="message" rules={[{ required: true, message: "Add a note before posting" }]}>
              <Input.TextArea rows={3} placeholder="Share a progress update or note..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={savingTaskComment}>
              Post comment
            </Button>
          </Form>
        ) : null}
      </div>
    </div>
  );
}

export default TaskDetailsModal;
