import { useEffect, useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Form, Modal, Select, Space, Tag, Typography } from "antd";

const plural = (n, [one, many]) => `${Number(n).toLocaleString()} ${Number(n) === 1 ? one : many}`;
/** A row's name for the "left out" list: a person, a recruiter lead, or a drive. */
const defaultNameOf = (r) => r?.name || [r?.firstName, r?.lastName].filter(Boolean).join(" ") || (r?.companyName ? `${r.companyName}${r.jobTitle ? ` · ${r.jobTitle}` : ""}` : "") || "One row";

/** True on a phone-sized screen: the action becomes a dropdown above the form, so the form and the button stay in view. */
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

/**
 * The one Actions window every TPO list uses (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md): actions grouped on the left with
 * how many rows each applies to (greyed, with the reason, when none), the chosen action's form on the right, one button.
 * It opens on the suggested action, else the first safe one that applies (never on a harmful one); on a phone the action
 * is a dropdown. What the button does is the page's: usually hand the rows to the bulk engine (preview -> result -> Undo).
 *
 * Props: open, onClose, audience (rows), selected (the audience is a selection), noun (["student", "students"]),
 *        actions: [{ group, key, title, help, danger?, skip?(row) -> reason | null, fields?: ReactNode, initialValues?,
 *                    button?(count) -> label, run(rows, values),
 *                    whole?: the action is about the whole list, not these rows (no count; ticks do not narrow it),
 *                    note?(rows) -> text: a warning under the count (e.g. "3 of them have passed their deadline") }],
 *        initial ({ action, values }), nameOf(row) for the "left out" list (default: name, first and last name, or company · title).
 */
export default function ActionsWindow({ open, onClose, audience = [], selected = false, noun = ["row", "rows"], actions = [], initial, testid = "actions-window", nameOf = defaultNameOf }) {
  const [key, setKey] = useState(null);
  const [form] = Form.useForm();
  const phone = useIsPhone();
  const applies = (a) => (a.whole ? Math.max(audience.length, 1) : audience.filter((r) => !a.skip?.(r)).length);
  const firstSkip = (a) => audience.map((r) => a.skip?.(r)).find(Boolean);

  useEffect(() => {
    if (!open) return;
    setKey(initial?.action || actions.find((a) => !a.danger && applies(a) > 0)?.key || actions[0]?.key);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = actions.find((a) => a.key === key) || actions[0];
  if (!current) return null;
  const count = applies(current);
  const groups = [...new Set(actions.map((a) => a.group))];
  // Who this action leaves out, by reason, named here: only the rows it applies to go on to the next step.
  const leftOut = current.whole ? [] : Object.entries(audience.reduce((acc, r) => {
    const why = current.skip?.(r);
    if (why) (acc[why] = acc[why] || []).push(r);
    return acc;
  }, {}));
  const go = async () => {
    let values = {};
    try { values = await form.validateFields(); } catch (_) { return; }
    const rows = audience.filter((r) => !current.skip?.(r));
    onClose?.();
    current.run(rows, values, audience);
  };
  const label = count === 0 ? "Nothing to do" : current.button ? current.button(count) : `Review ${plural(count, noun)}…`;

  return (
    <Modal open={open} onCancel={onClose} width={880} destroyOnClose className="tpo-actions" data-testid={testid}
      styles={{ body: { maxHeight: phone ? "calc(100vh - 220px)" : "calc(100vh - 260px)", overflowY: "auto" } }}
      title={<span>Act on {plural(audience.length, noun)} <Tag bordered={false}>{selected ? "selected" : "in this view"}</Tag></span>}
      footer={(
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" danger={current.danger} disabled={count === 0} onClick={go} data-testid={`${testid}.go`}>{label}</Button>
        </Space>
      )}>
      <div className="tpo-actions__body">
        {phone ? (
          <Select className="tpo-actions__picker" value={current.key} onChange={setKey} aria-label="Action"
            options={groups.map((g) => ({ label: g, options: actions.filter((a) => a.group === g).map((a) => ({ value: a.key, label: `${a.title} · ${applies(a) ? applies(a).toLocaleString() : "none"}` })) }))} />
        ) : (
          <nav className="tpo-actions__nav" aria-label="Actions">
            {groups.map((g) => (
              <div key={g} className="tpo-actions__group">
                <span className="tpo-actions__group-label">{g}</span>
                {actions.filter((a) => a.group === g).map((a) => {
                  const n = applies(a);
                  return (
                    <button type="button" key={a.key} aria-current={a.key === current.key} data-testid={`${testid}.${a.key}`}
                      className={`tpo-actions__item${a.key === current.key ? " is-active" : ""}${n === 0 ? " is-none" : ""}`}
                      onClick={() => setKey(a.key)} title={n === 0 ? `Applies to none here: ${firstSkip(a) || ""}` : ""}>
                      <span>{a.title}</span><span className="tpo-actions__count">{a.whole ? "" : n ? n.toLocaleString() : "–"}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        )}
        <section className="tpo-actions__panel">
          <Typography.Title level={5} style={{ marginTop: 0 }}>{current.title}</Typography.Title>
          {current.help && <Typography.Paragraph type="secondary">{current.help}</Typography.Paragraph>}
          {count === 0 ? (
            <div className="tpo-actions__none" data-testid={`${testid}.none`}>
              <InfoCircleOutlined />
              <span>Applies to none of these {plural(audience.length, noun)}{firstSkip(current) ? `: ${String(firstSkip(current)).toLowerCase()}` : ""}.</span>
            </div>
          ) : (
            <>
              {!current.whole && (
                <Typography.Paragraph>
                  Applies to <strong>{plural(count, noun)}</strong>{count < audience.length ? ` of ${audience.length.toLocaleString()}` : ""}.
                </Typography.Paragraph>
              )}
              {leftOut.length > 0 && (
                <div className="tpo-actions__left-out" data-testid={`${testid}.left-out`}>
                  <Typography.Text type="secondary">Left out:</Typography.Text>
                  <ul>
                    {leftOut.slice(0, 4).map(([why, rows]) => (
                      <li key={why}>{why}: {rows.slice(0, 3).map(nameOf).join(", ")}{rows.length > 3 ? ` and ${(rows.length - 3).toLocaleString()} more` : ""}</li>
                    ))}
                    {leftOut.length > 4 && <li>and {leftOut.length - 4} other reasons</li>}
                  </ul>
                </div>
              )}
              {current.note && current.note(audience.filter((r) => !current.skip?.(r))) && (
                <Typography.Paragraph type="warning" data-testid={`${testid}.note`}>{current.note(audience.filter((r) => !current.skip?.(r)))}</Typography.Paragraph>
              )}
              <Form key={current.key} form={form} layout="vertical" preserve={false} initialValues={{ ...(current.initialValues || {}), ...(initial?.action === current.key ? initial?.values || {} : {}) }}>
                {current.fields || null}
              </Form>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}
