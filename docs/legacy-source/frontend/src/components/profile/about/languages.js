import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Row, Col, Input, Select, Button, Popconfirm, Tag, Modal } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";

const proficiencyLevels = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"];

export default function Languages({
  languages = [],
  languageParams,
  setLanguageParams,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [languageData, setLanguageData] = useState([]);
  const [newLanguage, setNewLanguage] = useState({});
  const [saving, setSaving] = useState(false);
  // Tracks the previous list length so the empty-list reset below only fires on a genuine
  // deletion-emptied-the-list transition, not on every render where the list happens to be
  // empty -- including the very first one, before the initial fetch has even resolved (about.js
  // loads every section in parallel; a slow one can still be in flight after the user has
  // already opened this section's add form and started typing).
  const prevLanguagesLengthRef = useRef(languages.length);

  useEffect(() => {
    if (languages) {
      setLanguageData([...languages]);
    } else {
      setLanguageData([]);
    }
    // Reset edit/add states if list becomes empty after deletion (a real >0 -> 0 transition).
    const prevLength = prevLanguagesLengthRef.current;
    const nowEmpty = languages && languages.length === 0;
    if (nowEmpty && prevLength > 0 && (languageParams?.editClicked || languageParams?.addClicked)) {
      setLanguageParams({ editClicked: false, addClicked: false });
      setNewLanguage({});
    }
    prevLanguagesLengthRef.current = languages ? languages.length : 0;
  }, [languages]);

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {languageParams?.addClicked && (
          <div className="d-flex gap-3">
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-translate"></i>} />
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <Input
                    value={newLanguage.language ?? ""}
                    className="ln-in2"
                    placeholder="Language (e.g., English, Hindi)"
                    onChange={e => setNewLanguage({ ...newLanguage, language: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Select
                    value={newLanguage.proficiency ?? undefined}
                    className="w-100"
                    placeholder="Proficiency Level"
                    onChange={value => setNewLanguage({ ...newLanguage, proficiency: value })}
                    options={proficiencyLevels.map(level => ({ value: level, label: level }))}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}

        {!languageParams?.editClicked && !languageParams?.addClicked && (
          <Space wrap size={[8, 8]}>
            {languageData?.length === 0 && (
              <div className="profile-empty-state">No languages added</div>
            )}
            {languageData?.map((lang, index) => (
              <Tag key={index} color="blue" className="py-2 px-3 fnt-14">
                {lang.language} - <span className="fnt-12">{lang.proficiency}</span>
              </Tag>
            ))}
          </Space>
        )}

        {languageParams?.editClicked && languageData?.map((lang, index) => (
          <div className="d-flex gap-3" key={index}>
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-translate"></i>} />
            <div className="w-100">
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} sm={10}>
                  <Input
                    value={lang?.language}
                    className="ln-in2"
                    placeholder="Language"
                    onChange={e => {
                      const updated = [...languageData];
                      updated[index].language = e.target.value;
                      setLanguageData(updated);
                    }}
                  />
                </Col>
                <Col xs={24} sm={10}>
                  <Select
                    value={lang?.proficiency}
                    className="w-100"
                    placeholder="Proficiency"
                    onChange={value => {
                      const updated = [...languageData];
                      updated[index].proficiency = value;
                      setLanguageData(updated);
                    }}
                    options={proficiencyLevels.map(level => ({ value: level, label: level }))}
                  />
                </Col>
                <Col xs={24} sm={4}>
                  <Popconfirm
                    title="Delete this language?"
                    description="This can't be undone."
                    onConfirm={() => onDelete && onDelete(index)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={`Delete language ${lang?.language || index + 1}`}
                    />
                  </Popconfirm>
                </Col>
              </Row>
            </div>
          </div>
        ))}
      </Space>

      {(languageParams?.editClicked || languageParams?.addClicked) && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard language changes?",
              content: "Your unsaved language edits will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setLanguageData([...languages]);
                setNewLanguage({});
                setLanguageParams({ editClicked: false, addClicked: false });
              },
            })}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            disabled={saving}
            loading={saving}
            onClick={async () => {
              if (languageParams.addClicked && !newLanguage.language?.trim()) {
                return; // language name required
              }
              setSaving(true);
              try {
                if (languageParams.addClicked) {
                  if (await onAdd({ proficiency: "Intermediate", ...newLanguage }) === false) return;
                }
                if (languageParams.editClicked) {
                  for (let i = 0; i < languageData.length; i++) {
                    if (await onUpdate(i, languageData[i]) === false) return;
                  }
                }
                setNewLanguage({});
                setLanguageParams({ editClicked: false, addClicked: false });
              } finally {
                setSaving(false);
              }
            }}
          />
        </Row>
      )}
    </>
  );
}
