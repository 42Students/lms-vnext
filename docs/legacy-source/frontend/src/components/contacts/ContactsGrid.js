import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table, Skeleton, Input, Button } from "antd";
import { UserOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { useContacts } from "@/hooks/useContacts";

function hasValidImage(url) {
  return url && typeof url === "string" && url.trim() !== "" && url.trim() !== "string" && url.trim() !== " ";
}

// Same identity-avatar language as the course Students roster (src/pages/Dashboard/course/Sudent/
// student.js) -- a plain grey silhouette placeholder was the one spot in the app still using a
// generic default image instead of a tinted initial, which is what actually read as "outdated"
// here; every other roster/listing in the LMS gives each person a colored identity mark.
function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

const AVATAR_TINTS = [
  { bg: "#e0f2f1", fg: "#0f766e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#ffe4e6", fg: "#9f1239" },
  { bg: "#e0f2fe", fg: "#075985" },
];

function getAvatarTint(seedValue) {
  const numeric = Number(seedValue);
  const seed = Number.isFinite(numeric)
    ? numeric
    : String(seedValue ?? "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TINTS[Math.abs(seed) % AVATAR_TINTS.length];
}

function ContactAvatar({ record, size = 36, className = "" }) {
  const [errored, setErrored] = useState(false);
  const imgUrl = hasValidImage(record?.profileImageUrl) ? record.profileImageUrl : null;
  const showImage = imgUrl && !errored;
  const name = [record?.firstName, record?.lastName].filter(Boolean).join(" ");

  const handleError = useCallback(() => setErrored(true), []);

  if (showImage) {
    return (
      <img
        className={`teacher-contacts-module__avatar-img ${className}`}
        src={imgUrl}
        alt={name || "User avatar"}
        width={size}
        height={size}
        onError={handleError}
        loading="lazy"
      />
    );
  }

  const tint = getAvatarTint(record?.id ?? record?.email ?? name);
  return (
    <span
      className={`teacher-contacts-module__avatar-img teacher-contacts-module__avatar-initials ${className}`}
      style={{ width: size, height: size, background: tint.bg, color: tint.fg, fontSize: Math.max(11, size * 0.4) }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export const ContactsGrid = ({ title, userType, columns, collegeId }) => {
  const { data, loading, error, retry, query, setQuery, totalContacts, notificationContext } = useContacts(userType);
  const [searchText, setSearchText] = useState("");

  // Paging is server-side, so searching only ever filtered the 10 rows on screen -- a contact on
  // page 2 read as "No contacts match your search". The endpoint loads the whole college list and
  // pages it in memory anyway, so while a search is active, fetch everyone once and filter that.
  const searching = Boolean(searchText.trim());
  useEffect(() => {
    if (!collegeId || !totalContacts) return undefined;
    const timer = setTimeout(() => {
      if (searching && (query.pageSize ?? 0) < totalContacts) {
        setQuery((prev) => ({ ...prev, pageNumber: 0, pageSize: Math.min(totalContacts, 5000) }));
      } else if (!searching && (query.pageSize ?? 10) > 50) {
        setQuery((prev) => ({ ...prev, pageNumber: 0, pageSize: 10 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searching, totalContacts, collegeId, query.pageSize, setQuery]);

  useEffect(() => {
    if (!collegeId) return;
    setQuery({ pageNumber: 0, pageSize: 10, collegeId });
  }, [collegeId, setQuery]);

  const handleTableChange = (pagination) => {
    setQuery({ ...query, pageNumber: pagination.current - 1, pageSize: pagination.pageSize });
  };

  const showRole = columns?.some(c => c.dataIndex === "userType" || c.title === "Role");

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return data;
    const q = searchText.trim().toLowerCase();
    return (data || []).filter(record => {
      const name = [record.firstName, record.lastName].filter(Boolean).join(" ");
      return (
        name.toLowerCase().includes(q) ||
        (record.email || "").toLowerCase().includes(q) ||
        (record.contactMobile || "").toLowerCase().includes(q)
      );
    });
  }, [data, searchText]);

  const tableColumns = useMemo(() => {
    if (!columns) return [];
    return columns.map(col => {
      if (col.dataIndex === "firstName" || col.key === "firstName" || col.title === "Name") {
        return {
          ...col,
          render: (_, record) => {
            const name = [record.firstName, record.lastName].filter(Boolean).join(" ") || "\u2014";
            return (
              <div className="teacher-contacts-module__name-cell">
                <ContactAvatar record={record} size={32} />
                <span>{name}</span>
              </div>
            );
          },
        };
      }
      return col;
    });
  }, [columns]);

  return (
    <div className="teacher-contacts-module">
      <div className="teacher-contacts-module__toolbar">
        {/* Was destructured but never rendered \u2014 every tab (All Contacts/Teachers/Students)
            looked identical apart from the pill above them. Now matches the tab labels exactly
            (contactsTabList in common/lists.js) rather than the old, differently-worded set. */}
        {title && <h3 className="teacher-contacts-module__title">{title}</h3>}
        <span className="teacher-contacts-module__count-pill">
          <TeamOutlined aria-hidden="true" />
          {loading ? "\u2014" : totalContacts} {totalContacts === 1 ? "contact" : "contacts"}
        </span>
        <Input
          className="teacher-contacts-module__search listing-page-search"
          placeholder="Search contacts..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
        />
      </div>

      {columns && (
        <>
          <div className="teacher-contacts-desktop">
            <div className="teacher-contacts-module__table-wrap">
              <Table
                  columns={tableColumns}
                  dataSource={filteredData}
                  pagination={{
                    current: query.pageNumber + 1,
                    pageSize: query.pageSize,
                    total: searchText.trim() ? filteredData.length : totalContacts,
                    hideOnSinglePage: true,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    className: "teacher-contacts-module__table ln-table",
                  }}
                  loading={loading}
                  onChange={searchText.trim() ? undefined : handleTableChange}
                  scroll={{ x: 560 }}
                  locale={{
                    emptyText: error ? (
                      <div className="teacher-contacts-module__empty">
                        <UserOutlined className="teacher-contacts-module__empty-icon" aria-hidden />
                        <p>Couldn&apos;t load contacts</p>
                        <Button size="small" onClick={retry}>Retry</Button>
                      </div>
                    ) : (
                      <div className="teacher-contacts-module__empty">
                        <UserOutlined className="teacher-contacts-module__empty-icon" aria-hidden />
                        <p>{searchText.trim() ? "No contacts match your search" : "No contacts found"}</p>
                        <span>{searchText.trim() ? "Try a different search term." : "Your contacts will appear here once available."}</span>
                      </div>
                    ),
                  }}
                />
              </div>
            </div>

            <div className="teacher-contacts-mobile">
              {loading ? (
                <div className="teacher-contacts-module__loading">
                  {[1, 2, 3].map(k => (
                    <div key={k} className="teacher-contacts-module__skeleton-card">
                      <Skeleton.Avatar active size={44} shape="circle" />
                      <div className="teacher-contacts-module__skeleton-body">
                        <Skeleton.Input active size="small" block />
                        <Skeleton.Input active size="small" block />
                        <Skeleton.Input active size="small" block />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="teacher-contacts-module__empty">
                  <UserOutlined className="teacher-contacts-module__empty-icon" aria-hidden />
                  <p>Couldn&apos;t load contacts</p>
                  <Button size="small" onClick={retry}>Retry</Button>
                </div>
              ) : !filteredData?.length ? (
                <div className="teacher-contacts-module__empty">
                  <UserOutlined className="teacher-contacts-module__empty-icon" aria-hidden />
                  <p>{searchText.trim() ? "No contacts match your search" : "No contacts found"}</p>
                  <span>{searchText.trim() ? "Try a different search term." : "Your contacts will appear here once available."}</span>
                </div>
              ) : (
                <>
                  <div className="teacher-contacts-cards teacher-contacts-module__cards">
                    {filteredData.map((record, i) => {
                      const name = [record.firstName, record.lastName].filter(Boolean).join(" ") || "\u2014";
                      return (
                        <div
                          key={record.id ?? record.key ?? i}
                          className="teacher-contacts-module__card-item teacher-contacts-card-item"
                        >
                          <ContactAvatar record={record} size={44} />
                          <div className="teacher-contacts-module__card-body teacher-contacts-card-item__body">
                            <div className="teacher-contacts-module__card-name teacher-contacts-card-item__name">
                              {name}
                            </div>
                            <div className="teacher-contacts-module__card-meta">
                              <span className="teacher-contacts-card-item__label">Email</span>
                              <span className="teacher-contacts-card-item__value">{record.email ?? "\u2014"}</span>
                            </div>
                            <div className="teacher-contacts-module__card-meta">
                              <span className="teacher-contacts-card-item__label">Contact</span>
                              <span className="teacher-contacts-card-item__value">{record.contactMobile ?? "\u2014"}</span>
                            </div>
                            {showRole && (
                              <div className="teacher-contacts-module__card-meta">
                                <span className="teacher-contacts-card-item__label">Role</span>
                                <span className="teacher-contacts-card-item__value">{record.userType ?? "\u2014"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const total = searchText.trim() ? filteredData.length : totalContacts;
                    return total > query.pageSize ? (
                      <div className="teacher-contacts-mobile-pagination">
                        <button
                          type="button"
                          className="teacher-contacts-mobile-pagination-btn"
                          disabled={query.pageNumber <= 0}
                          onClick={() => setQuery({ ...query, pageNumber: Math.max(0, query.pageNumber - 1) })}
                          aria-label="Previous page"
                        >
                          Previous
                        </button>
                        <span className="teacher-contacts-mobile-pagination-text">
                          {query.pageNumber + 1} / {Math.ceil(total / query.pageSize) || 1}
                        </span>
                        <button
                          type="button"
                          className="teacher-contacts-mobile-pagination-btn"
                          disabled={(query.pageNumber + 1) * query.pageSize >= total}
                          onClick={() => setQuery({ ...query, pageNumber: query.pageNumber + 1 })}
                          aria-label="Next page"
                        >
                          Next
                        </button>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          </>
        )}
      {notificationContext}
    </div>
  );
};
