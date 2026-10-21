import { useMemo, useState } from "react";
import { Button, Dropdown, Empty, Input, Modal, Tag, Tooltip, Typography } from "antd";
import { DownloadOutlined, MoreOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import moment from "moment";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

// Manage views (GridWorkspace > Views > Manage all views): every saved view of this list, with Open, Excel, CSV, pin (into the
// Views dropdown, up to 5), rename, update with the current filters and delete. A view unused for 60 days is marked, so a
// cluttered list is easy to clean up.

const UNUSED_DAYS = 60;

/** When a view was last opened or downloaded (or made, if never used): a moment, from the server's UTC time. */
export function lastTouched(v) {
  const raw = v?.lastUsedAt || v?.createdAt;
  return raw ? parsePlacementUtcDateTime(raw) : null;
}

export default function SavedViewsManager({
  open, onClose, views, viewId, countOf, describe, onOpen, onDownload, onTogglePin, onEdit, onUpdate, onDelete, busyId,
}) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // { id, name, note }
  const [saving, setSaving] = useState(false);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (views || []).filter((v) => !needle || String(v.name || "").toLowerCase().includes(needle));
  }, [views, q]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      title={`Saved views${views?.length ? ` (${views.length})` : ""}`}
      destroyOnClose
      className="tpo-views-manager"
    >
      {(views || []).length > 6 && (
        <Input.Search allowClear placeholder="Search views" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} aria-label="Search views" />
      )}
      {shown.length === 0 ? (
        <Empty description={views?.length ? "No view matches" : "No saved views yet. Set filters and columns, then Views > Save current view."} />
      ) : (
        <ul className="tpo-views-manager__list" data-testid="views-manager.list">
          {shown.map((v) => {
            const touched = lastTouched(v);
            const unused = touched && moment().diff(touched, "days") >= UNUSED_DAYS;
            const count = countOf ? countOf(v) : null;
            const isEditing = editing?.id === v.id;
            const about = describe ? describe(v) : { note: "", rules: "", savedCount: null, savedAt: null };
            // "updated 2 days ago" once its filters were replaced after it was first saved.
            const savedAt = about.savedAt ? moment(about.savedAt) : null;
            const created = v.createdAt ? parsePlacementUtcDateTime(v.createdAt) : null;
            const updated = savedAt && created && savedAt.diff(created, "minutes") > 2;
            const pinned = Boolean(v.pinned) && v.pinned !== 0;
            return (
              <li key={v.id} className={`tpo-views-manager__row${v.id === viewId ? " is-open" : ""}`}>
                <Tooltip title={pinned ? "Unpin from the Views menu" : "Pin to the Views menu"}>
                  <Button type="text" size="small" aria-label={pinned ? `Unpin ${v.name}` : `Pin ${v.name}`} aria-pressed={pinned}
                    icon={pinned ? <StarFilled style={{ color: "#d4a017" }} /> : <StarOutlined />}
                    loading={busyId === `pin:${v.id}`} onClick={() => onTogglePin(v)} />
                </Tooltip>
                <div className="tpo-views-manager__main">
                  {isEditing ? (
                    <div className="tpo-views-manager__edit">
                      <Input size="small" autoFocus maxLength={100} value={editing.name} aria-label="View name"
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      <Input size="small" maxLength={200} value={editing.note} aria-label="What it is for" placeholder="What it's for (optional)"
                        onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
                      <span className="tpo-views-manager__edit-actions">
                        <Button size="small" type="primary" loading={saving} disabled={!editing.name.trim()}
                          onClick={async () => { setSaving(true); const ok = await onEdit(v, { name: editing.name.trim(), note: editing.note }); setSaving(false); if (ok) setEditing(null); }}>Save</Button>
                        <Button size="small" onClick={() => setEditing(null)}>Cancel</Button>
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="tpo-views-manager__name">
                        {v.name}
                        {v.id === viewId && <Tag className="tpo-views-manager__tag" color="processing">Open now</Tag>}
                        {unused && <Tag className="tpo-views-manager__tag">Not used in {UNUSED_DAYS}+ days</Tag>}
                      </span>
                      {about.note && <span className="tpo-views-manager__note">{about.note}</span>}
                      {about.rules && <span className="tpo-views-manager__rules" title={about.rules}>{about.rules}</span>}
                    </>
                  )}
                  <Typography.Text type="secondary" className="tpo-views-manager__meta">
                    {[
                      count != null ? `${count.toLocaleString()} now` : null,
                      about.savedCount != null ? `${about.savedCount.toLocaleString()} when saved${savedAt ? ` (${savedAt.format("D MMM")})` : ""}` : null,
                      updated ? `updated ${savedAt.fromNow()}` : null,
                      touched ? `${v.lastUsedAt ? "used" : "saved"} ${touched.fromNow()}` : null,
                    ].filter(Boolean).join(" · ")}
                  </Typography.Text>
                </div>
                <div className="tpo-views-manager__actions">
                  <Button size="small" onClick={() => onOpen(v)}>Open</Button>
                  <Button size="small" icon={<DownloadOutlined />} loading={busyId === `xlsx:${v.id}`} onClick={() => onDownload(v, "xlsx")}>Excel</Button>
                  <Button size="small" icon={<DownloadOutlined />} loading={busyId === `csv:${v.id}`} onClick={() => onDownload(v, "csv")}>CSV</Button>
                  <Dropdown trigger={["click"]} menu={{
                    items: [
                      { key: "edit", label: "Edit name and note" },
                      { key: "update", label: "Update with the current filters and columns" },
                      { type: "divider" },
                      { key: "delete", label: "Delete", danger: true },
                    ],
                    onClick: ({ key }) => {
                      if (key === "edit") setEditing({ id: v.id, name: v.name, note: about.note || "" });
                      if (key === "update") onUpdate(v);
                      if (key === "delete") onDelete(v);
                    },
                  }}>
                    <Button size="small" type="text" icon={<MoreOutlined />} aria-label={`More for ${v.name}`} />
                  </Dropdown>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
