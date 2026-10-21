import React, { useRef, useState } from "react";
import { label } from "@/components/tpo/ui/labels";
import { Alert, AutoComplete, Button, Input, List, Tag, Typography, Empty, Spin, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { searchLearners } from "@/api/Services/LearnerSearchService";
import { getAdminStudentPlacementSummary } from "@/api/Services/AdminService";
import { formatDateShort } from "@/utils/dateUtils";
import ProfileSectionsPanel from "@/components/admin/ProfileSectionsPanel";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";

const { Text } = Typography;

const STATUS_COLOR = {
  APPLIED: "default",
  SHORTLISTED: "blue",
  ASSESSMENT: "gold",
  INTERVIEW: "purple",
  WAITLISTED: "orange",
  OFFERED: "cyan",
  HIRED: "green",
  REJECTED: "red",
  WITHDRAWN: "default",
};

/**
 * "Where does this student stand?" — the most frequent question a placement office gets, and
 * previously unanswerable without opening every job one at a time. Search a student, see every
 * application (any job) and their current stage in one place.
 */
export default function StudentPlacementLookup({ collegeId }) {
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastQuery, setLastQuery] = useState("");
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryOwnerId, setSummaryOwnerId] = useState(null);

  const requestIdRef = useRef(0);
  const searchDebounceRef = useRef(null);
  const selectedLearnerIdRef = useRef(null);

  const runSearch = async (query) => {
    const requestId = ++requestIdRef.current;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await searchLearners(query.trim(), 10, collegeId);
      if (requestId !== requestIdRef.current) return; // a newer search superseded this one
      setLastQuery(query.trim());
      const learners = res?.data?.data ?? res?.data ?? [];
      setOptions(
        (Array.isArray(learners) ? learners : []).map((l) => ({
          value: String(l.id),
          label: `${l.firstName || l.first_name || ""} ${l.lastName || l.last_name || ""}`.trim() || l.contactMail || `Student #${l.id}`,
          learner: l,
        }))
      );
    } catch (e) {
      if (requestId !== requestIdRef.current) return; // a newer search superseded this one
      setOptions([]);
      setSearchError(e?.response?.data?.message || "Search failed — try again.");
    } finally {
      if (requestId === requestIdRef.current) setSearching(false);
    }
  };

  const handleSearch = (query) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (!query || query.trim().length < 2) {
      requestIdRef.current += 1; // invalidate any in-flight search
      setOptions([]);
      setSearchError(null);
      setLastQuery("");
      setSearching(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 300);
  };

  const handleSelect = async (value, option) => {
    const learnerId = Number(value);
    const sameLearner = String(summaryOwnerId) === String(learnerId);
    selectedLearnerIdRef.current = learnerId;
    setSelectedLearner(option?.learner || selectedLearner || { id: learnerId });
    if (!sameLearner) setSummary(null);
    setSummaryError(null);
    setLoadingSummary(true);
    try {
      const res = await getAdminStudentPlacementSummary(learnerId, collegeId);
      if (selectedLearnerIdRef.current !== learnerId) return; // a newer selection superseded this one
      if (res?.data?.status === "success") {
        setSummary(Array.isArray(res.data.data) ? res.data.data : []);
        setSummaryOwnerId(learnerId);
      } else {
        throw new Error(res?.data?.message || "Couldn't load placement history — try again.");
      }
    } catch (e) {
      if (selectedLearnerIdRef.current !== learnerId) return; // a newer selection superseded this one
      if (!sameLearner) setSummary([]);
      setSummaryError(e?.response?.data?.message || e?.message || "Couldn't load placement history — try again.");
    } finally {
      if (selectedLearnerIdRef.current === learnerId) setLoadingSummary(false);
    }
  };

  const handleRetrySummary = () => {
    if (selectedLearnerIdRef.current != null) {
      handleSelect(String(selectedLearnerIdRef.current), { learner: selectedLearner });
    }
  };

  // Deliberately NOT a Card — this is a utility lookup tool, not a priority signal, and giving
  // it the same card chrome as the "Needs attention" queue right above made the two compete for
  // attention when the lookup should read as clearly secondary.
  return (
    <div style={{ marginBottom: 20 }}>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
        Look up a student&rsquo;s placement status
      </Text>
      <AutoComplete
        style={{ width: "100%", maxWidth: 420 }}
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        notFoundContent={
          searching ? (
            <Spin size="small" />
          ) : searchError ? (
            <Text type="danger">{searchError}</Text>
          ) : lastQuery && options.length === 0 ? (
            <Text type="secondary">No students match &ldquo;{lastQuery}&rdquo;</Text>
          ) : null
        }
      >
        <Input.Search placeholder="Search a student by name or email" allowClear />
      </AutoComplete>

      {selectedLearner && (
        <div style={{ marginTop: 16, padding: 16, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8 }}>
          <Text strong>
            {`${selectedLearner.firstName || selectedLearner.first_name || ""} ${selectedLearner.lastName || selectedLearner.last_name || ""}`.trim()
              || selectedLearner.contactMail
              || `Student #${selectedLearner.id}`}
          </Text>
          {/* P6/M1 in the audit: placement staff had zero visibility into resume/skills/job
              preferences here — the only place resume showed up at all was per-job-application,
              never as a standing student record. Same generic panel as the Students/Faculty
              profile drawers, filtered to the fields placement staff actually need. */}
          <div style={{ marginTop: 12 }}>
            <ProfileSectionsPanel role="learner" id={selectedLearner.id} only={["resume", "skills", "jobPreferences"]} />
          </div>

          {loadingSummary && String(summaryOwnerId) === String(selectedLearner.id) ? (
            <RefreshStatus label="Refreshing placement history…" />
          ) : null}
          {summaryError ? (
            <Alert
              type={String(summaryOwnerId) === String(selectedLearner.id) ? "warning" : "error"}
              showIcon
              message={String(summaryOwnerId) === String(selectedLearner.id) ? "Couldn't refresh placement history" : "Couldn't load placement history"}
              description={String(summaryOwnerId) === String(selectedLearner.id) ? "Showing the last placement history loaded for this student." : summaryError}
              action={<Button size="small" onClick={handleRetrySummary}>Retry</Button>}
              style={{ marginTop: 12 }}
            />
          ) : null}
          {loadingSummary && String(summaryOwnerId) !== String(selectedLearner.id) ? (
            <ListSkeleton rows={4} avatar={false} label="Loading placement history" />
          ) : summaryError && String(summaryOwnerId) !== String(selectedLearner.id) ? null
          : !summary || summary.length === 0 ? (
            <Empty style={{ marginTop: 12 }} description="No applications yet — this student hasn't applied to any job posting." />
          ) : (
            <List
              style={{ marginTop: 12 }}
              size="small"
              dataSource={summary}
              renderItem={(item) => {
                const app = item.application ?? item;
                const job = app.job ?? {};
                const status = app.applicationStatus;
                const nextInterview = item.nextInterview;
                return (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: "100%" }}>
                      <Space>
                        <Text strong>{job.jobTitle || "Job"}</Text>
                        <Text type="secondary">{job.companyName}</Text>
                        <Tag color={STATUS_COLOR[status] || "default"}>{label("stage", status)}</Tag>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Applied {formatDateShort(app.appliedAt)}
                        {nextInterview?.scheduledDate && ` · Next interview: ${formatDateShort(nextInterview.scheduledDate)}`}
                        {app.rejectionReason && ` · ${app.rejectionReason}`}
                      </Text>
                    </Space>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
