import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Row, Col, Input, Button, Popconfirm, message, Modal } from "antd";
import { DeleteOutlined, TrophyOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

export default function Achievements({
  achievements = [],
  achievementParams,
  setAchievementParams,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const submittingRef = useRef(false);
  const [achievementData, setAchievementData] = useState([]);
  const [newAchievement, setNewAchievement] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (achievements) {
      setAchievementData([...achievements]);
    } else {
      setAchievementData([]);
    }
    // Reset edit/add states if list becomes empty after deletion
    if (achievements && achievements.length === 0 && (achievementParams?.editClicked || achievementParams?.addClicked)) {
      setAchievementParams({ editClicked: false, addClicked: false });
      setNewAchievement({});
    }
  }, [achievements]);

  const isSaveDisabled = () => {
    if (achievementParams.addClicked) {
      const hasTitle = newAchievement.title && newAchievement.title.trim();
      const hasDescription = newAchievement.description && newAchievement.description.trim();
      return !hasTitle && !hasDescription;
    }
    if (achievementParams.editClicked) {
      return achievementData.some(achievement => {
        const hasTitle = achievement.title && achievement.title.trim();
        const hasDescription = achievement.description && achievement.description.trim();
        return !hasTitle && !hasDescription;
      });
    }
    return false;
  };

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {achievementParams?.addClicked && (
          <div className="d-flex gap-3">
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<TrophyOutlined />} />
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={18}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Achievement Title</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <Input
                      className={errors.title ? "ln-in2 error" : "ln-in2"}
                      placeholder="Achievement Title"
                      value={newAchievement.title || ""}
                      onChange={e => {
                        setNewAchievement({ ...newAchievement, title: e.target.value });
                        if (errors.title) {
                          setErrors({ ...errors, title: "" });
                        }
                      }}
                      onBlur={() => {
                        const hasTitle = newAchievement.title && newAchievement.title.trim();
                        const hasDescription = newAchievement.description && newAchievement.description.trim();
                        if (!hasTitle && !hasDescription) {
                          setErrors({ ...errors, title: "Title or description is required", description: "Title or description is required" });
                        } else {
                          setErrors({ ...errors, title: "", description: "" });
                        }
                      }}
                    />
                    {errors.title && (
                      <div className="ln-form-error">
                        {errors.title}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} sm={6}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Year</span>
                    </div>
                    <Input
                      className="ln-in2"
                      placeholder="Year"
                      value={newAchievement.year || ""}
                      onChange={e => setNewAchievement({ ...newAchievement, year: e.target.value })}
                    />
                  </div>
                </Col>
                <Col span={24}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Description</span>
                      <span className="ln-required-asterisk">*</span>
                    </div>
                    <RichTextEditor
                      value={newAchievement?.description || ""}
                      onChange={(content) => {
                        setNewAchievement({ ...newAchievement, description: content });
                        if (errors.description) {
                          setErrors({ ...errors, description: "" });
                        }
                      }}
                      placeholder="Enter description (supports bullet points, formatting, etc.)"
                      height={250}
                    />
                    {errors.description && (
                      <div className="ln-form-error">
                        {errors.description}
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}

        {achievementData?.map((achievement, index) => (
          <div className="d-flex gap-3" key={index}>
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<TrophyOutlined />} />
            {achievementParams?.editClicked ? (
              <div className="w-100">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={18}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Achievement Title</span>
                        <span className="ln-required-asterisk">*</span>
                      </div>
                      <Input
                        value={achievement?.title || ""}
                        className={errors[`title_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="Achievement Title"
                        onChange={e => {
                          const updated = [...achievementData];
                          updated[index].title = e.target.value;
                          setAchievementData(updated);
                          if (errors[`title_${index}`]) {
                            setErrors({ ...errors, [`title_${index}`]: "", [`description_${index}`]: "" });
                          }
                        }}
                        onBlur={() => {
                          const hasTitle = achievement?.title && achievement.title.trim();
                          const hasDescription = achievement?.description && achievement.description.trim();
                          if (!hasTitle && !hasDescription) {
                            setErrors({ ...errors, [`title_${index}`]: "Title or description is required", [`description_${index}`]: "Title or description is required" });
                          } else {
                            setErrors({ ...errors, [`title_${index}`]: "", [`description_${index}`]: "" });
                          }
                        }}
                      />
                      {errors[`title_${index}`] && (
                        <div className="ln-form-error">
                          {errors[`title_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} sm={6}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Year</span>
                      </div>
                      <Input
                        value={achievement?.year || ""}
                        className="ln-in2"
                        placeholder="Year"
                        onChange={e => {
                          const updated = [...achievementData];
                          updated[index].year = e.target.value;
                          setAchievementData(updated);
                        }}
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Description</span>
                        <span className="ln-required-asterisk">*</span>
                      </div>
                      <RichTextEditor
                        value={achievement?.description || ""}
                        onChange={(content) => {
                          const updated = [...achievementData];
                          updated[index].description = content;
                          setAchievementData(updated);
                          if (errors[`description_${index}`]) {
                            setErrors({ ...errors, [`title_${index}`]: "", [`description_${index}`]: "" });
                          }
                        }}
                        placeholder="Enter description (supports bullet points, formatting, etc.)"
                        height={250}
                      />
                      {errors[`description_${index}`] && (
                        <div className="ln-form-error">
                          {errors[`description_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col span={24}>
                    <Popconfirm
                      title="Delete this achievement?"
                      description="This can't be undone."
                      onConfirm={() => onDelete && onDelete(index)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button danger icon={<DeleteOutlined />} aria-label={`Delete achievement ${achievement.title || index + 1}`}>
                        Delete Achievement
                      </Button>
                    </Popconfirm>
                  </Col>
                </Row>
              </div>
            ) : (
              <div className="w-100">
                <Row justify="space-between" align="top">
                  <Col>
                    <div className="ln-lto-bold clrB517" style={{ fontSize: "16px" }}>
                      {achievement?.title}
                    </div>
                  </Col>
                  <Col className="fnt-13 clrgray7AE ln-lto-reg">
                    {achievement?.year}
                  </Col>
                </Row>
                <div className="ln-lto-reg clrFour my-2">
                  <RichTextDisplay content={achievement?.description} />
                </div>
              </div>
            )}
          </div>
        ))}
      </Space>

      {(achievementParams?.editClicked || achievementParams?.addClicked) && (
        <Row className="mt-3 w-100" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard achievement changes?",
              content: "Your unsaved achievement details will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setAchievementData([...achievements]);
                setNewAchievement({});
                setErrors({});
                setAchievementParams({ editClicked: false, addClicked: false });
              },
            })}
          />
          <CustomButton
            styleClass="ms-2"
            title="Save"
            buttonType="primary"
            disabled={isSaveDisabled() || saving}
            loading={saving}
            onClick={async () => {
              if (submittingRef.current || saving) return;
              submittingRef.current = true;
              setSaving(true);
              try {
                if (achievementParams.addClicked) {
                  const hasTitle = newAchievement.title && newAchievement.title.trim();
                  const hasDescription = newAchievement.description && newAchievement.description.trim();
                  if (!hasTitle && !hasDescription) {
                    setErrors({ title: "Title or description is required", description: "Title or description is required" });
                    message.error("Please fill in at least title or description");
                    return;
                  }
                  if (await onAdd(newAchievement) === false) return;
                }
                if (achievementParams.editClicked) {
                  let hasErrors = false;
                  const newErrors = {};
                  for (let i = 0; i < achievementData.length; i++) {
                    const hasTitle = achievementData[i].title && achievementData[i].title.trim();
                    const hasDescription = achievementData[i].description && achievementData[i].description.trim();
                    if (!hasTitle && !hasDescription) {
                      newErrors[`title_${i}`] = "Title or description is required";
                      newErrors[`description_${i}`] = "Title or description is required";
                      hasErrors = true;
                    }
                  }
                  if (hasErrors) {
                    setErrors(newErrors);
                    message.error("Please fill in all required fields");
                    return;
                  }
                  for (let i = 0; i < achievementData.length; i++) {
                    if (await onUpdate(i, achievementData[i]) === false) return;
                  }
                }
                setNewAchievement({});
                setErrors({});
                setAchievementParams({ editClicked: false, addClicked: false });
              } finally {
                submittingRef.current = false;
                setSaving(false);
              }
            }}
          />
        </Row>
      )}
    </>
  );
}
