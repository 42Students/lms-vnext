"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LearnerSkillCatalogInput, type CatalogSkillItem, type CatalogSkillSelection } from "./learner-skill-catalog-input";
import {Select} from "@/components/ui/select";

/**
 * Controlled multi-skill editor for screens that store an array of skill
 * records. Existing one-skill profile rows continue to use the single editor.
 * Names, stable catalog UUIDs and proficiency survive subsequent edits.
 */
export function LearnerSkillCatalogMultiInput({
  value,
  onChange,
  allowProficiency = true,
  disabled = false,
  showPopular = true,
  showRecent = true,
  maxResults = 15,
}: {
  value: readonly CatalogSkillSelection[];
  onChange: (value: CatalogSkillSelection[]) => void;
  allowProficiency?: boolean;
  disabled?: boolean;
  showPopular?: boolean;
  showRecent?: boolean;
  maxResults?: number;
}) {
  const [draft, setDraft] = useState("");
  const [recent, setRecent] = useState<CatalogSkillSelection[]>([]);
  const [feedback, setFeedback] = useState("");
  const justSelected = useRef<string | null>(null);

  useEffect(() => {
    if (!showRecent) return;
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem("lms_recent_skills") || "[]");
      if (Array.isArray(stored)) {
        setRecent(stored.filter((item): item is CatalogSkillSelection =>
          Boolean(item) && typeof item === "object" &&
          "skill" in item && typeof item.skill === "string"
        ).slice(0, 5));
      }
    } catch {
      setRecent([]);
    }
  }, [showRecent]);

  function remember(skill: CatalogSkillSelection) {
    if (!showRecent) return;
    const updated = [skill, ...recent.filter(item =>
      item.skill.toLocaleLowerCase("en-US") !== skill.skill.toLocaleLowerCase("en-US")
    )].slice(0, 10);
    setRecent(updated.slice(0, 5));
    try { window.localStorage.setItem("lms_recent_skills", JSON.stringify(updated)); }
    catch { /* Storage may be disabled; the current selection remains valid. */ }
  }

  function add(selection: CatalogSkillSelection) {
    const name = selection.skill.trim();
    if (!name || value.some(item => item.skill.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US"))) {
      setFeedback("This skill is already selected.");
      return;
    }
    const added: CatalogSkillSelection = {
      skill: name,
      ...(selection.skillId ? { skillId: selection.skillId } : {}),
      ...(allowProficiency ? { proficiency: selection.proficiency || "Intermediate" } : {}),
    };
    onChange([...value, added]);
    remember(added);
    setDraft("");
    setFeedback("");
  }

  function selectCatalogItem(item: CatalogSkillItem) {
    justSelected.current = item.displayName;
    add({ skill: item.displayName, skillId: item.id });
  }

  function addFreeText() {
    const skill = draft.trim();
    if (!skill || disabled) return;
    add({ skill });
    if (skill.length > 200) return;
    void fetch("/api/skills/selection", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId: crypto.randomUUID(), freeTextSkills: [skill] }),
    }).then(response => {
      if (!response.ok && response.status !== 503) setFeedback("Couldn't record skill selection");
    }).catch(() => setFeedback("Couldn't record skill selection"));
  }

  return <div className="min-w-0 space-y-3" role="group" aria-label="Selected skills">
    <div className="flex min-w-0 items-end gap-2">
      <div className="min-w-0 flex-1">
        <LearnerSkillCatalogInput
          value={draft}
          disabled={disabled}
          showPopular={showPopular}
          maxResults={maxResults}
          onSelectSkill={selectCatalogItem}
          onChange={next => {
            if (justSelected.current === next) { justSelected.current = null; setDraft(""); return; }
            setDraft(next);
          }}
        />
      </div>
      <Button type="button" disabled={disabled || !draft.trim() || draft.trim().length > 200}
        onClick={addFreeText}>Add</Button>
    </div>
    {showRecent && recent.length > 0 ? <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Recent skills</span>
      {recent.filter(item => !value.some(selected => selected.skill === item.skill)).map(item =>
        <Button key={item.skill} type="button" size="sm" variant="secondary"
          disabled={disabled} onClick={() => add(item)}>{item.skill}</Button>
      )}
    </div> : null}
    {value.length ? <ul className="m-0 list-none space-y-2 p-0">
      {value.map((item, index) => <li key={item.skillId || item.skill + index}
        className="flex min-w-0 flex-wrap items-center gap-2 rounded-[var(--lms-radius-md)] border border-border px-3 py-2">
        <span className="min-w-0 flex-1 break-words text-sm text-body">{item.skill}</span>
        {allowProficiency ? <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Proficiency
          <Select 
            disabled={disabled} value={item.proficiency || "Intermediate"} onChange={event => {
              onChange(value.map((skill, itemIndex) =>
                itemIndex === index ? { ...skill, proficiency: event.target.value } : skill
              ));
            }}>
            {["Beginner", "Intermediate", "Advanced", "Expert"].map(level =>
              <option key={level} value={level}>{level}</option>
            )}
          </Select>
        </label> : null}
        <Button type="button" size="sm" variant="ghost" disabled={disabled}
          onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
      </li>)}
    </ul> : <p className="text-sm text-muted-foreground">No skills selected yet.</p>}
    {feedback ? <p role="status" className="text-sm text-body">{feedback}</p> : null}
  </div>;
}
