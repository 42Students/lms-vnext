import { Upload, message } from "antd";
import ImgCrop from "antd-img-crop";
import { useEffect, useRef, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { uploadFileViaPresign, extractR2KeyFromUrl } from "@/utils/uploadToR2";
import { getFileUrl } from "@/api/Services/AdminService";

// Server-side caps this too (FileUploadController.FOLDER_MAX_UPLOAD_BYTES) — this check is only
// the fast, friendly first line of defense so a huge file never even starts uploading; the real
// enforcement is the backend's, since a client-side-only check can always be bypassed.
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Superadmin college-branding's own image picker — same picture-card Upload + ImgCrop shape as
// CroppedImageUpload (profile pictures), but parameterized: folder is always "college-branding"
// (a superadmin-only folder with no tenant scope of its own — see resolveTenantPrefixForCollegeBranding
// in FileUploadController), the target collegeId must be threaded through every upload/delete call,
// and the crop aspect ratio is configurable since a logo (square) and a wide login background need
// very different crops. A copy rather than adding props to the shared component, since that
// component is also used by the unrelated profile-picture flow.
//
// BUGFIX: this used to delete the previous/removed file from storage immediately, right here, the
// instant the admin interacted with the widget -- before the form's Save button was ever clicked.
// Abandoning the edit (navigating away, a validation failure on an unrelated field, a browser
// back) left the file gone from storage while the database still pointed at it: a permanently
// broken image on the college's real, live login page, with no undo. Deletion is now deferred --
// this only reports the stale key via onStaleKey; the parent (CollegeBranding.js) queues it and
// only actually deletes it once the form has genuinely saved successfully. Worst case now is an
// orphaned, harmless, never-referenced file sitting in storage -- not a broken production page.
// Reads a File's actual pixel dimensions without ever uploading it. Aspect-ratio cropping alone
// doesn't stop a tiny source image from being accepted -- ImgCrop happily upscales a 100x60 photo
// to fill a full-screen 1920x1080 crop, and the result is blurry with no warning anywhere. This
// is the check that was missing: a real minimum resolution per field, enforced before crop even
// opens.
const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read this image"));
    };
    img.src = url;
  });

const BrandingImageUpload = ({ value, onChange, onStaleKey, collegeId, aspect = 1, minWidth, minHeight }) => {
  const [fileList, setFileList] = useState(
    value ? [{ uid: "existing", name: "current", status: "done", url: value }] : []
  );
  const [messageApi, contextHolder] = message.useMessage();
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(false);

  useEffect(() => {
    setFileList(value ? [{ uid: "existing", name: "current", status: "done", url: value }] : []);
  }, [value]);

  const onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
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

  const onRemove = () => {
    if (uploadRef.current || uploading) return false;
    const oldKey = extractR2KeyFromUrl(value);
    setFileList([]);
    onChange?.(null);
    if (oldKey) onStaleKey?.(oldKey);
    return true;
  };

  // Runs before any network request — rejecting here means handleUpload/customRequest, and
  // ImgCrop's own crop step, never fire at all for a file that fails any of these checks.
  const beforeUpload = async (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      messageApi.error("Please upload a PNG, JPG, or WebP image.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_BYTES) {
      messageApi.error(`Image is too large — max ${MAX_FILE_BYTES / (1024 * 1024)}MB.`);
      return Upload.LIST_IGNORE;
    }
    if (minWidth && minHeight) {
      try {
        const { width, height } = await readImageDimensions(file);
        if (width < minWidth || height < minHeight) {
          messageApi.error(
            `Image is too small (${width}×${height}px) — needs at least ${minWidth}×${minHeight}px so it isn't blurry once it fills the screen.`
          );
          return Upload.LIST_IGNORE;
        }
      } catch (e) {
        messageApi.error("Couldn't read this image — try a different file.");
        return Upload.LIST_IGNORE;
      }
    }
    return true;
  };

  const handleUpload = async (file) => {
    if (uploadRef.current || uploading) return false;
    if (!collegeId) {
      messageApi.error("Select a college first");
      return false;
    }
    const oldKey = extractR2KeyFromUrl(value);
    uploadRef.current = true;
    setUploading(true);
    setFileList([{ uid: file.uid || "uploading", name: file.name || "image", status: "uploading", originFileObj: file }]);
    try {
      const result = await uploadFileViaPresign(file, { folder: "college-branding", type: "image", collegeId });
      let url = result.publicUrl;
      try {
        url = (await getFileUrl(result.key)) || result.publicUrl;
      } catch (_) {
        // fall back to publicUrl already assigned above
      }
      onChange?.(url);
      setFileList([{ uid: result.key, name: "current", status: "done", url }]);
      if (oldKey) onStaleKey?.(oldKey);
      return true;
    } catch (_) {
      setFileList(value ? [{ uid: "existing", name: "current", status: "done", url: value }] : []);
      messageApi.error("Upload failed, please try again");
      return false;
    } finally {
      uploadRef.current = false;
      setUploading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <ImgCrop rotationSlider aspect={aspect}>
        <Upload
          listType="picture-card"
          fileList={fileList}
          onPreview={onPreview}
          onRemove={onRemove}
          maxCount={1}
          accept="image/png,image/jpeg,image/webp"
          beforeUpload={beforeUpload}
          disabled={uploading}
          customRequest={({ file, onSuccess, onError }) => {
            handleUpload(file).then((ok) => {
              if (ok) onSuccess?.("ok");
              else onError?.(new Error("Upload failed"));
            });
          }}
        >
          {fileList.length === 0 && !uploading && (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
          {uploading && <div>Uploading…</div>}
        </Upload>
      </ImgCrop>
      <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
        PNG, JPG or WebP, up to {MAX_FILE_BYTES / (1024 * 1024)}MB.
        {minWidth && minHeight ? ` At least ${minWidth}×${minHeight}px.` : ""}
      </div>
    </>
  );
};

export default BrandingImageUpload;
