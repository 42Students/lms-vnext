import { useEffect, useRef, useState } from "react";
import { Alert, Button, Input, Modal, Radio, Space, Switch, Tag, Tooltip, Typography, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getJobTypes, saveJobTypes } from "@/api/Services/TpoHubService";
import { resetChoicesCache } from "@/hooks/useChoices";
import { PanelError } from "@/components/Common/PanelStates";
import { ListSkeleton } from "@/components/Common/Skeletons";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || fallback;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const NAME = /^[\p{L}\p{N} +&/().,'-]{2,40}$/u;

/**
 * Settings > Job types (TPO notes item 15). The five built-in types can be switched off but not renamed; their answer to
 * "counts as placed" is fixed. The college adds its own, each with that answer. A type in use can be switched off, not deleted.
 * setDirty: the Settings page's unsaved-changes flag.
 */
export default function JobTypesTab({ setDirty = () => {} }) {
  const [types, setTypes] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const savingRef = useRef(false);
  const [name, setName] = useState("");
  const [counts, setCounts] = useState(null);

  const load = async () => {
    const res = await fetchWithErrorHandling(getJobTypes());
    if (!res.success) { setError(errorText(res, "Could not load job types")); return; }
    setError(null);
    const list = Array.isArray(res.data) ? res.data : [];
    setTypes(list); setSaved(list); setDirty(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (next) => { setTypes(next); setDirty(true); };
  const update = (i, patch) => change(types.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const nameProblem = (value, index) => {
    const v = value.trim().replace(/\s+/g, " ");
    if (!NAME.test(v)) return "2-40 letters, digits or simple punctuation";
    if (types.some((t, j) => j !== index && t.name.toLowerCase() === v.toLowerCase())) return `"${v}" is already a job type`;
    return "";
  };
  const addProblem = name.trim() ? nameProblem(name, -1) : "";

  const add = () => {
    if (!name.trim() || addProblem || counts === null) return;
    change([...types, { id: null, name: name.trim().replace(/\s+/g, " "), builtin: false, countsAsPlaced: counts, hidden: false, drives: 0 }]);
    setName(""); setCounts(null);
  };

  const save = async () => {
    const bad = types.find((t, i) => !t.builtin && nameProblem(t.name, i));
    if (bad) { message.error(`"${bad.name}": ${nameProblem(bad.name, types.indexOf(bad))}`); return; }
    // Changing the answer of a type with drives changes past numbers: say so first.
    const flipped = types.filter((t) => t.id && saved.some((s) => s.id === t.id && s.countsAsPlaced !== t.countsAsPlaced && (s.drives || 0) > 0));
    // A rename is applied to the drives that have the type, which students see.
    const renamed = types.filter((t) => t.id && saved.some((s) => s.id === t.id && s.name !== t.name.trim().replace(/\s+/g, " ") && (s.drives || 0) > 0))
      .map((t) => ({ to: t.name.trim(), from: saved.find((s) => s.id === t.id).name, drives: saved.find((s) => s.id === t.id).drives }));
    const go = async (rejectOnFailure = false) => {
      if (savingRef.current || saving) return false;
      savingRef.current = true;
      setSaving(true);
      setSaveError(null);
      try {
        const snapshot = types.map(({ id, name: n, builtin, countsAsPlaced, hidden }) => ({ id, name: n, builtin, countsAsPlaced, hidden }));
        const res = await fetchWithErrorHandling(saveJobTypes(snapshot));
        if (!res.success) {
          const errorMessage = errorText(res, "Could not save job types");
          setSaveError(errorMessage);
          message.error(errorMessage);
          if (rejectOnFailure) throw new Error(errorMessage);
          return false;
        }
        const list = Array.isArray(res.data) ? res.data : [];
        setTypes(list); setSaved(list); setDirty(false);
        resetChoicesCache(); // the drive form and filters read the new list
        message.success("Job types saved");
        return true;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    };
    if (!flipped.length && !renamed.length) { go(false); return; }
    Modal.confirm({
      title: flipped.length ? "Change what counts as placed?" : "Rename on drives too?",
      content: (
        <div data-testid="settings.job-types-confirm">
          {flipped.map((t) => <p key={`f-${t.id}`}>{`${t.name}: offers from its ${plural(t.drives, "drive", "drives")} will ${t.countsAsPlaced ? "now count" : "no longer count"} as placed. Placed % and reports change with it.`}</p>)}
          {renamed.map((r) => <p key={`r-${r.from}`}>{`"${r.from}" becomes "${r.to}" on its ${plural(r.drives, "drive", "drives")}, where students see it.`}</p>)}
        </div>
      ),
      okText: "Save", onOk: () => go(true),
    });
  };

  if (error) return <PanelError title={error} onRetry={load} />;
  if (!types) return <ListSkeleton rows={6} avatar={false} label="Loading job types" />;
  const visibleCount = types.filter((t) => !t.hidden).length;

  return (
    <div className="tpo-jobtypes" data-testid="settings.job-types">
      <Typography.Paragraph type="secondary">
        The drive form, filters and reports use this list. Switching a type off hides it from new drives; drives that already have it keep it.
      </Typography.Paragraph>
      <div className="tpo-jobtypes__list" role="table" aria-label="Job types">
        <div className="tpo-jobtypes__row tpo-jobtypes__row--head" role="row">
          <span role="columnheader">Job type</span><span role="columnheader">Counts as placed</span><span role="columnheader">Drives</span><span role="columnheader">In the drive form</span><span role="columnheader" aria-label="Remove" />
        </div>
        {types.map((t, i) => (
          <div className={`tpo-jobtypes__row${t.hidden ? " is-off" : ""}`} role="row" key={t.id || `b-${t.name}`}>
            <span role="cell">
              {t.builtin ? <span>{t.name} <Tag className="tpo-jobtypes__builtin">Built-in</Tag></span> : (
                <Input aria-label={`Name of ${t.name}`} value={t.name} maxLength={40} disabled={saving}
                  status={nameProblem(t.name, i) ? "error" : undefined}
                  onChange={(e) => update(i, { name: e.target.value })} />
              )}
            </span>
            <span role="cell">
              {t.builtin ? <Typography.Text>{t.countsAsPlaced ? "Yes" : "No"}</Typography.Text> : (
                <div role="radiogroup" aria-label={`${t.name} counts as placed`}>
                  <Radio.Group size="small" optionType="button" value={t.countsAsPlaced} disabled={saving}
                    onChange={(e) => update(i, { countsAsPlaced: e.target.value })}
                    options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
                </div>
              )}
            </span>
            <span role="cell">{t.drives || 0}</span>
            <span role="cell">
              <Switch checked={!t.hidden} aria-label={`${t.name} in the drive form`}
                disabled={saving || (!t.hidden && visibleCount === 1)} onChange={(on) => update(i, { hidden: !on })} />
            </span>
            <span role="cell">
              {!t.builtin && (
                <Tooltip title={(t.drives || 0) > 0 ? "Used by drives: switch it off instead" : "Remove"}>
                  <Button type="text" icon={<DeleteOutlined />} aria-label={`Remove ${t.name}`} disabled={saving || (t.drives || 0) > 0}
                    onClick={() => change(types.filter((_, j) => j !== i))} />
                </Tooltip>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="tpo-jobtypes__add">
        <Typography.Text strong>Add a job type</Typography.Text>
        <Space wrap align="start">
          <div>
            <Input placeholder="e.g. Part-time" aria-label="New job type" value={name} maxLength={40} disabled={saving}
              status={addProblem ? "error" : undefined}
              onChange={(e) => setName(e.target.value)} onPressEnter={add} style={{ width: 220 }} />
            {addProblem && <div className="tpo-jobtypes__error">{addProblem}</div>}
          </div>
          <Space direction="vertical" size={2}>
            <Typography.Text>Does an offer of this type count as placed?</Typography.Text>
            <div role="radiogroup" aria-label="New type counts as placed">
              <Radio.Group value={counts} disabled={saving} onChange={(e) => setCounts(e.target.value)} options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
            </div>
          </Space>
          <Button icon={<PlusOutlined />} onClick={add} disabled={saving || !name.trim() || Boolean(addProblem) || counts === null}>Add</Button>
        </Space>
      </div>

      {saveError ? (
        <Alert type="error" showIcon closable message="Job types were not saved" description={saveError}
          action={<Button size="small" onClick={save} disabled={saving}>Retry</Button>}
          onClose={() => setSaveError(null)} style={{ marginBottom: 12 }} />
      ) : null}
      <Alert type="info" showIcon className="tpo-jobtypes__note"
        message="Internship never counts as placed; Internship + full-time counts once the full-time offer is made. Your own types follow the answer you give." />
      <div className="tpo-settings__actions">
        <Button type="primary" loading={saving} onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}
