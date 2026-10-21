import { Button, Upload, message } from "antd";
import ImgCrop from "antd-img-crop";
import { useRef, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

import { ExclamationCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import { getFileUrl } from "@/api/Services/AdminService";

const CroppedImageUpload = ({ setFileUrl }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();
  const key = "updatable";

  const onChange = ({ fileList: nextFileList }) => {
    setFileList(nextFileList);
  };
  const onPreview = async file => {
    let src = file.url;
    if (!src) {
      src = await new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };
  return (
    <>
      {contextHolder}
      <ImgCrop rotationSlider>
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={onChange}
          onPreview={onPreview}
          maxCount={1}
          disabled={uploading}
          onRemove={() => {
            if (uploadRef.current || uploading) return false;
            setFileUrl(null);
            return true;
          }}
          customRequest={async ({ file, onSuccess, onError }) => {
            if (uploadRef.current || uploading) return;
            uploadRef.current = true;
            setUploading(true);
            try {
              const result = await uploadFileViaPresign(file, { folder: "profile-images", type: "image" });
              try {
                const url = await getFileUrl(result.key);
                setFileUrl(url || result.publicUrl);
              } catch {
                setFileUrl(result.publicUrl);
              }
              onSuccess?.("ok");
            } catch (error) {
              messageApi.open({
                key,
                type: "error",
                content: "Upload failed. Please try again.",
                duration: 2,
              });
              setFileList([]);
              onError?.(error);
            } finally {
              uploadRef.current = false;
              setUploading(false);
            }
          }}
        >
          {fileList.length === 0 && !uploading ? (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          ) : uploading ? (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Uploading…</div>
            </div>
          ) : null}
        </Upload>
      </ImgCrop>
    </>
  );

};
export default CroppedImageUpload;
