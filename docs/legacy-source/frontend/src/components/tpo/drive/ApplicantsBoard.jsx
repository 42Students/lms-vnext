import { useState } from "react";
import { Select, Tag, Typography } from "antd";
import { fullName } from "../tpoFiles";
import { BOARD_COLUMNS, canMove } from "../ui/applicantRules";

/**
 * Applicants as a board: one column per stage, a card per student. Drag a card to a column to move it (the page shows who will be told
 * before anything happens); the "Move to" picker on each card does the same without a mouse.
 *
 * Props: rows, onMove(row, toStage), onOpenStudent(row), readOnly
 */
export default function ApplicantsBoard({ rows, onMove, onOpenStudent, readOnly }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const dragged = rows.find((r) => r.applicationId === dragId);

  return (
    <div className="tpo-board" role="group" aria-label="Applicants by stage">
      {BOARD_COLUMNS.map((col) => {
        const cards = rows.filter((r) => r.stage === col.key);
        const droppable = Boolean(dragged) && canMove(dragged.stage, col.key);
        return (
          <section
            key={col.key}
            className={`tpo-board__col${overCol === col.key && droppable ? " is-over" : ""}${dragged && !droppable ? " is-blocked" : ""}`}
            aria-label={`${col.label}, ${cards.length}`}
            onDragOver={(e) => { if (droppable) { e.preventDefault(); setOverCol(col.key); } }}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => { e.preventDefault(); const row = dragged; setDragId(null); setOverCol(null); if (row && canMove(row.stage, col.key)) onMove(row, col.key); }}
          >
            <header><strong>{col.label}</strong><Tag>{cards.length}</Tag></header>
            <div className="tpo-board__cards">
              {cards.length === 0 && <Typography.Text type="secondary" className="tpo-board__empty">{droppable ? "Drop here" : "Nobody here"}</Typography.Text>}
              {cards.map((r) => (
                <article
                  key={r.applicationId}
                  className={`tpo-board__card${dragId === r.applicationId ? " is-dragging" : ""}`}
                  draggable={!readOnly}
                  onDragStart={(e) => { setDragId(r.applicationId); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                >
                  <button type="button" className="tpo-board__name" onClick={() => onOpenStudent?.(r)}>{fullName(r) || `#${r.learnerId}`}</button>
                  <span className="tpo-board__meta">{[r.rollNumber, r.branch].filter(Boolean).join(" · ")}</span>
                  <span className="tpo-board__meta">CGPA {r.cgpa == null ? "n/a" : r.cgpa}</span>
                  {!readOnly && (
                    <Select
                      size="small" placeholder="Move to…" className="tpo-board__move" aria-label={`Move ${fullName(r)}`}
                      value={undefined}
                      options={BOARD_COLUMNS.filter((c) => canMove(r.stage, c.key)).map((c) => ({ value: c.key, label: c.label }))}
                      onChange={(to) => onMove(r, to)}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
