import React from "react";
import { Input, Form, Select } from "antd";
import { extractYouTubeId, toYouTubeEmbedUrl } from "@/utils/youtubeLink";

import PreviewForm from "./preview";
import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { useSelector } from "react-redux";

import { createLessonContent, getFile } from "@/api/Services/courseServices";
import UploadButton from "../../Button/uploadButton";
import { notification } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
const CONTENT_SCOPE_OPTIONS = [
  { label: "This class only", value: "CLASS" },
  { label: "Shared to all sections", value: "SHARED" },
];
const YouTube = props => {
  const [Preview, setPreview] = useState(false);
  const [form] = Form.useForm();
  const [VideoTitle, setVideoTitle] = useState("");
  const [YouTubeLink, setYouTubeLink] = useState("");
  const [contentScope, setContentScope] = useState("CLASS");
  const loginUser = useSelector(state => state.loginUser);
  // Only an administrator (college admin / super admin) may share content across all sections; the server refuses it
  // for faculty. Faculty see no Visibility control and always add to their own class.
  const canShareAcrossSections = String(loginUser?.facultyType || "").toUpperCase() === "ADMIN"
    || String(loginUser?.userType || "").toUpperCase() === "ADMIN";
  const [api, contextHolderTemplate] = notification.useNotification();

  const [PreviewHtml, setPreviewHtml] = useState([]);

  const [step, setStep] = useState(1);

  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const key = "updatable";

  useEffect(() => {
    props.onDirtyChange?.(dirty);
    return () => props.onDirtyChange?.(false);
  }, [dirty, props.onDirtyChange]);

  const titile = e => {
    setVideoTitle(e.target.value);
    setDirty(true);
  };

  const formatYoutubelink = e => {
    // Shared parser: watch, youtu.be, Shorts, embed, live and mobile links. Anything it cannot read
    // clears the link instead of silently keeping the previously typed one.
    setYouTubeLink(toYouTubeEmbedUrl(e.target.value));
    setDirty(true);
  };

  const PDFDataValidation = async () => {
    try {
      await form.validateFields();
    } catch (e) {
      return true;
    }
    let val = Object.values(form.getFieldsValue());

    let Invalid = false;

    for (var i = 0; i < val.length; i++) {
      if (val[i] == undefined || val[i] == "") {
        Invalid = true;
      }
    }

    if (!Invalid) {
      setStep(step + 1);

      const PreviewData = {
        info: (
          <>
            <div className="mb-4">
              <h4 className="prview-title">Title</h4>
              <p className="prview-data">{VideoTitle}</p>
            </div>

            <div className="mb-4">
              <h4 className="prview-title mb-3">Video</h4>
              <div>
                <iframe
                  src={YouTubeLink}
                  title="YouTube video preview"
                  width="100%"
                  height="315"
                  referrerPolicy="no-referrer-when-downgrade"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  style={{ border: 'none', borderRadius: '8px' }}
                />
              </div>
            </div>
          </>
        ),
      };

      setPreviewHtml(PreviewData.info);
    } else {
      messageApi.open({
        key,
        type: "error",
        content: "Please fill required data",
        duration: 2,
      });
    }
  };

  const back = () => {
    setStep(step - 1);
  };

  const ContentSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      let lesson_id = loginUser?.LessonId;
      let class_id = contentScope === "SHARED" && canShareAcrossSections ? 0 : (loginUser?.classId || 0);

      let NewData = {
        lesson_id: lesson_id,
        class_id: class_id,
        sequence: 0,
        content_type: "YOUTUBE",
        content_title: VideoTitle,
        content_data_dto: {
          file_dto: {
            size: 0,
            encoding: "",
            mimetype: "",
            field_name: "",
            original_name: "",
            cloud_storage_object: YouTubeLink,
          },
          html_content: "",
          allow_discussions: true,
          view_after_schedule: true,
          view_before_schedule: true,
          text: "",
          duration: 0,
          due_date: "",
          link: YouTubeLink,
          end_time: "",
          start_time: "",
        },

        active: true,
        enabled: true,
        points: "",
      };

      var placement = "bottomLeft";

      await createLessonContent(NewData)
        .then(response => {
          // Static call, not the hook-bound `api`/`contextHolder` pair below: `props.back(true)`
          // unmounts this component synchronously in the same batch, which would tear down a
          // locally-mounted notification's portal before it ever paints. The static API's
          // container is independent of any component's lifecycle, so it survives.
          notification.info({
            message: `Server Notification`,
            description: "Successfully Saved",
            icon: <CheckCircleOutlined style={{ color: "green" }} />,
            placement,
            duration: 5,
          });

          form.resetFields();
          setStep(1);
          setContentScope("CLASS");
          setDirty(false);
          props.back(true);
        })
        .catch(error => {
          api.info({
            message: `Server Notification`,
            description: "Internal Server Error",
            icon: <ExclamationCircleOutlined style={{ color: "red" }} />,
            placement,
            duration: 5,
          });
        });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const reset = () => {
    form.resetFields();
    setContentScope("CLASS");
  };

  return (
    <Form
      className="h-100 ln-ant-form"
      name="PDFForm"
      form={form}
      onSubmit={PDFDataValidation}
      onFinish={props.onFinish}
      onValuesChange={() => setDirty(true)}
    >
      <div className="ln-drawer-content h-100">
        {step == 2 ? (
          <PreviewForm
            back={back}
            close={props.PreviewShow}
            content={PreviewHtml}
            Submit={ContentSubmit}
          />
        ) : (
          ""
        )}

        {step == 1 ? (
          <div>
            <div className="d-flex flex-column h-100">
              <div className="mb-4 position-relative">
                <label className="ln-lb2">Content Name</label>
                <Form.Item
                  name="Content_Name"
                  rules={[
                    {
                      required: true,
                      message: "Enter Content name",
                      whitespace: true,
                    },
                  ]}
                >
                  <Input onChange={titile} />
                </Form.Item>
              </div>

              <div className="mb-4 position-relative">
                <label className="ln-lb2">Youtube link</label>
                <Form.Item
                  name="Youtube_link"
                  rules={[
                    {
                      required: true,
                      message: "Enter youtube link",
                      whitespace: true,
                    },
                    {
                      validator: (_, value) =>
                        !value || extractYouTubeId(value)
                          ? Promise.resolve()
                          : Promise.reject(new Error("Paste a YouTube video link (watch, youtu.be or Shorts)")),
                    },
                  ]}
                >
                  <Input onChange={formatYoutubelink} />
                </Form.Item>
              </div>
              {canShareAcrossSections ? (
              <>
              <div className="mb-4 position-relative">
                <label className="ln-lb2">Visibility</label>
                <Form.Item name="contentScope" initialValue="CLASS">
                  <Select
                    options={CONTENT_SCOPE_OPTIONS}
                    value={contentScope}
                    onChange={(value) => { setContentScope(value); setDirty(true); }}
                  />
                </Form.Item>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Choose whether this content is only for the current class or shared across all sections.
                </div>
              </div>
              </>
              ) : null}
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
      {step == 1 ? (
        <div className="d-flex flex-wrap justify-content-end ln-drwr-foot-btn-container">
          <div className="me-3">
            <button
              type="button"
              className="ln-btn ln-btn--blue-trans w-100"
              onClick={() => {
                reset();
                props.back?.(false);
              }}
            >
              Cancel
            </button>
          </div>

          <div>
            <button
              type="button"
              className="ln-btn ln-btn--regular w-100"
              onClick={PDFDataValidation}
              // onClick={props.PreviewShow}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-wrap justify-content-end ln-drwr-foot-btn-container">
          <div className="inline-block">
            <button
              type="button"
              className="ln-btn ln-btn--blue-trans me-3"
              onClick={back}
            >
              Previous
            </button>
          </div>
          <button
            type="button"
            className="ln-btn ln-btn--regular"
            onClick={ContentSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
      {contextHolderTemplate}
      {contextHolder}
    </Form>
  );
};

export default YouTube;
