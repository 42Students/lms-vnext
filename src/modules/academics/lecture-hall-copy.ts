/** Exact legacy wording of LectureHalls.js (lms-dev-2026): COL-academic-setup-37. */
export const ROOM_TYPE_LABELS: Record<string, string> = {
  CLASSROOM: "Classroom",
  LECTURE_HALL: "Lecture Hall",
  LAB: "Laboratory",
  SEMINAR_HALL: "Seminar Hall",
  AUDITORIUM: "Auditorium",
  CONFERENCE_ROOM: "Conference Room",
};

export const LECTURE_HALL_COPY = {
  createTitle: "Create New Lecture Hall / Room",
  createButton: "Create Lecture Hall",
  nameLabel: "Room Name",
  namePlaceholder: "e.g., Room 101, Lab A",
  typeLabel: "Room Type",
  typePlaceholder: "Select type",
  capacityLabel: "Capacity",
  departmentLabel: "Department (Optional)",
  departmentPlaceholder: "Select department",
  descriptionLabel: "Description",
  descriptionRows: 2,
  existingTitle: "Existing Lecture Halls / Rooms",
  descriptionPlaceholder: "e.g., AC room, projector available",
  createdMessage: "Lecture hall created successfully!",
  createFailureMessage: "Could not create the room. Try again.",
  updatedMessage: "Lecture hall updated successfully!",
  columns: { name: "Name", type: "Room Type", capacity: "Capacity", department: "Department", description: "Description" },
} as const;
