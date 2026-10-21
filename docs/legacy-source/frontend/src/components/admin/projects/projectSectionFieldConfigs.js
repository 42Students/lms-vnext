// Field configs for RepeatingItemEditor, shared across template create/edit and workspace edit
// so a sprint/task/resource row looks and behaves the same everywhere it's authored. Field
// names match what the backend's template-materialization code actually reads (see
// applyResourcePayload/materializeTaskFromTemplate/normalizeSectionRows in
// ProjectWorkspaceServiceImpl.java) — canonical name first, with the backend's own alias
// fallbacks (e.g. "sprintId"/"sprint" for a task's sprintKey) not needed here since we
// always write the canonical field.
//
// `half: true` renders the field at half-row width (paired two-per-row) instead of full width —
// used for short fields so the row doesn't waste horizontal space on a one-word value.
// `previewFrom: "title"` shows a live "will be saved as: <slug>" hint under a blank key field,
// mirroring the backend's own auto-key-from-title behavior so the admin isn't guessing.

// These are sprints in the label and in the wire contract alike. There used to be a split here —
// the UI said "Sprint" while the field names, the API and the database all said "milestone" — and
// this comment used to explain which half was which. V141/V142/V143 removed the split entirely
// (see the note on ProjectSprint.java), so field names and labels now agree and no translation
// is needed in either direction.
//
// No start/end date fields here on purpose: a template is instantiated into many projects, each
// starting on a different day, so literal dates authored at the template level would be wrong for
// every project but one. A newly-materialized sprint's dates are computed from the project's own
// start date and cadence instead — see loadProjectSprints/toSprintDtoFromRow in
// ProjectWorkspaceServiceImpl.java. A mentor sets explicit dates per-project, in the workspace's
// own sprint editor, once the project actually exists.
export const SPRINT_FIELDS = [
  { name: "key", label: "Key (optional)", type: "text", half: true, previewFrom: "title", placeholder: "Auto-generated from title if left blank" },
  { name: "dueLabel", label: "Due (optional)", type: "text", half: true, placeholder: "e.g. Week 2" },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Kickoff & planning" },
  {
    name: "goal",
    label: "Sprint goal (optional)",
    type: "text",
    placeholder: "One sentence: what this sprint is trying to achieve",
  },
  // V173: a sprint always ships in a release now — releases stopped being an optional grouping
  // (both fields below used to be a single optional "Release" free-text field; every sprint left
  // it blank until the release ladder needed for anything downstream — for example
  // seedReleasesFromTemplate deriving a project's real release ladder from exactly these two
  // fields on save — simply didn't exist). `releaseKey` is the short id that GROUPS sprints
  // shipping in the same release (seedReleasesFromTemplate creates one real release per distinct
  // key); only the first sprint carrying a given key needs to also set `releaseLabel` — every
  // later sprint sharing that key can leave it blank and the release still gets a real title.
  {
    name: "releaseKey",
    label: "Release key",
    type: "text",
    half: true,
    required: true,
    placeholder: "Shared by every sprint that ships together, e.g. release-4",
  },
  {
    name: "releaseLabel",
    label: "Release title (optional)",
    type: "text",
    half: true,
    placeholder: "Set once, on the first sprint carrying this key — e.g. Release 4.0 — Automated decisions",
  },
  // ML-2: this field IS authored here, but until now it was never rendered on the mentor or
  // student sprint cards and had no input in the mentor's own workspace form — so whatever an
  // admin wrote here was invisible to everyone who needed it. Both are fixed in
  // ProjectDetailContent; the label is sharpened here to match, so the three surfaces agree on
  // what this field is FOR: the acceptance criteria, not a general description.
  {
    name: "description",
    label: "What does done look like?",
    type: "textarea",
    placeholder: "Acceptance criteria — e.g. API returns paginated results and integration tests pass",
  },
];

// A workspace already has real ProjectRelease rows to pick from (created by a mentor, or seeded
// from the template — see seedReleasesFromTemplate) — unlike a template, which has no releases
// of its own yet, only whatever key/title a sprint row states inline (see SPRINT_FIELDS'
// releaseKey/releaseLabel comment). `releaseKey` swaps from a free-text id to a picker (so a typo
// can't silently fail to resolve, the way it could in a template with no existing release to
// typo against); `releaseLabel` is dropped entirely — the real release this now points at
// already carries its own title, so a second, redundant title on the sprint row itself would
// only ever go stale. College-admin's and super-admin's workspace Sprints pages pass this (with
// `dynamicOptions={{ releaseKey: <options from the workspace's real releases> }}`) instead of
// SPRINT_FIELDS.
export const WORKSPACE_SPRINT_FIELDS = SPRINT_FIELDS
  .filter((field) => field.name !== "releaseLabel")
  .map((field) =>
    field.name === "releaseKey"
      ? { ...field, type: "select", half: false, placeholder: "Pick the release this sprint ships in", options: [] }
      : field
  );

export const TASK_FIELDS = [
  { name: "key", label: "Key (optional)", type: "text", half: true, previewFrom: "title", placeholder: "Auto-generated from title if left blank" },
  { name: "priority", label: "Priority", type: "select", half: true, options: [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ] },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Draft submission checklist" },
  {
    name: "sprintKey",
    label: "Sprint",
    type: "select",
    half: true,
    placeholder: "Link to a sprint above (leave blank for the backlog)",
    options: [],
  },
  // Story points, Fibonacci — set once per project as the estimation unit; a fixed scale (rather
  // than a free-text number) is what makes relative sizing teachable instead of just a guess.
  {
    name: "estimatePoints",
    label: "Estimate (optional)",
    type: "select",
    half: true,
    placeholder: "Not yet estimated",
    options: [1, 2, 3, 5, 8, 13].map((points) => ({ value: String(points), label: `${points} pt${points === 1 ? "" : "s"}` })),
  },
  {
    name: "taskType",
    label: "Type",
    type: "select",
    half: true,
    options: [
      { value: "STORY", label: "Story" },
      { value: "BUG", label: "Bug" },
      { value: "CHORE", label: "Chore" },
      { value: "SPIKE", label: "Spike" },
    ],
  },
  { name: "dueLabel", label: "Due (optional)", type: "text", half: true, placeholder: "e.g. Before sprint 1" },
  { name: "description", label: "Description", type: "textarea", placeholder: "What this task involves" },
  {
    name: "acceptanceCriteria",
    label: "Done when (optional)",
    type: "textarea",
    placeholder: "The concrete condition that makes this task finished — not a restatement of the description",
  },
  {
    name: "approach",
    label: "Approach (optional)",
    type: "textarea",
    placeholder: "The worked, how-to-do-this guidance for this task",
  },
];

export const RESOURCE_FIELDS = [
  { name: "key", label: "Key (optional)", type: "text", half: true, previewFrom: "title", placeholder: "Auto-generated from title if left blank" },
  {
    name: "type",
    label: "Type",
    type: "select",
    half: true,
    options: [
      { value: "Link", label: "Link" },
      { value: "PDF", label: "PDF" },
      { value: "DOC", label: "Document" },
      { value: "PPT", label: "Slides" },
      { value: "Video", label: "Video" },
      { value: "File", label: "File" },
    ],
  },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Project brief" },
  { name: "url", label: "URL (for a Link)", type: "text", half: true, placeholder: "https://..." },
  { name: "accessNotes", label: "Access notes (optional)", type: "text", half: true, placeholder: "e.g. Requires college email to view" },
  { name: "description", label: "Description", type: "textarea", placeholder: "What this resource is for" },
  { name: "isPinned", label: "Pinned", type: "checkbox", half: true },
  { name: "isRequired", label: "Required", type: "checkbox", half: true },
];

// Mirrors ProjectMeetingDTO (backend) — only the fields an admin would plausibly bulk-correct are
// exposed here. "meetingStatus" is the field the read path (meetingSnapshotMap) treats as
// authoritative and the write path (applyMeetingPayload) reads first, ahead of its "status" alias,
// so this config edits "meetingStatus" rather than "status" even though the backend accepts either.
// Plumbing-only fields (id, projectId, sortOrder, actionItems, history, createdBy/updatedBy,
// version, calendarSyncStatus/Error, followUpAt/Status/Notes) are intentionally left out — they're
// either read-only audit trail, nested lists out of scope for a flat row editor, or not meant for
// bulk admin editing.
export const MEETING_FIELDS = [
  { name: "key", label: "Key (optional)", type: "text", half: true, previewFrom: "title", placeholder: "Auto-generated from title if left blank" },
  {
    name: "meetingStatus",
    label: "Status",
    type: "select",
    half: true,
    options: [
      { value: "SCHEDULED", label: "Scheduled" },
      { value: "RESCHEDULED", label: "Rescheduled" },
      { value: "COMPLETED", label: "Completed" },
      { value: "CANCELLED", label: "Cancelled" },
      { value: "DRAFT", label: "Draft" },
      { value: "REQUESTED", label: "Requested" },
    ],
  },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Weekly sync" },
  {
    name: "meetingType",
    label: "Ceremony (optional)",
    type: "select",
    half: true,
    placeholder: "General",
    options: [
      { value: "GENERAL", label: "General" },
      { value: "PLANNING", label: "Sprint planning" },
      { value: "STANDUP", label: "Standup" },
      { value: "REVIEW", label: "Sprint review" },
      { value: "RETRO", label: "Retrospective" },
    ],
  },
  { name: "meetingDate", label: "Date", type: "text", half: true, placeholder: "YYYY-MM-DD" },
  { name: "startTime", label: "Start time (optional)", type: "text", half: true, placeholder: "HH:MM (24h)" },
  { name: "endTime", label: "End time (optional)", type: "text", half: true, placeholder: "HH:MM (24h)" },
  { name: "meetingUrl", label: "Meeting URL (optional)", type: "text", half: true, placeholder: "https://..." },
  { name: "linkedSprintKey", label: "Linked sprint (optional)", type: "select", half: true, placeholder: "Link to a sprint above", options: [] },
  { name: "linkedTaskKey", label: "Linked task (optional)", type: "select", half: true, placeholder: "Link to a task above", options: [] },
  { name: "agenda", label: "Agenda (optional)", type: "textarea", placeholder: "What this meeting covers" },
  { name: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Meeting notes" },
];

// Keyless sprints need an identity that survives a title rename and never collides with
// another keyless sprint with the same title — `sprintKeyRemap` below used to key off the
// raw title, so two blank-key sprints titled e.g. "Kickoff" collided (a task linked to the
// first got silently repointed to whichever was processed last), and renaming a keyless
// sprint's title after a task was already linked to it left the task's stored sprintKey
// pointing at the now-stale old title, which materializeSectionKeys then nulled out since the old
// title was absent from the recomputed remap. `_clientId` is a stable synthetic id assigned once,
// the first time a sprint row shows up with none yet (mirrors the `_clientId` convention used
// for client-only stable ids elsewhere in the Projects admin code — see ProjectDetailContent.jsx),
// and is used as the sprint's linking identity instead of its mutable title. Call this from an
// effect watching the live `sprints` field so a freshly-added row gets stamped before anything
// can link to it.
let clientIdCounter = 0;
function stampClientIds(rows, prefix) {
  if (!Array.isArray(rows) || !rows.length) return rows;
  let changed = false;
  const next = rows.map((row) => {
    if (row?._clientId) return row;
    changed = true;
    clientIdCounter += 1;
    return { ...row, _clientId: `${prefix}-client-${Date.now()}-${clientIdCounter}` };
  });
  return changed ? next : rows;
}

export function stampSprintClientIds(sprints) {
  return stampClientIds(sprints, "sprint");
}

// Tasks are the other row type something points at (a meeting's `linkedTaskKey`) and so are
// exposed to the same bug — but they are deliberately NOT stamped, because nothing would consume
// it: no form edits tasks and meetings together (the page split put them on separate screens), and
// the meetings pages read tasks back from a saved workspace/template where every task already has
// a real key, so the keyless fallback never fires. A stamping effect on the tasks pages would be
// three no-ops.
//
// What IS kept consistent is the precedence — `key`, then `_clientId`, then title — in both
// materializeSectionKeys' task branch and taskSelectOptions. If a form ever edits tasks and
// meetings together again, stamping tasks here (`stampClientIds(tasks, "task")`) is the only
// change needed; the rest already behaves.

export const titleOfSprintOrTask = (row) => row?.title;
export const titleOfResource = (row) => row?.title;
export const titleOfMeeting = (row) => row?.title;

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// A blank Key field previews as "Will be saved as: <slug>" (see RepeatingItemEditor's
// slugifyPreview), and the Sprint picker on a Task row falls back to showing/using the
// sprint's raw title as its option value when the Key is blank — but until now neither of
// those was ever actually written into the submitted payload. The backend independently
// auto-generates its own key for a blank one (`sprint-{index}-{title}`), which never matches
// the title-based value the Task's sprintKey held — so the link silently never resolves and
// the sprint's task count stays 0 forever, even though the UI looked correctly linked.
//
// This assigns the real key up front, client-side, exactly once at submit time, and rewrites any
// task's sprintKey that was pointing at the old fallback value to point at the real one — so
// what's submitted is self-consistent and the preview text becomes true rather than aspirational.
export function materializeSectionKeys(sprints, tasks, resources, meetings) {
  // Seed a key set with every key explicitly present in the list, BEFORE any key is generated.
  // Without this pass an explicit key is only registered when its own row is reached, so a keyless
  // row earlier in the list could be handed a key a later row already owns —
  // [{title:"Kickoff"}, {key:"kickoff"}] produced "kickoff" twice, and the duplicate then collided
  // on the (project_id, key) unique constraint or silently attached to the wrong row.
  const seedExplicitKeys = (rows) => {
    const used = new Set();
    for (const row of Array.isArray(rows) ? rows : []) {
      const explicit = String(row?.key || "").trim();
      if (explicit) used.add(explicit);
    }
    return used;
  };

  const keyFor = (usedKeys, title, prefix, index) => {
    const base = slugify(title) || `${prefix}-${index + 1}`;
    let key = base;
    let suffix = 2;
    while (usedKeys.has(key)) {
      key = `${base}-${suffix}`;
      suffix += 1;
    }
    usedKeys.add(key);
    return key;
  };

  const sprintKeys = seedExplicitKeys(sprints);
  const sprintKeyRemap = new Map(); // old fallback value (title/blank) -> new real key
  const materializedSprints = (Array.isArray(sprints) ? sprints : []).map((sprint, index) => {
    const existingKey = String(sprint?.key || "").trim();
    // `_clientId` (stable, assigned once at row creation — see stampSprintClientIds) takes
    // priority over the mutable title so a rename or a title collision between two keyless
    // sprints can't corrupt an already-made link. Title is only a last-resort fallback for
    // sprints stamped before this convention existed.
    const fallbackValue = existingKey || sprint?._clientId || sprint?.title || `sprint-${index + 1}`;
    const finalKey = existingKey || keyFor(sprintKeys, sprint?.title, "sprint", index);
    if (existingKey) sprintKeys.add(existingKey);
    sprintKeyRemap.set(fallbackValue, finalKey);
    const { _clientId, ...rest } = sprint || {};
    return { ...rest, key: finalKey };
  });

  const taskKeys = seedExplicitKeys(tasks);
  const taskKeyRemap = new Map(); // old fallback value (title/blank) -> new real key
  const materializedTasks = (Array.isArray(tasks) ? tasks : []).map((task, index) => {
    const existingKey = String(task?.key || "").trim();
    // Same identity precedence as sprints: the stable _clientId beats the mutable title, so a
    // rename cannot move a task's identity out from under a meeting already linked to it.
    const fallbackValue = existingKey || task?._clientId || task?.title || `task-${index + 1}`;
    const finalKey = existingKey || keyFor(taskKeys, task?.title, "task", index);
    if (existingKey) taskKeys.add(existingKey);
    taskKeyRemap.set(fallbackValue, finalKey);
    let sprintKey =
      task?.sprintKey && sprintKeyRemap.has(task.sprintKey) ? sprintKeyRemap.get(task.sprintKey) : task?.sprintKey;
    // Clear a task's sprintKey if it doesn't resolve to any currently-live sprint. This
    // matters in the template create/edit editor, which is client-side only until save: deleting
    // a sprint row there does nothing on its own to tasks that referenced its key, so a stale
    // sprintKey would otherwise silently survive into the saved template JSON. In workspace
    // edit the backend already cascades this cleanup on delete, so every task's sprintKey
    // should already be live there — making this check a harmless no-op in that flow.
    if (sprintKey && !sprintKeys.has(sprintKey)) sprintKey = null;
    // Strip `_clientId` the way the sprint branch does — it's a client-only linking identity and
    // has no business in the submitted payload.
    const { _clientId, ...taskRest } = task || {};
    return { ...taskRest, key: finalKey, sprintKey };
  });

  const resourceKeys = seedExplicitKeys(resources);
  const materializedResources = (Array.isArray(resources) ? resources : []).map((resource, index) => {
    const existingKey = String(resource?.key || "").trim();
    const finalKey = existingKey || keyFor(resourceKeys, resource?.title, "resource", index);
    if (existingKey) resourceKeys.add(existingKey);
    return { ...resource, key: finalKey };
  });

  // Same key-materialization + reference-remap treatment as tasks' sprintKey above, applied to
  // a meeting's linkedSprintKey/linkedTaskKey — without it a meeting linked to a sprint/task
  // that only just got its real key assigned in this same submit would point at the stale
  // fallback value (blank key or raw title) and silently fail to resolve.
  const meetingKeys = seedExplicitKeys(meetings);
  const materializedMeetings = (Array.isArray(meetings) ? meetings : []).map((meeting, index) => {
    const existingKey = String(meeting?.key || "").trim();
    const finalKey = existingKey || keyFor(meetingKeys, meeting?.title, "meeting", index);
    if (existingKey) meetingKeys.add(existingKey);
    let linkedSprintKey =
      meeting?.linkedSprintKey && sprintKeyRemap.has(meeting.linkedSprintKey)
        ? sprintKeyRemap.get(meeting.linkedSprintKey)
        : meeting?.linkedSprintKey;
    if (linkedSprintKey && !sprintKeys.has(linkedSprintKey)) linkedSprintKey = null;
    let linkedTaskKey =
      meeting?.linkedTaskKey && taskKeyRemap.has(meeting.linkedTaskKey) ? taskKeyRemap.get(meeting.linkedTaskKey) : meeting?.linkedTaskKey;
    if (linkedTaskKey && !taskKeys.has(linkedTaskKey)) linkedTaskKey = null;
    return { ...meeting, key: finalKey, linkedSprintKey, linkedTaskKey };
  });

  return {
    sprints: materializedSprints,
    tasks: materializedTasks,
    resources: materializedResources,
    meetings: materializedMeetings,
  };
}

// Label for a row in the Sprint / Linked-task dropdowns.
//
// The option's *value* is the row's linking identity, which for a row that has no key yet is the
// synthetic `_clientId` — a string like "sprint-client-1757240000000-3". Showing that as the label
// (the old rule just prefixed the value to the title whenever the two differed) put an internal id
// in front of the admin, which is both meaningless and alarming. So the id is only ever a value,
// never something to read: label with the real key when there is one, and with the title alone
// while the key is still pending.
const optionLabel = (value, title, explicitKey) => {
  if (!explicitKey) return title || value;
  return title && title !== explicitKey ? `${explicitKey} — ${title}` : explicitKey;
};

// Builds the { sprintKey: Option[] } map for TASK_FIELDS' "Sprint" select from the live
// `sprints` field value in the same Form — a sprint without a key yet (blank, still
// auto-generating) falls back to its title so it's still selectable/identifiable before the key
// is known; falls back to the row's index as a last resort so no sprint silently disappears
// from the dropdown for lacking both.
export const sprintSelectOptions = (sprints) =>
  (Array.isArray(sprints) ? sprints : [])
    .map((sprint, index) => {
      const title = sprint?.title;
      // Same identity precedence as materializeSectionKeys' fallbackValue above — _clientId
      // before title — so a task linked via this dropdown keeps pointing at the same sprint
      // across a title rename instead of silently detaching at save time.
      const key = sprint?.key || sprint?._clientId || title || `sprint-${index + 1}`;
      const label = optionLabel(key, title, sprint?.key);
      return { value: key, label };
    })
    .filter((option) => option.value);

// Same shape as sprintSelectOptions above, for MEETING_FIELDS' "Linked task" select sourced
// from the live `tasks` field value in the same Form.
export const taskSelectOptions = (tasks) =>
  (Array.isArray(tasks) ? tasks : [])
    .map((task, index) => {
      const title = task?.title;
      // Same identity precedence as materializeSectionKeys' task fallbackValue — _clientId before
      // title — so the two agree on what identifies a keyless task.
      const key = task?.key || task?._clientId || title || `task-${index + 1}`;
      const label = optionLabel(key, title, task?.key);
      return { value: key, label };
    })
    .filter((option) => option.value);

// College-admin workspace editors hide the Key field: it is generated from the title and links
// tasks to sprints and meetings, so editing it from a running workspace only risks breaking those
// links. Rows keep their stored key; only the input is not shown. Template authoring keeps it.
export const withoutKey = (fields) => fields.filter((field) => field.name !== "key");
