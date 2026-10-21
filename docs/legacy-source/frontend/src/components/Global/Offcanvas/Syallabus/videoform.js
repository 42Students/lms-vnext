import React from "react";
import {
  Input,
  DatePicker,
  Space,
  TimePicker,
  Checkbox,
  Button,
  Upload,
  Form,
  Progress,
  Select,
} from "antd";
import dayjs from "dayjs";
import Image from "next/image";
const format = "HH:mm";
import PreviewForm from "./preview";
import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { useSelector } from "react-redux";
import VideoGlobal from "@/components/Global/video/video";
import { getFileSizeValidator } from "@/utils/helper";
import { createLessonContent } from "@/api/Services/courseServices";

// import { Document, pdfjs, Page } from "react-pdf";
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

import { uploadFileViaPresign } from "@/utils/uploadToR2";
import UploadButton from "../../Button/uploadButton";
import { notification } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
const VALID_CONTENT_TYPES = ["video/*"];
const CONTENT_SCOPE_OPTIONS = [
  { label: "This class only", value: "CLASS" },
  { label: "Shared to all sections", value: "SHARED" },
];

const Pdf = props => {
  const [Preview, setPreview] = useState(false);
  const [form] = Form.useForm();
  const [VideoTitle, setVideoTitle] = useState("");
  const [PDFdate, setPDFDate] = useState("");
  const [PDFStartDate, setPDFStartDate] = useState("");
  const [PDFEndDate, setPDFEndDate] = useState("");
  const [PDFAllowDiscussion, setAllowDiscussion] = useState("");
  const [VideoViewBefore, setViewBefore] = useState(true);
  const [VideoViewAfter, setViewAfter] = useState(true);
  const [VideoPoints, setPoints] = useState("");
  const [VideoUrl, setVideoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState("");
  const [PrviewHtml, setPreviewHtml] = useState([]);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [step, setStep] = useState(1);
  const [FileStatus, setFileStatus] = useState("");
  const [contentScope, setContentScope] = useState("CLASS");
  const loginUser = useSelector(state => state.loginUser);
  // Only an administrator (college admin / super admin) may share content across all sections; the server refuses it
  // for faculty. Faculty see no Visibility control and always add to their own class.
  const canShareAcrossSections = String(loginUser?.facultyType || "").toUpperCase() === "ADMIN"
    || String(loginUser?.userType || "").toUpperCase() === "ADMIN";
  const [api, contextHolderTemplate] = notification.useNotification();
  const [progPercent, setProgPercent] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const key = "updatable";

  useEffect(() => {
    props.onDirtyChange?.(dirty);
    return () => props.onDirtyChange?.(false);
  }, [dirty, props.onDirtyChange]);

  const antIcon = (
    <LoadingOutlined
      style={{
        fontSize: 24,
      }}
      spin
    />
  );

  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const FileChange = info => {
    setDirty(true);
    switch (info.file.status) {
      case "uploading":
        setFileStatus("uploading");
        break;
      case "done":
        let tempProgress = 0;
        const timeInterval = setInterval(() => {
          tempProgress = tempProgress + 1;
          if (tempProgress > 90) {
            clearInterval(timeInterval);
            return;
          }
          setProgPercent(tempProgress);
        }, [100]);
        setFileStatus("done");
        const file = info.file.originFileObj;
        uploadFileViaPresign(file, { folder: "lesson-content", type: "video", classId: loginUser?.classId })
          .then(result => {
            // Video now stores a plain public URL, same as every other upload type — there is no
            // signing/playback-url step left to resolve a bare key against.
            setVideoUrl(result.publicUrl);
            if (previewUrl) try { URL.revokeObjectURL(previewUrl); } catch (_) {}
            setPreviewUrl(URL.createObjectURL(file));
            setProgPercent(100);
            clearInterval(timeInterval);
          })
          .catch(() => {
            messageApi.open({
              key,
              type: "error",
              content: "Server Error Please upload once",
              duration: 2,
            });
            setVideoUrl("");
            setPreviewUrl("");
          });

        break;

      default:
    }
  };

  const [openEditor1, setOpenE1] = useState(false);

  const titile = e => {
    setVideoTitle(e.target.value);
    setDirty(true);
  };

  const points = e => {
    setPoints(e.target.value);
    setDirty(true);
  };

  const Discussion = e => {
    setAllowDiscussion(e.target.checked);
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
              <h4 className="prview-title">Total Points</h4>
              <p className="prview-data">{VideoPoints}</p>
            </div>
            <div className="mb-4">
              <h4 className="prview-title mb-3">Video</h4>
              <div>
                <VideoGlobal src={previewUrl} />
              </div>
            </div>
          </>
        ),
      };

      setPreviewHtml(PreviewData.info);

      // setPreview(true);
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

  function beforeUpload(file) {
    setProgPercent(0);
    const isValidFileType = file.type.startsWith("video/");
    if (!isValidFileType) {
      message.error(`${file.name} is not a video file`);
    }
    return isValidFileType || Upload.LIST_IGNORE;
  }

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
        content_type: "VIDEO",
        content_title: VideoTitle,
        content_data_dto: {
          file_dto: {
            size: 0,
            encoding: "",
            mimetype: "",
            field_name: "",
            original_name: "",
            cloud_storage_object: VideoUrl, // plain public URL, same as PDF/lecture/ppt uploads
          },
          html_content: "",
          allow_discussions: PDFAllowDiscussion,
          view_after_schedule: VideoViewAfter,
          view_before_schedule: VideoViewBefore,
          text: "",
          duration: 0,
          due_date: PDFdate,
          link: "",
          end_time: PDFEndDate,
          start_time: PDFStartDate,
        },

        active: true,
        enabled: true,
        points: VideoPoints,
      };

      var placement = "bottomLeft";

      await createLessonContent(NewData)
        .then(response => {
          // Static call, not the hook-bound `api`/`contextHolderTemplate` pair below:
          // `props.back(true)` unmounts this component synchronously in the same batch, which
          // would tear down a locally-mounted notification's portal before it ever paints. The
          // static API's container is independent of any component's lifecycle, so it survives.
          notification.info({
            message: `Server Notification`,
            description: "Successfully Saved",
            icon: <CheckCircleOutlined style={{ color: "green" }} />,
            placement,
            duration: 5,
          });

          form.resetFields();
          setPreview(false);
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
      name="VideoForm"
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
            content={PrviewHtml}
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

              <div className="mb-4">
                <label className="ln-lb2">File</label>
                <Form.Item
                  name="Assignment_file"
                  rules={[
                    {
                      type: "object",
                      required: true,
                      message: "Upload file",
                      whitespace: true,
                    },
                    () => ({
                      validator: getFileSizeValidator(5120),
                    }),
                  ]}
                >
                  <Upload
                    onRemove={() => {
                      setProgPercent(0);
                      setVideoUrl("");
                      if (previewUrl) {
                        try { URL.revokeObjectURL(previewUrl); } catch (_) {}
                        setPreviewUrl("");
                      }
                    }}
                    customRequest={dummyRequest}
                    onChange={FileChange}
                    maxCount={1}
                    accept={VALID_CONTENT_TYPES.join(",")}
                    beforeUpload={beforeUpload}
                  >
                    <Button
                      className="w-100 ant-custom-upload"
                      icon={<UploadOutlined />}
                    >
                      Choose File
                    </Button>
                    {progPercent > 0 && (
                      <Progress size="small" percent={progPercent} />
                    )}
                  </Upload>
                </Form.Item>
              </div>
              <div className="mb-4 position-relative">
                <label className="ln-lb2">Points</label>
                <Form.Item
                  name="Pdf_Points"
                  rules={[
                    {
                      required: true,
                      message: "Enter key point",
                      whitespace: true,
                    },
                  ]}
                >
                  <Input type="number" onChange={points} />
                </Form.Item>
              </div>
              {/* <div className="mb-4 position-relative">
                <Checkbox onChange={Discussion}>Allow Discussion</Checkbox>
              </div> */}
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
      {step == 1 ? (
        <div className="d-flex flex-wrap justify-content-end ln-content-btn-container">
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
              disabled={progPercent < 100}
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
        <div className="d-flex flex-wrap justify-content-end ln-content-btn-container">
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

export default Pdf;

// https://youtu.be/NxaOvaO_cXo
// https://www.youtube.com/watch?v=NxaOvaO_cXo

// <iframe width="950" height="534" src="https://www.youtube.com/embed/NxaOvaO_cXo" title="REACT.DEV LAUNCHED! Goodbye Create React App?" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
