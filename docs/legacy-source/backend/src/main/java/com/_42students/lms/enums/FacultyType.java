package com._42students.lms.enums;

public enum FacultyType {
    PERMANENT, GUEST, VISITING, CONTRACT, ADMIN, HEAD, COORDINATOR, CLERK,
    PROFESSOR, ASSOCIATE_PROFESSOR, ASSISTANT_PROFESSOR, LECTURER, ADJUNCT, MENTOR,
    // faculty.faculty_type stores the ORDINAL (int column). Only ever APPEND new values here;
    // reordering or inserting silently changes every existing faculty's role.
    // model/FacultyTypeOrdinalPinTest fails the build if the existing order changes.
    TPO;

    public String getFacultyType() {
        switch (this) {
            case GUEST:
                return "Guest";
            case CLERK: 
                return "Clerk";
            case MENTOR:
                return "Mentor";
            case TPO:
                return "TPO";
            case VISITING:
                return "Visiting";
            case CONTRACT:
                return "Contract";
            case ADMIN:
                return "Admin";
            case HEAD:
                return "Head";
            case COORDINATOR:
                return "Coordinator";
            case PROFESSOR:
                return "Professor";
            case ASSOCIATE_PROFESSOR:
                return "Associate Professor";
            case ASSISTANT_PROFESSOR:
                return "Assistant Professor";
            case LECTURER:
                return "Lecturer";
            case ADJUNCT:
                return "Adjunct";
            default:
                return "Permanent";
        }
    }
}

