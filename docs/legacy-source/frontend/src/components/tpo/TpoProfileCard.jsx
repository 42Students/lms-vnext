import { Card, Descriptions, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import UserInfo from "@/components/profile/userInfo";
import { appAction } from "@/redux/store";
import { extractR2KeyFromUrl, uploadFileViaPresign } from "@/utils/uploadToR2";
import * as ProfileService from "@/api/Services/ProfileService";
import { extractErrorMessage } from "@/utils/errorHandlers";

const ROLE = { TPO: "Placement officer", ADMIN: "College admin (acts as placement officer)" };
const has = (v) => v && v !== "string" && String(v).trim() !== "";

/**
 * The placement officer's own profile (TPO page audit 2026-10-04): who they are to students and recruiters, nothing more.
 * The student-style profile (blood group, Aadhaar, publications, a "10% complete" nag) does not belong here.
 * Photo is editable; phone and email are the login, so the college admin changes them; the email signature is the college's.
 */
export default function TpoProfileCard({ userDetails, setRefresh }) {
  const dispatch = useDispatch();
  const loginUser = useSelector((s) => s.loginUser);
  const userId = userDetails?.id;

  const savePhoto = async (newImageUrl) => {
    const old = userDetails?.website;
    await ProfileService.updateFacultyHeader(userId, { profileImage: newImageUrl });
    message.success("Photo updated");
    setRefresh((v) => !v);
    dispatch(appAction.setProfileImageUrl(newImageUrl));
    if (has(old) && old !== newImageUrl) {
      const key = extractR2KeyFromUrl(old);
      if (key) import("@/api/Services/AdminService").then(({ deleteFileFromR2 }) => deleteFileFromR2(key).catch(() => {}));
    }
  };
  const uploadPhoto = async (file) => {
    try {
      const result = await uploadFileViaPresign(file, { folder: "profile-images", type: "image", userId });
      if (result?.publicUrl) await savePhoto(result.publicUrl);
    } catch (e) { message.error(extractErrorMessage(e) || "Could not upload the photo"); }
  };
  const photoFromLink = async (result) => {
    try {
      if (!result?.publicUrl) throw new Error("That link did not give an image");
      await savePhoto(result.publicUrl);
    } catch (e) { message.error(extractErrorMessage(e) || "Could not use that image"); }
  };

  const name = [userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ");
  return (
    <div className="tpo-profile-card" data-testid="tpo.profile.card">
      <UserInfo userDetails={userDetails} saveImage={uploadPhoto} saveImageFromLink={photoFromLink} userId={userId} setRefresh={setRefresh} />
      <Card className="tpo-profile-card__details" title="How students and recruiters see you">
        <Descriptions column={1} size="small" colon={false} labelStyle={{ width: 160 }}>
          <Descriptions.Item label="Name">{name || "-"}</Descriptions.Item>
          <Descriptions.Item label="Role">{ROLE[loginUser?.facultyType] || "Placement team"}</Descriptions.Item>
          <Descriptions.Item label="Department">{has(userDetails?.department) ? userDetails.department : <Typography.Text type="secondary">Not set</Typography.Text>}</Descriptions.Item>
          <Descriptions.Item label="Phone">{has(userDetails?.contactMobile) ? userDetails.contactMobile : <Typography.Text type="secondary">Not set</Typography.Text>}</Descriptions.Item>
          <Descriptions.Item label="Email">{has(userDetails?.contactMail) ? userDetails.contactMail : <Typography.Text type="secondary">Not set</Typography.Text>}</Descriptions.Item>
        </Descriptions>
        <Typography.Paragraph type="secondary" className="tpo-profile-card__note">
          Your phone and email are how you log in, so your college admin changes them.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
