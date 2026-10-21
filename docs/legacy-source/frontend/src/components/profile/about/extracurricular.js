import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Row, Col, Input, Button, Popconfirm, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const { TextArea } = Input;

const RichTextEditor = dynamic(() => import("@/components/Global/RichTextEditor/RichTextEditor"), { ssr: false });
const RichTextDisplay = dynamic(() => import("@/components/Global/RichTextEditor/RichTextDisplay"), { ssr: false });

export default function Extracurricular({
  activities = [],
  activityParams,
  setActivityParams,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [activityData, setActivityData] = useState([]);
  const [newActivity, setNewActivity] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activities) {
      setActivityData([...activities]);
    } else {
      setActivityData([]);
    }
    // Reset edit/add states if list becomes empty after deletion
    if (activities && activities.length === 0 && (activityParams?.editClicked || activityParams?.addClicked)) {
      setActivityParams({ editClicked: false, addClicked: false });
      setNewActivity({});
    }
  }, [activities]);

  return (
    <>
      <Space className="w-100" direction="vertical" size={16}>
        {activityParams?.addClicked && (
          <div className="d-flex gap-3">
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-stars"></i>} />
            <div className="w-100">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={18}>
                  <Input
                    className="ln-in2"
                    placeholder="Activity Name (e.g., Cricket Team Captain)"
                    onChange={e => setNewActivity({ ...newActivity, activity: e.target.value })}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Input
                    className="ln-in2"
                    placeholder="Year"
                    onChange={e => setNewActivity({ ...newActivity, year: e.target.value })}
                  />
                </Col>
                <Col span={24}>
                  <RichTextEditor
                    value={newActivity?.description || ""}
                    onChange={(content) => setNewActivity({ ...newActivity, description: content })}
                    placeholder="Enter description (supports bullet points, formatting, etc.)"
                    height={250}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}

        {activityData?.map((activity, index) => (
          <div className="d-flex gap-3" key={index}>
            <Avatar shape="square" className="bg-white9FC clrFour" icon={<i className="bi bi-stars"></i>} />
            {activityParams?.editClicked ? (
              <div className="w-100">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={18}>
                    <Input
                      value={activity?.activity}
                      className="ln-in2"
                      placeholder="Activity Name"
                      onChange={e => {
                        const updated = [...activityData];
                        updated[index].activity = e.target.value;
                        setActivityData(updated);
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Input
                      value={activity?.year}
                      className="ln-in2"
                      placeholder="Year"
                      onChange={e => {
                        const updated = [...activityData];
                        updated[index].year = e.target.value;
                        setActivityData(updated);
                      }}
                    />
                  </Col>
                  <Col span={24}>
                    <RichTextEditor
                      value={activity?.description || ""}
                      onChange={(content) => {
                        const updated = [...activityData];
                        updated[index].description = content;
                        setActivityData(updated);
                      }}
                      placeholder="Enter description (supports bullet points, formatting, etc.)"
                      height={250}
                    />
                  </Col>
                  <Col span={24}>
                    <Popconfirm
                      title="Delete this activity?"
                      description="This can't be undone."
                      onConfirm={() => onDelete && onDelete(index)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Delete Activity
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
                      {activity?.activity}
                    </div>
                  </Col>
                  <Col className="fnt-13 clrgray7AE ln-lto-reg">
                    {activity?.year}
                  </Col>
                </Row>
                <div className="ln-lto-reg clrFour my-2">
                  <RichTextDisplay content={activity?.description} />
                </div>
              </div>
            )}
          </div>
        ))}
      </Space>

      {(activityParams?.editClicked || activityParams?.addClicked) && (
        <Row className="mt-3 w-100" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard activity changes?",
              content: "Your unsaved activity details will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setActivityData([...activities]);
                setNewActivity({});
                setActivityParams({ editClicked: false, addClicked: false });
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
              setSaving(true);
              try {
                if (activityParams.addClicked && (newActivity.activity || newActivity.description)) {
                  if (await onAdd(newActivity) === false) return;
                }
                if (activityParams.editClicked) {
                  for (let i = 0; i < activityData.length; i++) {
                    if (await onUpdate(i, activityData[i]) === false) return;
                  }
                }
                setNewActivity({});
                setActivityParams({ editClicked: false, addClicked: false });
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
