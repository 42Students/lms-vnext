import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Row, Col, Input, Button, Popconfirm, message, Modal } from "antd";
import { DeleteOutlined, TrophyOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const { TextArea } = Input;

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

export default function Awards({
  awards = [],
  awardParams,
  setAwardParams,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [awardData, setAwardData] = useState([]);
  const [newAward, setNewAward] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (awards) {
      setAwardData([...awards]);
    } else {
      setAwardData([]);
    }
    // Reset edit/add states if list becomes empty after deletion
    if (awards && awards.length === 0 && (awardParams?.editClicked || awardParams?.addClicked)) {
      setAwardParams({ editClicked: false, addClicked: false });
      setNewAward({});
    }
  }, [awards]);

  const isSaveDisabled = () => {
    if (awardParams.addClicked) {
      return !newAward.title || !newAward.title.trim();
    }
    if (awardParams.editClicked) {
      return awardData.some(award => !award.title || !award.title.trim());
    }
    return false;
  };

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {awardParams?.addClicked && (
          <div className="d-flex gap-3">
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<TrophyOutlined />} />
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={18}>
                  <div>
                    <div className="mb-1">
                      <span className="fnt-13 clrgray2BB">Award/Recognition Title</span>
                      <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                    </div>
                    <Input
                      className={errors.title ? "ln-in2 error" : "ln-in2"}
                      placeholder="Award/Recognition Title"
                      value={newAward.title || ""}
                      onChange={e => {
                        setNewAward({ ...newAward, title: e.target.value });
                        if (errors.title) {
                          setErrors({ ...errors, title: "" });
                        }
                      }}
                      onBlur={() => {
                        if (!newAward.title || !newAward.title.trim()) {
                          setErrors({ ...errors, title: "Award title is required" });
                        } else {
                          setErrors({ ...errors, title: "" });
                        }
                      }}
                    />
                    {errors.title && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.title}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} sm={6}>
                  <Input
                    className="ln-in2"
                    placeholder="Year"
                    onChange={e => setNewAward({ ...newAward, year: e.target.value })}
                  />
                </Col>
                <Col span={24}>
                  <Input
                    className="ln-in2"
                    placeholder="Awarded By"
                    onChange={e => setNewAward({ ...newAward, awardedBy: e.target.value })}
                  />
                </Col>
                <Col span={24}>
                  <RichTextEditor
                    value={newAward?.description || ""}
                    onChange={(content) => setNewAward({ ...newAward, description: content })}
                    placeholder="Enter description (supports bullet points, formatting, etc.)"
                    height={250}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}

        {awardData?.map((award, index) => (
          <div className="d-flex gap-3" key={index}>
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<TrophyOutlined />} />
            {awardParams?.editClicked ? (
              <div className="w-100">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={18}>
                    <div>
                      <div className="mb-1">
                        <span className="fnt-13 clrgray2BB">Award Title</span>
                        <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                      </div>
                      <Input
                        value={award?.title || ""}
                        className={errors[`title_${index}`] ? "ln-in2 error" : "ln-in2"}
                        placeholder="Award Title"
                        onChange={e => {
                          const updated = [...awardData];
                          updated[index].title = e.target.value;
                          setAwardData(updated);
                          if (errors[`title_${index}`]) {
                            setErrors({ ...errors, [`title_${index}`]: "" });
                          }
                        }}
                        onBlur={() => {
                          if (!award?.title || !award.title.trim()) {
                            setErrors({ ...errors, [`title_${index}`]: "Award title is required" });
                          } else {
                            setErrors({ ...errors, [`title_${index}`]: "" });
                          }
                        }}
                      />
                      {errors[`title_${index}`] && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {errors[`title_${index}`]}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Input
                      value={award?.year}
                      className="ln-in2"
                      placeholder="Year"
                      onChange={e => {
                        const updated = [...awardData];
                        updated[index].year = e.target.value;
                        setAwardData(updated);
                      }}
                    />
                  </Col>
                  <Col span={24}>
                    <Input
                      value={award?.awardedBy}
                      className="ln-in2"
                      placeholder="Awarded By"
                      onChange={e => {
                        const updated = [...awardData];
                        updated[index].awardedBy = e.target.value;
                        setAwardData(updated);
                      }}
                    />
                  </Col>
                  <Col span={24}>
                    <RichTextEditor
                      value={award?.description || ""}
                      onChange={(content) => {
                        const updated = [...awardData];
                        updated[index].description = content;
                        setAwardData(updated);
                      }}
                      placeholder="Enter description (supports bullet points, formatting, etc.)"
                      height={250}
                    />
                  </Col>
                  <Col span={24}>
                    <Popconfirm
                      title="Delete this award?"
                      description="This can't be undone."
                      onConfirm={() => onDelete && onDelete(index)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Delete Award
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
                      {award?.title}
                    </div>
                    {award?.awardedBy && (
                      <div className="fnt-1 clrgray2BB ln-lto-reg">{award.awardedBy}</div>
                    )}
                  </Col>
                  <Col className="fnt-13 clrgray7AE ln-lto-reg">
                    {award?.year}
                  </Col>
                </Row>
                <div className="ln-lto-reg clrFour my-2">
                  <RichTextDisplay content={award?.description} />
                </div>
              </div>
            )}
          </div>
        ))}
      </Space>

      {(awardParams?.editClicked || awardParams?.addClicked) && (
        <Row className="mt-3 w-100" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard award changes?",
              content: "Your unsaved award details will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setAwardData([...awards]);
                setNewAward({});
                setErrors({});
                setAwardParams({ editClicked: false, addClicked: false });
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
              if (awardParams.addClicked) {
                if (!newAward.title || !newAward.title.trim()) {
                  setErrors({ title: "Award title is required" });
                  message.error("Please fill in all required fields");
                  return;
                }
              }
              if (awardParams.editClicked) {
                let hasErrors = false;
                const newErrors = {};
                for (let i = 0; i < awardData.length; i++) {
                  if (!awardData[i].title || !awardData[i].title.trim()) {
                    newErrors[`title_${i}`] = "Award title is required";
                    hasErrors = true;
                  }
                }
                if (hasErrors) {
                  setErrors(newErrors);
                  message.error("Please fill in all required fields");
                  return;
                }
              }
              setSaving(true);
              try {
                if (awardParams.addClicked) {
                  if (await onAdd(newAward) === false) return;
                }
                if (awardParams.editClicked) {
                  for (let i = 0; i < awardData.length; i++) {
                    if (await onUpdate(i, awardData[i]) === false) return;
                  }
                }
                setNewAward({});
                setErrors({});
                setAwardParams({ editClicked: false, addClicked: false });
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
