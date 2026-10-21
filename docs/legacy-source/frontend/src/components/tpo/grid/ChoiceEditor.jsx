import { useEffect, useRef, useState } from "react";

/**
 * The cell editor for a fixed list of choices (a dropdown cell in a sheet). It opens with the options already showing: one click on
 * the cell, then a click or Up/Down + Enter picks; Esc leaves the cell as it was. The free AG Grid select editor opened collapsed and
 * needed a second click.
 *
 * Use as a popup editor: { cellEditor: ChoiceEditor, cellEditorPopup: true, cellEditorParams: { options: [{ value, label }] } }.
 * Props from the grid (reactive custom components): value, onValueChange, stopEditing, options, colDef.
 */
export default function ChoiceEditor({ value, onValueChange, stopEditing, options = [], colDef }) {
  const start = Math.max(0, options.findIndex((o) => String(o.value) === String(value ?? "")));
  const [active, setActive] = useState(start);
  const listRef = useRef(null);
  useEffect(() => { listRef.current?.focus(); }, []);
  useEffect(() => { listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" }); }, [active]);

  const pick = (o) => { onValueChange?.(o.value); setTimeout(() => stopEditing?.(), 0); };
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === "Tab") { if (options[active]) { e.preventDefault(); e.stopPropagation(); pick(options[active]); } }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); stopEditing?.(true); }
  };

  return (
    <div
      ref={listRef} role="listbox" tabIndex={-1} className="tpo-choice-editor" onKeyDown={onKeyDown}
      aria-label={colDef?.headerName ? `Choose ${colDef.headerName}` : "Choose"} aria-activedescendant={`tpo-choice-${active}`}
    >
      {options.map((o, i) => (
        <button
          type="button" role="option" key={String(o.value)} id={`tpo-choice-${i}`} data-index={i} aria-selected={String(o.value) === String(value ?? "")}
          className={`tpo-choice-editor__option${i === active ? " is-active" : ""}${String(o.value) === String(value ?? "") ? " is-current" : ""}`}
          onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** While the choice editor is open its keys are its own: the grid would otherwise finish editing on Enter before the pick is saved. */
export const choiceEditorKeys = (params) => Boolean(params.editing) && ["Enter", "ArrowUp", "ArrowDown", "Tab", "Escape"].includes(params.event?.key);

/** Everything a column needs to edit with the choice editor. options: [{ value, label }]. */
export const choiceEditor = (options) => ({
  cellEditor: ChoiceEditor, cellEditorPopup: true, cellEditorParams: { options }, suppressKeyboardEvent: choiceEditorKeys,
});
