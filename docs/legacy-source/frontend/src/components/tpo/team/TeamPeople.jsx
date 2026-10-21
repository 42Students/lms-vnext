import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Button, DatePicker, Form, Modal, Popover, Select, Skeleton, Tag, Typography, message } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { dj } from "@/components/tpo/dj";
import { PanelError } from "@/components/Common/PanelStates";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  assignUnowned, getFacultyDirectory, getRemovalImpact, getTeam, getTeamPeople, removeTeamMember, setTeamAway, setTeamMember,
} from "@/api/Services/TpoHubService";

const errorText = (r, f) => r?.data?.message || r?.data?.error || f;
const fullName = (x) => `${x?.firstName || ""} ${x?.lastName || ""}`.trim();
const n = (v) => Number(v) || 0;
const plural = (k, one, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
const initials = (name) => String(name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
export const workload = (p) => n(p.drivesLive) + n(p.drivesReview) + n(p.companies) + n(p.followUpsOverdue) + n(p.asksOn);

/** The red line on a card: what is overdue, in words. */
export function overdueLine(p) {
  const asks = (p.openAsks || []).filter((a) => a.overdue === true || a.overdue === 1);
  const bits = [];
  if (asks.length) {
    const a = asks[0];
    bits.push(`${plural(asks.length, "ask")} overdue${a.body ? `: “${a.body}”, was due ${dj(a.dueAt).format("ddd D MMM")}` : ""}`);
  }
  if (n(p.followUpsOverdue)) bits.push(`${plural(n(p.followUpsOverdue), "follow-up")} overdue`);
  return bits.length ? `${bits.join(". ")}.` : null;
}

/**
 * Team > People (design §1): who's doing what. One card per person with five numbers that open the work, Away until, the work nobody
 * owns with a way to assign it, adding someone and the hand-over when someone leaves. "Last active" is deliberately not shown.
 */
export default function TeamPeople({ meId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [team, setTeam] = useState({ members: [], accounts: [], me: null });
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("load");
  const [assigning, setAssigning] = useState(false);
  const [away, setAway] = useState(null); // { person, until }
  const [adding, setAdding] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [reassign, setReassign] = useState(null);
  const [assignForm] = Form.useForm();
  const [addForm] = Form.useForm();

  const reload = useCallback(async () => {
    const [p, t] = await Promise.all([fetchWithErrorHandling(getTeamPeople()), fetchWithErrorHandling(getTeam())]);
    if (!p.success) { setError(errorText(p, "Couldn't load your placement team")); return; }
    setError(null);
    setData(p.data || { people: [], unowned: { drives: [], companies: [] } });
    if (t.success) setTeam({ members: [], accounts: [], ...(t.data || {}) });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const people = useMemo(() => {
    const list = [...(data?.people || [])];
    if (sort === "name") list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
    else if (sort === "overdue") list.sort((a, b) => (n(b.asksOverdue) + n(b.followUpsOverdue)) - (n(a.asksOverdue) + n(a.followUpsOverdue)) || workload(b) - workload(a));
    else list.sort((a, b) => workload(b) - workload(a));
    return list;
  }, [data, sort]);

  const memberIds = new Set((team.members || []).map((m) => Number(m.facultyId)));
  const everyone = data?.people || [];
  const run = async (call, ok) => {
    const r = await fetchWithErrorHandling(call);
    if (!r.success) { message.error(errorText(r, "That didn't work")); return false; }
    if (ok) message.success(ok);
    await reload();
    return true;
  };

  const startRemove = async (p) => {
    const r = await fetchWithErrorHandling(getRemovalImpact(p.facultyId));
    if (!r.success || !r.data) { message.error(errorText(r, "Could not verify what this team member owns. Retry before removing them.")); return; }
    if (n(r.data.recruiterLeads) + n(r.data.drives) + n(r.data.asks) > 0) { setReassign(null); setRemoving({ p, impact: r.data }); return; }
    Modal.confirm({
      title: `Remove ${p.firstName} from the placement team?`, content: "They lose access at once, private conversations included. What they wrote stays, marked “left the team”.",
      okText: "Remove", okButtonProps: { danger: true }, onOk: () => run(removeTeamMember(p.facultyId, null), "Removed from the team"),
    });
  };

  const searchDirectory = async (q) => {
    const r = await fetchWithErrorHandling(getFacultyDirectory(q));
    if (r.success && Array.isArray(r.data)) setDirectory(r.data);
  };

  if (error && !data) return <PanelError title={error} onRetry={reload} />;
  if (!data) return <Skeleton active paragraph={{ rows: 8 }} />;
  const unowned = data.unowned || { drives: [], companies: [] };
  const unownedTotal = (unowned.drives || []).length + (unowned.companies || []).length;

  const number = (label, value, { href, warn, popover } = {}) => {
    const inner = (<><span className="team-num__value">{value}</span><span className="team-num__label">{label}</span></>);
    const cls = `team-num${warn ? " is-warn" : ""}`;
    if (popover) return <Popover content={popover} trigger="click" placement="bottom"><button type="button" className={cls}>{inner}</button></Popover>;
    if (href) return <Link href={href} className={cls}>{inner}</Link>;
    return <span className={cls}>{inner}</span>;
  };

  const askList = (p, key = "openAsks", who = "askedByName") => {
    const asks = p[key] || [];
    if (!asks.length) return null;
    return (
      <div className="team-asks-pop">
        {asks.map((a) => (
          <div key={a.id} className={`team-asks-pop__item${a.overdue === true || a.overdue === 1 ? " is-overdue" : ""}`}>
            {a.threadId ? <Link href={`/tpo/messages?tab=team&c=${a.threadId}&m=${a.messageId}`}>{a.body}</Link> : <Typography.Text type="secondary">{a.body}</Typography.Text>}
            <Typography.Text type="secondary" className="team-asks-pop__meta">{key === "waitingAsks" ? `asked ${a[who]}` : a[who]} · {a.dueAt ? `by ${dj(a.dueAt).format(dj(a.dueAt).isSame(dj(), "year") ? "ddd D MMM, h:mm A" : "ddd D MMM YYYY, h:mm A")}` : "no date"}</Typography.Text>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="team-people" data-testid="tpo.team.people">
      {unownedTotal > 0 && (
        <section className="team-unowned" aria-label="Work nobody owns">
          <WarningOutlined aria-hidden="true" />
          <div className="team-unowned__text"><strong>Nobody owns</strong> {[(unowned.drives || []).length && plural(unowned.drives.length, "drive"), (unowned.companies || []).length && plural(unowned.companies.length, "company", "companies")].filter(Boolean).join(" and ")}. Unowned work is what slips.</div>
          <Button onClick={() => { assignForm.resetFields(); setAssigning(true); }}>Assign them</Button>
        </section>
      )}

      <div className="team-people__bar">
        <Typography.Title level={5} className="team-people__count">{plural(everyone.length, "person", "people")}</Typography.Title>
        <div className="team-people__sort" role="group" aria-label="Sort">
          {[["load", "Most work"], ["overdue", "Overdue first"], ["name", "Name"]].map(([k, label]) => (
            <button key={k} type="button" className={`team-filter${sort === k ? " is-on" : ""}`} aria-pressed={sort === k} onClick={() => setSort(k)}>{label}</button>
          ))}
        </div>
        <Button type="primary" onClick={() => { addForm.resetFields(); searchDirectory(""); setAdding(true); }}>Add a team member</Button>
      </div>

      <div className="team-people__grid">
        {people.map((p) => {
          const name = fullName(p) || p.email || `#${p.facultyId}`;
          const isMe = p.me === true || Number(p.facultyId) === Number(meId);
          const line = overdueLine(p);
          return (
            <article key={p.facultyId} className="team-person" aria-label={name} data-testid="team.person">
              <div className="team-person__head">
                <span className="team-avatar team-avatar--lg" aria-hidden="true">{initials(name)}</span>
                <div className="team-person__who">
                  <div className="team-person__name">{name}{isMe && <Tag className="team-person__you">You</Tag>}</div>
                  <Typography.Text type="secondary" className="team-person__kind">{p.kind}</Typography.Text>
                </div>
                {p.awayUntil && <span className="team-person__away">Away until {dj(p.awayUntil).format("ddd D MMM")}</span>}
              </div>
              <div className="team-person__nums">
                {/* Each number opens that work filtered to this person (the lists' own owner filters, f_owner). */}
                {number("Drives (live · review)", `${n(p.drivesLive)} · ${n(p.drivesReview)}`, { href: `/tpo/drives?f_owner=${p.facultyId}` })}
                {number("Companies", n(p.companies), { href: `/tpo/recruiters?f_owner=${p.facultyId}` })}
                {number("Follow-ups overdue", n(p.followUpsOverdue), { href: `/tpo/recruiters?f_owner=${p.facultyId}&f_followUp=OVERDUE`, warn: n(p.followUpsOverdue) > 0 })}
                {number("Asks on them", n(p.asksOn), { warn: n(p.asksOverdue) > 0, popover: askList(p) })}
                {number("Waiting on others", n(p.waitingOn), { popover: askList(p, "waitingAsks", "assigneeName") })}
              </div>
              {line && <div className="team-person__overdue">{line}</div>}
              <div className="team-person__actions">
                {!isMe && <Button size="small" onClick={() => router.push(`/tpo/messages?tab=team&ask=${p.facultyId}`)}>Ask {p.firstName || "them"}</Button>}
                <Button size="small" onClick={() => setAway({ person: p, until: p.awayUntil ? dj(p.awayUntil) : null })}>{p.awayUntil ? "Change away" : "Set away"}</Button>
                {p.awayUntil && <Button size="small" type="text" onClick={() => run(setTeamAway(p.facultyId, null), `${p.firstName || "They"} are back`)}>Back now</Button>}
                {memberIds.has(Number(p.facultyId)) && !isMe && (
                  <Button size="small" type="text" className="team-person__remove" onClick={() => startRemove(p)}>Hand over and remove</Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <Typography.Paragraph type="secondary" className="team-people__note">The college&apos;s TPO and college-admin accounts are always in the team. Everyone in it can do everything in placements.</Typography.Paragraph>

      <AsyncModal open={assigning} title="Assign work nobody owns" okText="Assign" onCancel={() => setAssigning(false)} destroyOnClose
        onOk={async () => {
          const v = await assignForm.validateFields();
          if (!(v.driveIds || []).length && !(v.companies || []).length) { message.info("Pick at least one drive or company"); return; }
          const r = await fetchWithErrorHandling(assignUnowned({ driveIds: v.driveIds || [], companies: v.companies || [], to: v.to }));
          if (!r.success) { message.error(errorText(r, "Couldn't assign")); return; }
          message.success(`Assigned ${plural(n(r.data?.drives), "drive")}${n(r.data?.companyContacts) ? ` and ${plural(n(r.data.companyContacts), "company contact")}` : ""}.`);
          setAssigning(false);
          reload();
        }}>
        <Form form={assignForm} layout="vertical">
          <Form.Item name="to" label="Give them to" rules={[{ required: true, message: "Choose someone" }]}>
            <Select options={everyone.map((p) => ({ value: p.facultyId, label: `${fullName(p)}${p.awayUntil ? ` (away until ${dj(p.awayUntil).format("D MMM")})` : ""}` }))} placeholder="Choose a team member" />
          </Form.Item>
          {(unowned.drives || []).length > 0 && (
            <Form.Item name="driveIds" label="Drives">
              <Select mode="multiple" optionFilterProp="label" options={(unowned.drives || []).map((d) => ({ value: d.id, label: d.label }))} />
            </Form.Item>
          )}
          {(unowned.companies || []).length > 0 && (
            <Form.Item name="companies" label="Companies" extra="All of the company's contacts move to them.">
              <Select mode="multiple" optionFilterProp="label" options={(unowned.companies || []).map((c) => ({ value: c.key, label: `${c.label} (${plural(n(c.contacts), "contact")})` }))} />
            </Form.Item>
          )}
        </Form>
      </AsyncModal>

      <AsyncModal open={Boolean(away)} title={away ? `${away.person.firstName || "They"}: away until` : ""} okText="Save" onCancel={() => setAway(null)} destroyOnClose okButtonProps={{ disabled: !away?.until }}
        onOk={async () => { if (await run(setTeamAway(away.person.facultyId, away.until.format("YYYY-MM-DD")), "Saved")) setAway(null); }}>
        <Typography.Paragraph type="secondary">Anyone asking them something is told they&apos;re away. It ends by itself after this day.</Typography.Paragraph>
        <DatePicker style={{ width: "100%" }} format="ddd D MMM YYYY" value={away?.until || null} onChange={(d) => setAway((a) => ({ ...a, until: d }))}
          disabledDate={(d) => d && (d.isBefore(dj(), "day") || d.isAfter(dj().add(1, "year")))} aria-label="Away until" />
      </AsyncModal>

      <AsyncModal open={adding} title="Add a team member" okText="Add" onCancel={() => setAdding(false)} destroyOnClose
        onOk={async () => { const v = await addForm.validateFields(); if (await run(setTeamMember({ facultyId: v.facultyId, role: "TPO_ADMIN" }), "Added to the team")) setAdding(false); }}>
        <Form form={addForm} layout="vertical">
          <Form.Item name="facultyId" label="Faculty member" rules={[{ required: true, message: "Choose a faculty member" }]} extra="They can do everything in placements, like you, and read the team's conversations.">
            <Select showSearch filterOption={false} onSearch={searchDirectory} placeholder="Search by name or email"
              options={directory.filter((d) => !everyone.some((p) => Number(p.facultyId) === Number(d.facultyId))).map((d) => ({ value: d.facultyId, label: `${fullName(d)}${d.department ? ` (${d.department})` : ""}` }))} />
          </Form.Item>
        </Form>
      </AsyncModal>

      <AsyncModal open={Boolean(removing)} title="Who takes over?" okText="Hand over and remove" okButtonProps={{ disabled: !reassign, danger: true }} onCancel={() => setRemoving(null)}
        onOk={async () => { if (await run(removeTeamMember(removing.p.facultyId, reassign), "Removed. Their work was handed over.")) setRemoving(null); }}>
        {removing && (
          <Typography.Paragraph>
            {removing.p.firstName} owns {[n(removing.impact.drives) && plural(n(removing.impact.drives), "open drive"), n(removing.impact.recruiterLeads) && plural(n(removing.impact.recruiterLeads), "recruiter")].filter(Boolean).join(" and ") || "nothing"}
            {n(removing.impact.asks) ? ` and has ${plural(n(removing.impact.asks), "open ask")}` : ""}. Choose who takes them over.
          </Typography.Paragraph>
        )}
        <Select style={{ width: "100%" }} placeholder="Choose a person" value={reassign} onChange={setReassign}
          options={everyone.filter((x) => Number(x.facultyId) !== Number(removing?.p.facultyId)).map((x) => ({ value: x.facultyId, label: `${fullName(x)} · ${x.kind}` }))} />
        <Alert type="info" showIcon style={{ marginTop: 12 }} message="They lose access at once, private conversations included. What they wrote stays, marked “left the team”." />
      </AsyncModal>
    </div>
  );
}
