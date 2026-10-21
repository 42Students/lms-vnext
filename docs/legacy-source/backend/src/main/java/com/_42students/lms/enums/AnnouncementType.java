package com._42students.lms.enums;

public enum AnnouncementType {
    COLLEGE("College"),
    PROGRAM("Program"),
    DEPARTMENT("Department"),
    LEARNER("Learner"),
    FACULTY("Faculty"),
    CLASS("Class");

    private final String type;

    AnnouncementType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}

