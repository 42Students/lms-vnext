import { useRef, useState } from "react";
import { Button, Upload, message } from "antd";
import { CheckCircleFilled, UploadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import PrivateDocLink from "@/components/profile/PrivateDocLink";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;

/** The marksheet for one education entry (PDF or image, up to 5 MB). Needed before the college can verify Education. */
export default function MarksheetUpload({ value, onChange }) {
  const loginUser = useSelector((s) => s.loginUser);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const before = async (file) => {
    if (busyRef.current || busy) return Upload.LIST_IGNORE;
    if (!ALLOWED.includes(file.type)) { message.error("Upload a PDF, JPG or PNG"); return Upload.LIST_IGNORE; }
    if (file.size > MAX_BYTES) { message.error("The file is larger than 5 MB"); return Upload.LIST_IGNORE; }
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await uploadFileViaPresign(file, { folder: "marksheets", type: "generic", userId: loginUser?.id });
      if (!r?.publicUrl) throw new Error("no link");
      onChange?.(r.publicUrl);
      message.success("Marksheet uploaded");
    } catch (_) {
      message.error("Could not upload the marksheet. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    return Upload.LIST_IGNORE;
  };
  return (
    <div className="profile-marksheet">
      <div className="mb-1"><span className="fnt-13 clrgray2BB">Marksheet</span> <span className="fnt-13 clrgray2BB">(needed for verification)</span></div>
      <Upload accept=".pdf,.jpg,.jpeg,.png" showUploadList={false} beforeUpload={before} disabled={busy}>
        <Button icon={value ? <CheckCircleFilled style={{ color: "#16a34a" }} /> : <UploadOutlined />} loading={busy}>
          {value ? "Replace marksheet" : "Upload marksheet"}
        </Button>
      </Upload>
      {value && (
        <span className="profile-marksheet__ok">
          Attached · <PrivateDocLink value={value} userId={loginUser?.id}>View</PrivateDocLink>
        </span>
      )}
    </div>
  );
}
