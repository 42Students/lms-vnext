import React from "react";
import { Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const ActionAssignment = ({ onEdit, onDelete, deleting = false, deleteDisabled = false, mutationBusy = false }) => {
  const loginUser = useSelector((state) => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";

  if (!isTeacherRole) return null;

  return (
    <div className="learn-assignment-actions">
      <div className="learn-assignment-actions__icons">
        <button
          type="button"
          className="learn-assignment-actions__icon"
          disabled={mutationBusy}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          aria-label="Edit assignment"
          title="Edit assignment"
        >
          <EditOutlined />
        </button>
        <Popconfirm
          title="Delete this assignment?"
          description="Learners will no longer be able to view or submit to it. This can't be undone."
          onConfirm={() => onDelete?.()}
          onCancel={(e) => e?.stopPropagation?.()}
          okText="Delete"
          okButtonProps={{ danger: true, loading: deleting, disabled: mutationBusy && !deleting }}
          disabled={deleteDisabled || mutationBusy}
          cancelText="Cancel"
        >
          <button
            type="button"
            className="learn-assignment-actions__icon learn-assignment-actions__icon--delete"
            onClick={(e) => e.stopPropagation()}
            disabled={deleting || deleteDisabled || mutationBusy}
            aria-busy={deleting ? "true" : undefined}
            aria-label="Delete assignment"
            title="Delete assignment"
          >
            <DeleteOutlined />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
};

export default ActionAssignment;
