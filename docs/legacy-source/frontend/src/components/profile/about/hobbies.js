import CustomButton from "@/components/Global/Button/button";
import { Space, Tag, Row, Input, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

export default function Hobbies({
  hobbies = [],
  hobbiesEdit,
  setHobbiesEdit,
  onUpdate,
}) {
  const [hobbiesData, setHobbiesData] = useState([]);
  const [newHobby, setNewHobby] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Don't resync from the prop while the user is actively editing: about.js's own section
    // fetches (Promise.allSettled in loadAllData) can still be in flight when the page first
    // renders, and a slow one resolving after the user has already opened this section would
    // otherwise reset the tag list (and, via key churn, the input/Add button) out from under
    // them mid-edit.
    if (hobbiesEdit) return;
    if (hobbies?.length > 0) {
      setHobbiesData([...hobbies]);
    } else {
      setHobbiesData([]);
    }
  }, [hobbies, hobbiesEdit]);

  const handleAddHobby = () => {
    if (newHobby.trim()) {
      setHobbiesData([...hobbiesData, { hobby: newHobby.trim() }]);
      setNewHobby("");
    }
  };

  const handleRemoveHobby = (index) => {
    const updated = hobbiesData.filter((_, i) => i !== index);
    setHobbiesData(updated);
  };

  return (
    <>
      {!hobbiesEdit ? (
        <Space wrap size={[8, 8]}>
          {hobbiesData?.length > 0 ? (
            hobbiesData.map((hobby, index) => (
              <Tag key={index} color="geekblue" className="py-1 px-3 fnt-14">
                {hobby.hobby || hobby}
              </Tag>
            ))
          ) : (
            <div className="profile-empty-state">No hobbies added</div>
          )}
        </Space>
      ) : (
        <Space direction="vertical" className="w-100" size={12}>
          <Space wrap size={[8, 8]}>
            {hobbiesData.map((hobby, index) => (
              <Tag
                key={index}
                closable
                onClose={() => handleRemoveHobby(index)}
                color="geekblue"
                className="py-1 px-3 fnt-14"
              >
                {hobby.hobby || hobby}
              </Tag>
            ))}
          </Space>
          <Space wrap>
            <Input
              placeholder="Add a hobby"
              value={newHobby}
              onChange={e => setNewHobby(e.target.value)}
              onPressEnter={handleAddHobby}
              style={{ width: 200 }}
            />
            <CustomButton
              title="Add"
              buttonType="primary"
              icon={<PlusOutlined />}
              onClick={handleAddHobby}
            />
          </Space>
        </Space>
      )}

      {hobbiesEdit && (
        <Row className="profile-section-actions" justify="end">
          <CustomButton
            title="Cancel"
            buttonType="primary"
            disabled={saving}
            onClick={() => Modal.confirm({
              title: "Discard hobby changes?",
              content: "Your unsaved hobby edits will be lost.",
              okText: "Discard changes",
              okButtonProps: { danger: true },
              cancelText: "Keep editing",
              onOk: () => {
                setHobbiesData([...hobbies]);
                setNewHobby("");
                setHobbiesEdit(false);
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
                const saved = await onUpdate(hobbiesData);
                if (saved !== false) setHobbiesEdit(false);
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
