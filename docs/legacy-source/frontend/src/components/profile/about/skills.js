import CustomButton from "@/components/Global/Button/button";
import { Row, Space, Tag, Tooltip, Modal } from "antd";
import { useEffect, useState } from "react";
import SkillsAutocomplete from "@/components/Global/SkillsAutocomplete";

export default function Skills({
  skills = [],
  skillsEditable,
  setSkillsEdit,
  saveProfileDetails,
}) {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Convert skills from backend format (array of strings or SkillDTO objects) to component format
  useEffect(() => {
    if (skills && skills.length > 0) {
      // Handle both formats: array of strings or array of SkillDTO objects
      const convertedSkills = skills.map((skill) => {
        if (typeof skill === "string") {
          // Legacy format: just a string
          return { skill, proficiency: "Intermediate" };
        } else if (skill && skill.skill) {
          // SkillDTO format: {skill: string, proficiency: string}
          return { skill: skill.skill, proficiency: skill.proficiency || "Intermediate" };
        }
        return null;
      }).filter(Boolean);
      setSelectedSkills(convertedSkills);
    } else {
      setSelectedSkills([]);
    }
  }, [skills]);

  const originalSkills = () => (skills && skills.length > 0
    ? skills.map(s => typeof s === "string" ? { skill: s, proficiency: "Intermediate" } : {
        skill: s?.skill || "",
        proficiency: s?.proficiency || "Intermediate",
      }).filter(s => s.skill)
    : []);
  const requestCancel = () => {
    if (isSaving) return;
    if (JSON.stringify(selectedSkills) === JSON.stringify(originalSkills())) {
      setSkillsEdit(false);
      return;
    }
    Modal.confirm({
      title: "Discard skill changes?",
      content: "Your unsaved skill edits will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setSelectedSkills(originalSkills());
        setSkillsEdit(false);
      },
    });
  };

  // Handle skills change from autocomplete
  const handleSkillsChange = (newSkills) => {
    setSelectedSkills(newSkills);
  };

  // Display skills in view mode
  if (!skillsEditable) {
    return (
      <Space size={16} wrap>
        {selectedSkills.length === 0 && (
          <div className="profile-empty-state">No skills added</div>
        )}
        {selectedSkills.map((skillObj, index) => {
          const skillName = typeof skillObj === "string" ? skillObj : skillObj.skill;
          const isLongTag = skillName?.length > 20;
          const tagElem = (
            <Tag
              key={`${skillName}-${index}`}
              className="bg-white9FC clrFour py-2 px-3 border-0 ln-lto-bold fnt-14"
            >
              {isLongTag ? `${skillName.slice(0, 20)}...` : skillName}
              {skillObj.proficiency && (
                <span style={{ marginLeft: 8, fontSize: "12px", opacity: 0.7 }}>
                  ({skillObj.proficiency})
                </span>
              )}
            </Tag>
          );
          return isLongTag ? (
            <Tooltip title={skillName} key={`${skillName}-${index}`}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}
      </Space>
    );
  }

  // Editable mode with autocomplete
  return (
    <>
      <SkillsAutocomplete
        value={selectedSkills}
        onChange={handleSkillsChange}
        allowProficiency={true}
        placeholder="Search and select skills..."
        maxResults={20}
        disabled={false}
      />
      {skillsEditable && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title={"Cancel"}
            buttonType={"primary"}
            disabled={isSaving}
            onClick={requestCancel}
          />
          <CustomButton
            styleClass={"ms-2"}
            title={"Save"}
            buttonType={"primary"}
            loading={isSaving}
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                // Convert to backend format (array of SkillDTO objects)
                const skillsToSave = selectedSkills.map(s => ({
                  skill: typeof s === "string" ? s : s.skill,
                  proficiency: typeof s === "string" ? "Intermediate" : (s.proficiency || "Intermediate")
                }));
                const saved = await saveProfileDetails({
                  skills: skillsToSave,
                });
                if (saved !== false) setSkillsEdit(false);
              } finally {
                setIsSaving(false);
              }
            }}
          />
        </Row>
      )}
    </>
  );
}
