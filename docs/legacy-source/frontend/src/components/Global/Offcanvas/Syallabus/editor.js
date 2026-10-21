import React from "react";
import { Drawer } from "antd";
import Editor from "@/components/Global/Editor/editor";
import { useState } from "react";
import PreviewForm from "./preview";

const EditorBuildInOwn = props => {
  const [Preview, setPreview] = useState(false);
  const [editorContent, setEditorContent] = useState(props.initialContent || "");
  const ShowPreview = () => {
    setPreview(true);
  };
  const HidePreview = () => {
    setPreview(false);
  };

  return (
    <Drawer
      rootClassName="ln-course-direct-drawer-root"
      title="Build Your Own"
      className="EditorDrawer"
      width={552}
      closable={true}
      onClose={props.Editorclose}
      open={props.Editoropen}
    >
      <div className="ln-drawer-body">
        <div className="ln-drawer-content h-100">
          {Preview ? (
            <PreviewForm
              back={HidePreview}
              Submit={props.SubmitData}
              content={props.Preview}
              SubmitData
            />
          ) : (
            <div className="d-flex flex-column h-100">
              <Editor editorContent={editorContent} setEditorContent={setEditorContent} />
              <div
                className="d-flex justify-content-end mt-auto"
                onClick={props.Pre}
              >
                <button
                  type="button"
                  className="ln-btn ln-btn--blue-trans me-3"
                  onClick={props.Editorclose}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ln-btn ln-btn--regular"
                  onClick={ShowPreview}
                >
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default EditorBuildInOwn;
