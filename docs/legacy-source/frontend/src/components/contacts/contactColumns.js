const ROLE_LABELS = { FACULTY: "Faculty", LEARNER: "Student", ADMIN: "Admin", RECRUITER: "Recruiter" };

export const allContactsColumn = [
  {
    title: 'Name',
    render: (_, record) => (<>{[record.firstName, record.lastName].filter(Boolean).join(" ") || "—"}</>),
    key: 'firstName',
    ellipsis: {showTitle: true},
    width: '30%'
  },
  {
    title: "Email",
    dataIndex: 'email',
    width: '30%'
  },
  {
    title: "Contact",
    dataIndex: "contactMobile",
    width: '20%'
  },
  {
    title: "Role",
    dataIndex: "userType",
    render: (type) => ROLE_LABELS[type] || type || "—",
    width: '20%'
  }
]

export const facultyContactsColumn = [
  {
    title: 'Name',
    render: (_, record) => (<>{[record.firstName, record.lastName].filter(Boolean).join(" ") || "—"}</>),
    key: 'firstName'
  },
  {
    title: "Email",
    dataIndex: 'email'
  },
  {
    title: "Contact",
    dataIndex: "contactMobile",
  }
]

export const learnerContactsColumn = [
  {
    title: 'Name',
    render: (_, record) => (<>{[record.firstName, record.lastName].filter(Boolean).join(" ") || "—"}</>),
    key: 'firstName'
  },
  {
    title: "Email",
    dataIndex: 'email'
  },
  {
    title: "Contact",
    dataIndex: "contactMobile",
  }
]
