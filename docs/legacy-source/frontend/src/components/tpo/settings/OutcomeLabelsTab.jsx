import { useEffect, useRef, useState } from "react";
import { Alert, Button, Input, Select, Space, Tag, Typography, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getOutcomeLabels, saveOutcomeLabels } from "@/api/Services/TpoHubService";
import { resetChoicesCache } from "@/hooks/useChoices";
import { PanelError } from "@/components/Common/PanelStates";
import { ListSkeleton } from "@/components/Common/Skeletons";
import { OUTCOMES, SETTABLE_OUTCOMES } from "@/config/choices";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || fallback;

/**
 * Settings > After college (TPO notes item 7). The final outcomes are a fixed list (what NAAC 5.2 and NIRF count);
 * the college adds its own labels, each under one of the outcomes the placement cell sets. Reports count the fixed outcome.
 */
export default function OutcomeLabelsTab({ setDirty = () => {} }) {
  const [labels, setLabels] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const savingRef = useRef(false);
  const [draft, setDraft] = useState({ label: "", outcome: null });

  const load = async () => {
    const res = await fetchWithErrorHandling(getOutcomeLabels());
    if (!res.success) { setError(errorText(res, "Could not load outcome labels")); return; }
    setError(null); setLabels(Array.isArray(res.data) ? res.data : []); setDirty(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (next) => { setLabels(next); setDirty(true); };
  const problem = (value, index) => {
    const v = value.trim();
    if (v.length < 2 || v.length > 60) return "2-60 characters";
    if (OUTCOMES.some((o) => o.label.toLowerCase() === v.toLowerCase())) return "That is already one of the fixed choices";
    if (labels.some((l, j) => j !== index && l.label.trim().toLowerCase() === v.toLowerCase())) return "Listed twice";
    return "";
  };
  const draftProblem = draft.label.trim() ? problem(draft.label, -1) : "";
  const add = () => {
    if (!draft.label.trim() || draftProblem || !draft.outcome) return;
    change([...labels, { id: null, label: draft.label.trim(), outcome: draft.outcome }]);
    setDraft({ label: "", outcome: null });
  };

  const save = async () => {
    if (savingRef.current || saving) return;
    const bad = labels.find((l, i) => problem(l.label, i));
    if (bad) { message.error(`"${bad.label}": ${problem(bad.label, labels.indexOf(bad))}`); return; }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const snapshot = labels.map(({ id, label, outcome }) => ({ id, label: label.trim(), outcome }));
      const res = await fetchWithErrorHandling(saveOutcomeLabels(snapshot));
      if (!res.success) {
        const errorMessage = errorText(res, "Could not save the labels");
        setSaveError(errorMessage);
        message.error(errorMessage);
        return;
      }
      setLabels(Array.isArray(res.data) ? res.data : []); setDirty(false);
      resetChoicesCache();
      message.success("After college labels saved");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (error) return <PanelError title={error} onRetry={load} />;
  if (!labels) return <ListSkeleton rows={6} avatar={false} label="Loading outcome labels" />;

  return (
    <div className="tpo-outcomes" data-testid="settings.outcomes">
      <Typography.Title level={5}>The choices (fixed)</Typography.Title>
      <Typography.Paragraph type="secondary">
        These match what NAAC (criterion 5.2) and NIRF count, so a batch&apos;s numbers always add up. Placed and Debarred are worked out
        from offers and debarments; the rest are set on the student&apos;s Registration.
      </Typography.Paragraph>
      <div className="tpo-outcomes__fixed">
        {OUTCOMES.map((o) => (
          <span key={o.value} className="tpo-outcomes__fixed-item">
            {o.label} <Tag>{SETTABLE_OUTCOMES.includes(o.value) ? "set by you or the student" : "automatic"}</Tag>
          </span>
        ))}
      </div>

      <Typography.Title level={5}>Your own labels</Typography.Title>
      <Typography.Paragraph type="secondary">
        A finer name under one of the standard choices, for example &quot;Startup&quot; under Entrepreneurship or &quot;GATE&quot; under Competitive exams.
        Lists always show the standard choice; your label shows on hover and on the student&apos;s panel. Reports count the standard choice.
      </Typography.Paragraph>
      {labels.length === 0 && <Typography.Paragraph type="secondary" className="tpo-outcomes__empty">No labels yet.</Typography.Paragraph>}
      {labels.map((l, i) => (
        <Space key={l.id || `n-${i}`} className="tpo-outcomes__row" wrap align="start">
          <div>
            <Input aria-label={`Label ${i + 1}`} value={l.label} maxLength={60} disabled={saving}
              status={problem(l.label, i) ? "error" : undefined} style={{ width: 240 }}
              onChange={(e) => change(labels.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            {problem(l.label, i) && <div className="tpo-jobtypes__error">{problem(l.label, i)}</div>}
          </div>
          <Select aria-label={`Outcome of ${l.label}`} value={l.outcome} style={{ width: 260 }} disabled={saving}
            options={OUTCOMES.filter((o) => SETTABLE_OUTCOMES.includes(o.value))}
            onChange={(v) => change(labels.map((x, j) => (j === i ? { ...x, outcome: v } : x)))} />
          <Button type="text" icon={<DeleteOutlined />} aria-label={`Remove ${l.label}`} disabled={saving}
            onClick={() => change(labels.filter((_, j) => j !== i))} />
        </Space>
      ))}
      <Space wrap align="start" className="tpo-outcomes__add">
        <div>
          <Input placeholder="New label, e.g. Startup" aria-label="New label" value={draft.label} maxLength={60}
            disabled={saving} style={{ width: 240 }}
            status={draftProblem ? "error" : undefined} onChange={(e) => setDraft({ ...draft, label: e.target.value })} onPressEnter={add} />
          {draftProblem && <div className="tpo-jobtypes__error">{draftProblem}</div>}
        </div>
        <Select placeholder="Counts as..." aria-label="New label counts as" value={draft.outcome} style={{ width: 260 }} disabled={saving}
          options={OUTCOMES.filter((o) => SETTABLE_OUTCOMES.includes(o.value))} onChange={(v) => setDraft({ ...draft, outcome: v })} />
        <Button icon={<PlusOutlined />} onClick={add} disabled={saving || !draft.label.trim() || Boolean(draftProblem) || !draft.outcome}>Add</Button>
      </Space>
      {saveError ? (
        <Alert type="error" showIcon closable message="Outcome labels were not saved" description={saveError}
          action={<Button size="small" onClick={save} disabled={saving}>Retry</Button>}
          onClose={() => setSaveError(null)} style={{ marginBottom: 12 }} />
      ) : null}
      <Typography.Paragraph type="secondary" className="tpo-outcomes__note">
        Renaming a label renames it on every student who has it; removing one keeps their choice and drops only the label.
      </Typography.Paragraph>
      <div className="tpo-settings__actions">
        <Button type="primary" loading={saving} onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}
