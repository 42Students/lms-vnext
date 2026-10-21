import { useEffect, useMemo, useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Radio, Select, Space, Tag, Typography } from "antd";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { listDrives } from "@/api/Services/TpoService";
import {
  bulkAssignPrep, bulkDebar, bulkDriveOverride, bulkLiftDebarment, bulkNote, bulkNudge, bulkRegister, bulkSendBack, bulkVerifyStudents,
  getPrepCourses, restoreDriveOverride, restoreRegistrations,
} from "@/api/Services/TpoHubService";
import { serverTime } from "@/components/tpo/dj";
import { fullName } from "@/components/tpo/tpoFiles";
import dayjs from "dayjs";
import { OUTCOME_DETAIL_HINT } from "@/config/choices";
import ReasonPicker, { reasonIsValid } from "@/components/tpo/ui/ReasonPicker";
import { INELIGIBLE_REASONS } from "@/components/tpo/batches/batchRules";

const STUDENT = ["student", "students"];
// A row from the batch sheet has "name"; a Students row has first and last name.
const nameOf = (r) => fullName(r) || r?.name || "";
const ids = (rows) => rows.map((r) => r.learnerId);
const plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** Ready messages: what a placement cell sends most. Gaps on the journey strip open with the matching one. */
export const MESSAGES = {
  register: ["Register", "Registration for placements is open. Please choose Placements, Higher studies or Not interested in your Placements page."],
  resume: ["Upload resume", "Please upload your resume to your profile. Companies see it when you apply."],
  profile: ["Complete profile", "Please complete your profile and academic details, with marksheets, and submit them for verification."],
  apply: ["Apply to drives", "There are open drives you can apply to. Please check your Placements page."],
  offer: ["Answer your offer", "You have an offer waiting for your answer. Please accept or decline it before it expires."],
};
const SEND_BACK_REASONS = ["Please upload your marksheets for every level.", "Your marks do not match the marksheet. Please correct them.", "Please upload a clear copy of your ID."];
/** True on a phone-sized screen: the action becomes a dropdown above the form, so the form and Review stay in view. */
function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return phone;
}

/** The add-to-drive window takes at most this many at once (each is checked on its own on the server). */
const ADD_MAX = 200;
const SECTION_NAME = { EDUCATION: "Education", IDENTITY: "Identity" };
const beforeToday = (d) => d && d.isBefore(dayjs().startOf("day"));
const SECTIONS = [{ value: "ALL", label: "Whatever is waiting" }, { value: "EDUCATION", label: "Education" }, { value: "IDENTITY", label: "Identity" }];

/**
 * The actions a placement cell can take on a set of students: what the view shows, or the ones ticked. Every action names how many
 * it applies to (and greys out when it applies to nobody, saying why); the form is on the right; Review hands over to the bulk
 * engine for the preview (who, who is skipped and why), the run, the result and the undo.
 *
 * Props: open, onClose, audience (rows), selected (boolean: the audience is a selection), initial ({ action, message }),
 *        registrationOptions, startBulk (useBulkAction), onAddToDrive(rows), onChanged() (reload),
 *        only (action keys this page offers; default all), onDecide(status, rows, reason) (adds the Placements decision group:
 *        the batch page, where deciding who is in placements is the job).
 */
export default function StudentActions({ open, onClose, audience = [], selected = false, initial, registrationOptions = [], startBulk, onAddToDrive, onChanged, only, onDecide, readyMessages }) {
  // A page can reword a ready message or drop it ({ register: null }): the batch page before its invite has no open registration.
  const messages = useMemo(() => {
    const out = { ...MESSAGES };
    Object.entries(readyMessages || {}).forEach(([k, text]) => { if (text === undefined) return; if (text) out[k] = [MESSAGES[k]?.[0] || k, text]; else delete out[k]; });
    return out;
  }, [readyMessages]);
  const [action, setAction] = useState("message");
  const [form] = Form.useForm();
  const [drives, setDrives] = useState(null);
  const [courses, setCourses] = useState(null);
  const [prefill, setPrefill] = useState("");
  const phone = useIsPhone();

  // Each opening starts on the suggested action (from a gap on the journey strip) with its ready message, else on Send a message.
  useEffect(() => {
    if (!open) return;
    // Never open on a harmful action (Make ineligible, Debar): the first safe one that applies to someone.
    setAction(initial?.action || ACTIONS.find((a) => !a.danger && audience.some((r) => !a.skip(r)))?.key || ACTIONS[0]?.key);
    // A page can bring its own wording (the batch page puts its deadline into "Register by ...").
    setPrefill(initial?.prefill ? initial.prefill : initial?.message && messages[initial.message] ? messages[initial.message][1] : "");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    if (["show", "hide"].includes(action) && drives === null) {
      fetchWithErrorHandling(listDrives()).then((r) => setDrives((Array.isArray(r.data) ? r.data : []).filter((d) => ["DRAFT", "PUBLISHED"].includes(d.lifecycleStatus))));
    }
    if (action === "prep" && courses === null) fetchWithErrorHandling(getPrepCourses()).then((r) => setCourses(Array.isArray(r.data) ? r.data : []));
  }, [open, action, drives, courses]);

  const done = () => onChanged?.();
  const ACTIONS = useMemo(() => [
    ...(onDecide ? [
      { group: "Placements decision", key: "eligible", title: "Make eligible", help: "Their own decision: in placements, whatever their class or batch says. You can undo it straight after.",
        skip: (r) => (r.ownDecision === "ELIGIBLE" ? "Already eligible on their own" : !r.ownDecision && r.eligibility === "ELIGIBLE" ? "Already eligible from their class or batch" : null) },
      { group: "Placements decision", key: "ineligible", title: "Make ineligible", help: "Out of placements, with a reason students never see. You can undo it straight after.", danger: true,
        skip: (r) => (r.ownDecision === "INELIGIBLE" ? "Already ineligible on their own" : !r.ownDecision && r.eligibility === "INELIGIBLE" ? "Already ineligible from their class or batch" : null) },
      { group: "Placements decision", key: "follow", title: "Follow class", help: "Remove their own decision, so their class and batch decide again.",
        skip: (r) => (!r.ownDecision ? "Already follows class" : null) },
    ] : []),
    { group: "Drives", key: "add", title: "Add to a drive", max: ADD_MAX,
      help: `Put them on an open drive as applicants, up to ${ADD_MAX} at a time. Each is checked against the drive and your Placement rules (a placed student only where the rules allow another offer); ineligible students only with a reason.`,
      skip: () => null },
    { group: "Drives", key: "show", title: "Show a drive to them", help: "Their marks and branch no longer keep them out of this drive. They still need to be registered for placements and not debarred to apply. The company sees them as added by the college, with your reason.",
      skip: (r) => (r.debarred ? "Debarred: lift it first" : null) },
    { group: "Drives", key: "hide", title: "Hide a drive from them", help: "They no longer see the drive and cannot apply. Anyone who already applied stays on its applicant list: withdraw them on the drive page if they should go.", skip: () => null },
    { group: "Talk to them", key: "message", title: "Send a message", help: "They see it in the app. The email copy goes out once 42LMS switches placement emails on.", skip: () => null },
    { group: "Their status", key: "after", title: "Set After college", help: "Looking for a job, Higher studies, Entrepreneurship, Competitive exams, Not interested, or your own label.",
      skip: (r) => (r.stage === "PLACED" ? "Already placed (worked out from offers)" : r.debarred ? "Debarred" : null) },
    { group: "Their status", key: "debar", title: "Debar", help: "Blocks applying to new drives until a date or for a number of drives. Applications and offers they already have stay open. Students are told and can dispute.", danger: true,
      skip: (r) => (r.debarred ? "Already debarred" : null) },
    { group: "Their status", key: "lift", title: "Lift debarment", help: "Ends every active debarment of these students now.", skip: (r) => (!r.debarred ? "Not debarred" : null) },
    { group: "Profile", key: "verify", title: "Verify their profile", help: "Verifies every section they submitted (Education, Identity) without opening it: only when you checked their documents another way. A section with a marksheet or ID document missing is left out, by name, to open and send back.",
      skip: (r) => (!(r.waitingSections || []).length ? "Nothing submitted to verify" : null) },
    { group: "Profile", key: "sendback", title: "Send back for correction", help: "Asks them to fix what they submitted, with your reason (for example a missing marksheet).",
      skip: (r) => (!(r.waitingSections || []).length ? "Nothing submitted to send back" : null) },
    { group: "Profile", key: "prep", title: "Assign prep", help: "A course from your LMS, with an optional due date. They see it as an assignment.", skip: () => null },
    { group: "Profile", key: "note", title: "Add a note", help: "The same note on each student's record, for the placement team only.", skip: () => null },
  ].filter((a) => !only || only.includes(a.key) || ["eligible", "ineligible", "follow"].includes(a.key)), [only, onDecide]);
  const current = ACTIONS.find((a) => a.key === action) || ACTIONS[0];
  const applies = (a) => audience.filter((r) => !a.skip(r)).length;
  const firstSkipReason = (a) => audience.map((r) => a.skip(r)).find(Boolean);
  const count = applies(current);
  const tooMany = Boolean(current.max) && count > current.max;

  // Batch sheet rows carry the placements decision: a message there can reach students who are not in placements.
  const notInNote = (rows) => {
    const n = rows.filter((r) => r.eligibility !== undefined && r.eligibility !== "ELIGIBLE").length;
    return n ? ` ${plural(n, "of them is", "of them are")} not in placements (ineligible or not decided).` : "";
  };
  const review = async () => {
    let v;
    try { v = await form.validateFields(); } catch (_) { return; }
    const base = { noun: STUDENT, items: audience, nameOf, skip: current.skip };
    const close = () => onClose?.();
    switch (action) {
      case "eligible": case "ineligible": case "follow":
        close();
        onDecide?.(action === "eligible" ? "ELIGIBLE" : action === "ineligible" ? "INELIGIBLE" : null, audience.filter((r) => !current.skip(r)), v.reason?.trim());
        return;
      case "add":
        close(); onAddToDrive?.(audience.filter((r) => !current.skip(r))); return;
      case "message":
        close();
        startBulk({ ...base, title: "Send message", consequence: `They see: "${v.text.trim()}".${notInNote(audience)}`, undoNote: "A sent message cannot be taken back.",
          run: (items) => fetchWithErrorHandling(bulkNudge(ids(items), v.text.trim())), onDone: done });
        return;
      case "show": case "hide": {
        const type = action === "show" ? "INCLUDE" : "EXCLUDE";
        const drive = (drives || []).find((d) => d.id === v.jobId);
        close();
        startBulk({ ...base, title: action === "show" ? "Show the drive" : "Hide the drive",
          consequence: `${drive ? `${drive.companyName} · ${drive.jobTitle}` : "The drive"} is ${action === "show" ? "opened to" : "hidden from"} them. Reason: ${v.reason.trim()}`,
          run: (items) => fetchWithErrorHandling(bulkDriveOverride({ jobId: v.jobId, learnerIds: ids(items), type, reason: v.reason.trim() })),
          undo: (_, res) => fetchWithErrorHandling(restoreDriveOverride(v.jobId, res?.data?.before || [])), onDone: done });
        return;
      }
      case "after": {
        const [choice, label = null] = String(v.choice).split("|");
        const name = registrationOptions.find((o) => o.value === v.choice)?.label || choice;
        close();
        startBulk({ ...base, title: `Set After college: ${name}`,
          skip: (r) => current.skip(r) || (r.registration === choice && (r.outcomeLabel || null) === label ? `Already ${name}` : null),
          consequence: choice === "PLACEMENTS" ? "They count as looking for a job." : "They are left out of placement %, reports and new drives.",
          run: (items) => fetchWithErrorHandling(bulkRegister(ids(items), choice, label, v.detail?.trim() || null)),
          partial: (res, items) => (res?.data?.skipped || []).map((x) => ({ item: items.find((i) => Number(i.learnerId) === Number(x.learnerId)), reason: x.reason })).filter((x) => x.item),
          // Exact undo: each goes back to what was stored (nothing, or the choice with its label, detail and who chose it).
          undo: (_, res) => fetchWithErrorHandling(restoreRegistrations((res?.data?.before || []).map((b) => ({ learnerId: b.learnerId, choice: b.choice || null, label: b.label || null, detail: b.detail || null, source: b.source || null })))),
          onDone: done });
        return;
      }
      case "debar":
        close();
        startBulk({ ...base, title: "Debar", danger: true, ack: "I understand they are told and cannot apply to new drives until it ends or is lifted.", consequence: `They cannot apply to new drives ${v.mode === "DRIVES" ? `for the next ${v.untilDrives} drive${v.untilDrives === 1 ? "" : "s"}` : `until ${v.untilDate?.format("D MMM YYYY")}`}. Applications and offers they already have stay open. Students are told and can dispute; companies never see this.`,
          undoNote: "To end it early, use Lift debarment.",
          run: (items) => fetchWithErrorHandling(bulkDebar({ learnerIds: ids(items), reason: v.reason.trim(), untilDate: v.mode === "DATE" ? v.untilDate?.format("YYYY-MM-DD") : null, untilDrives: v.mode === "DRIVES" ? v.untilDrives : null })),
          onDone: done });
        return;
      case "lift":
        close();
        startBulk({ ...base, title: "Lift debarment", consequence: `They can apply again. Reason: ${v.reason.trim()}`, undoNote: "To debar again, use Debar.",
          run: (items) => fetchWithErrorHandling(bulkLiftDebarment(ids(items), v.reason.trim())), onDone: done });
        return;
      case "verify":
        close();
        startBulk({ ...base, title: "Verify profiles", ack: "I have checked their documents another way (for example the college's own records).", consequence: "Every section they submitted is verified without opening it; their marks become the verified ones. Sections with a document missing are left out and named.",
          undoNote: "To change a verified profile, the student sends an update.",
          run: (items) => fetchWithErrorHandling(bulkVerifyStudents(ids(items))),
          partial: (res, items) => (res?.data?.failed || []).map((x) => ({ item: items.find((i) => Number(i.learnerId) === Number(x.learnerId)), reason: `${SECTION_NAME[x.section] || x.section}: ${x.reason}` })).filter((x) => x.item),
          summary: (res) => (res?.data?.verified != null ? `${res.data.verified.toLocaleString()} section${res.data.verified === 1 ? "" : "s"} verified.` : null),
          onDone: done });
        return;
      case "sendback":
        close();
        startBulk({ ...base, title: "Send back",
          skip: (r) => current.skip(r) || (v.section !== "ALL" && !(r.waitingSections || []).includes(v.section) ? `Nothing waiting in ${SECTION_NAME[v.section]}` : null),
          consequence: `They are asked to fix it: "${v.reason.trim()}"`, undoNote: "They resubmit; nothing to undo.",
          run: (items) => fetchWithErrorHandling(bulkSendBack(ids(items), v.section, v.reason.trim())),
          partial: (res, items) => (res?.data?.failed || []).map((x) => ({ item: items.find((i) => Number(i.learnerId) === Number(x.learnerId)), reason: x.reason })).filter((x) => x.item),
          onDone: done });
        return;
      case "prep": {
        const course = (courses || []).find((c) => c.id === v.courseId);
        close();
        startBulk({ ...base, title: "Assign prep", consequence: `${course?.name || "The course"} shows up as an assignment${v.dueAt ? `, due ${v.dueAt.format("D MMM, h:mm a")}` : ""}.`,
          undoNote: "Students are told straight away.",
          run: (items) => fetchWithErrorHandling(bulkAssignPrep({ learnerIds: ids(items), courseId: v.courseId, dueAt: v.dueAt ? serverTime(v.dueAt) : null })),
          partial: (res, items) => (res?.data?.skipped || []).map((x) => ({ item: items.find((i) => Number(i.learnerId) === Number(x.learnerId)), reason: x.reason })).filter((x) => x.item),
          onDone: done });
        return;
      }
      case "note":
        close();
        startBulk({ ...base, title: "Add note", consequence: `"${v.note.trim()}" is added to each student's record (placement team only).`, undoNote: "Notes stay on the record.",
          run: (items) => fetchWithErrorHandling(bulkNote(ids(items), v.note.trim())), onDone: done });
        return;
      default:
    }
  };

  const messageField = (
    <>
      <Space wrap style={{ marginBottom: 8 }}>
        {Object.entries(messages).map(([k, [label, text]]) => <Button key={k} size="small" onClick={() => form.setFieldsValue({ text })}>{label}</Button>)}
      </Space>
      <Form.Item name="text" rules={[{ required: true, whitespace: true, message: "Write the message" }]}><Input.TextArea rows={4} maxLength={1000} placeholder="Write the message, or pick a ready one" /></Form.Item>
    </>
  );
  const driveField = (
    <>
      <Form.Item name="jobId" label="Drive" rules={[{ required: true, message: "Choose the drive" }]}>
        <Select showSearch optionFilterProp="label" loading={drives === null} placeholder="Open or draft drives"
          options={(drives || []).map((d) => ({ value: d.id, label: `${d.companyName} · ${d.jobTitle}${d.lifecycleStatus === "DRAFT" ? " (draft)" : ""}` }))} />
      </Form.Item>
      <Form.Item name="reason" label="Reason" rules={[{ required: true, min: 3, message: "Give a reason (the company sees it as added by the college)" }]}><Input maxLength={300} placeholder="e.g. Company agreed to consider 58% in 12th" /></Form.Item>
    </>
  );
  const fields = {
    eligible: <Typography.Paragraph type="secondary">Next you see who changes and confirm. You can undo it straight after.</Typography.Paragraph>,
    follow: <Typography.Paragraph type="secondary">Next you see who changes and confirm. You can undo it straight after.</Typography.Paragraph>,
    ineligible: (
      <Form.Item name="reason" label="Reason (students never see it)" rules={[{ validator: (_, v) => (reasonIsValid(v || "", INELIGIBLE_REASONS) ? Promise.resolve() : Promise.reject(new Error("Pick or write the reason"))) }]}>
        <ReasonPicker reasons={INELIGIBLE_REASONS} placeholder="Why are they not in placements?" />
      </Form.Item>
    ),
    add: <Typography.Paragraph type="secondary">Next you pick the drive and see who is already on it.</Typography.Paragraph>,
    show: driveField, hide: driveField,
    message: messageField,
    after: (
      <>
        <Form.Item name="choice" label="After college" rules={[{ required: true, message: "Choose one" }]}><Select options={registrationOptions} placeholder="Choose" /></Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.choice !== b.choice}>
          {({ getFieldValue }) => {
            const choice = String(getFieldValue("choice") || "").split("|")[0];
            if (!["ENTREPRENEURSHIP", "COMPETITIVE_EXAMS", "HIGHER_STUDIES"].includes(choice)) return null;
            return (
              <Form.Item name="detail" label="What exactly (the same for all of them; optional)" extra="NAAC and NIRF reports show this. Leave it empty if it differs per student and fill it in their row.">
                <Input maxLength={200} placeholder={OUTCOME_DETAIL_HINT[choice] || ""} />
              </Form.Item>
            );
          }}
        </Form.Item>
      </>
    ),
    debar: (
      <>
        <Form.Item name="reason" label="Reason" rules={[{ required: true, whitespace: true, message: "A reason is required" }]}><Input.TextArea rows={2} maxLength={500} /></Form.Item>
        <Form.Item name="mode" label="Until"><Radio.Group><Radio value="DATE">A date</Radio><Radio value="DRIVES">A number of drives</Radio></Radio.Group></Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.mode !== b.mode}>
          {({ getFieldValue }) => (getFieldValue("mode") === "DRIVES"
            ? <Form.Item name="untilDrives" label="Number of drives" rules={[{ required: true, message: "How many drives" }]}><InputNumber min={1} max={50} /></Form.Item>
            : <Form.Item name="untilDate" label="End date" rules={[{ required: true, message: "Pick the end date" }]}><DatePicker format="D MMM YYYY" disabledDate={beforeToday} /></Form.Item>)}
        </Form.Item>
      </>
    ),
    lift: <Form.Item name="reason" label="Reason" rules={[{ required: true, min: 3, message: "Say why the debarment is lifted" }]}><Input maxLength={300} placeholder="e.g. Appeal accepted" /></Form.Item>,
    verify: <Typography.Paragraph type="secondary">Check a few in the verification queue first if you are unsure; this verifies what they submitted as it is.</Typography.Paragraph>,
    sendback: (
      <>
        <Form.Item name="section" label="What to send back"><Select options={SECTIONS} /></Form.Item>
        <Space wrap style={{ marginBottom: 8 }}>{SEND_BACK_REASONS.map((t) => <Button key={t} size="small" onClick={() => form.setFieldsValue({ reason: t })}>{t.split(".")[0]}</Button>)}</Space>
        <Form.Item name="reason" rules={[{ required: true, min: 3, message: "Say what needs to change" }]}><Input.TextArea rows={2} maxLength={500} placeholder="What needs to change" /></Form.Item>
      </>
    ),
    prep: (
      <>
        <Typography.Paragraph type="secondary">Students who already have this course are skipped and named.</Typography.Paragraph>
        <Form.Item name="courseId" label="Course" rules={[{ required: true, message: "Choose a course" }]}>
          <Select showSearch optionFilterProp="label" loading={courses === null} options={(courses || []).map((c) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="dueAt" label="Due (optional)"><DatePicker showTime format="D MMM YYYY, h:mm A" style={{ width: "100%" }} disabledDate={beforeToday} /></Form.Item>
      </>
    ),
    note: <Form.Item name="note" label="Note" rules={[{ required: true, whitespace: true, message: "Write the note" }]}><Input.TextArea rows={3} maxLength={1000} placeholder="e.g. Called on 5 Oct, will upload resume this week" /></Form.Item>,
  };
  const groups = [...new Set(ACTIONS.map((a) => a.group))];
  const reviewLabel = count === 0 ? "Nothing to do" : action === "eligible" ? `Make ${plural(count, "student", "students")} eligible`
    : action === "ineligible" ? `Make ${plural(count, "student", "students")} ineligible` : action === "follow" ? `Let ${plural(count, "student", "students")} follow class` : action === "add" ? "Choose the drive…" : `Review ${plural(count, "student", "students")}…`;

  return (
    <Modal open={open} onCancel={onClose} width={880} destroyOnClose className="tpo-actions" data-testid="student-actions"
      styles={{ body: { maxHeight: phone ? "calc(100vh - 220px)" : "calc(100vh - 260px)", overflowY: "auto" } }}
      title={<span>Act on {plural(audience.length, "student", "students")} <Tag bordered={false}>{selected ? "selected" : "in this view"}</Tag></span>}
      footer={(
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" danger={current.danger} disabled={count === 0 || tooMany} onClick={review} data-testid="student-actions.review">{reviewLabel}</Button>
        </Space>
      )}>
      <div className="tpo-actions__body">
        {phone ? (
          <Select className="tpo-actions__picker" value={action} onChange={setAction} aria-label="Action" data-testid="student-actions.picker"
            options={groups.map((g) => ({ label: g, options: ACTIONS.filter((a) => a.group === g).map((a) => {
              const n = applies(a);
              return { value: a.key, label: `${a.title} · ${n ? n.toLocaleString() : "none"}` };
            }) }))} />
        ) : (
        <nav className="tpo-actions__nav" aria-label="Actions">
          {groups.map((g) => (
            <div key={g} className="tpo-actions__group">
              <span className="tpo-actions__group-label">{g}</span>
              {ACTIONS.filter((a) => a.group === g).map((a) => {
                const n = applies(a);
                return (
                  <button type="button" key={a.key} className={`tpo-actions__item${a.key === action ? " is-active" : ""}${n === 0 ? " is-none" : ""}`}
                    onClick={() => { setAction(a.key); }} title={n === 0 ? `Applies to none here: ${firstSkipReason(a) || ""}` : ""} aria-current={a.key === action}
                    data-testid={`student-actions.${a.key}`}>
                    <span>{a.title}</span><span className="tpo-actions__count">{n ? n.toLocaleString() : "–"}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        )}
        <section className="tpo-actions__panel">
          <Typography.Title level={5} style={{ marginTop: 0 }}>{current.title}</Typography.Title>
          <Typography.Paragraph type="secondary">{current.help}</Typography.Paragraph>
          {count === 0 ? (
            <div className="tpo-actions__none" data-testid="student-actions.none">
              <InfoCircleOutlined />
              <span>Applies to none of these {plural(audience.length, "student", "students")}{firstSkipReason(current) ? `: ${firstSkipReason(current).toLowerCase()}` : ""}.</span>
            </div>
          ) : (
            <>
              {tooMany && <Typography.Paragraph type="warning" data-testid="student-actions.too-many">At most {current.max} at a time: tick up to {current.max}, or narrow the view with a filter.</Typography.Paragraph>}
              <Typography.Paragraph>
                Applies to <strong>{plural(count, "student", "students")}</strong>{count < audience.length ? ` of ${audience.length.toLocaleString()} (the rest are named and skipped in the next step)` : ""}.
              </Typography.Paragraph>
              <Form key={action} form={form} layout="vertical" preserve={false} initialValues={{ text: prefill, mode: "DATE", section: "ALL" }}>{fields[action]}</Form>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}

