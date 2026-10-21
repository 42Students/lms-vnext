import { Progress, Card, Typography, Tag } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import {
  LEARNER_SECTIONS,
  FACULTY_SECTIONS,
  calculateCompletion,
  getStatusColor,
  getMessage,
} from "@/utils/profileUtils";

const { Text } = Typography;

const ProfileCompleteness = ({
  profileData = {},
  isFaculty = false,
  compact = false,
}) => {
  const sections = isFaculty ? FACULTY_SECTIONS : LEARNER_SECTIONS;
  const result = calculateCompletion(profileData, sections);
  const { percentage, completedCount, totalSections, incompleteCount } = result;

  const safePercent = Number.isFinite(percentage) ? percentage : 0;
  const statusColor = getStatusColor(percentage);
  const message = getMessage(percentage);

  if (compact) {
    return (
      <div className="profile-completeness profile-completeness--compact">
        <Progress
          type="circle"
          percent={safePercent}
          size={60}
          strokeColor={statusColor}
          format={(percent) => <span className="profile-completeness__percent">{(percent ?? 0)}%</span>}
        />
        <div>
          <Text strong className="profile-completeness__title">Profile Completeness</Text>
          <Text type="secondary" className="profile-completeness__count">{completedCount}/{totalSections} sections</Text>
        </div>
      </div>
    );
  }

  return (
    <Card className="profile-completeness-card profile-completeness" bodyStyle={{ padding: "24px" }}>
      <div className="profile-completeness__layout">
        <Progress
          type="dashboard"
          percent={safePercent}
          size={100}
          strokeColor={statusColor}
          format={(percent) => (
            <div className="profile-completeness__circle-label">
              <div className="profile-completeness__percent-large">{(percent ?? 0)}%</div>
              <div className="profile-completeness__circle-sublabel">Complete</div>
            </div>
          )}
        />

        <div className="profile-completeness__content">
          <h3 className="profile-completeness-title">Profile Completeness</h3>
          <p className="profile-completeness-message">{message}</p>
          <div className="profile-completeness-tags">
            <Tag className="profile-completeness-tag profile-completeness-tag--success" icon={<CheckCircleOutlined />}>
              {completedCount} Completed
            </Tag>
            {incompleteCount > 0 && (
              <Tag className="profile-completeness-tag profile-completeness-tag--warning" icon={<ExclamationCircleOutlined />}>
                {incompleteCount} Remaining
              </Tag>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCompleteness;
