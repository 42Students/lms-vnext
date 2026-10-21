package com._42students.lms.enums;

public enum RoomType {
    CLASSROOM, 
    LECTURE_HALL, 
    LAB, 
    SEMINAR_HALL, 
    AUDITORIUM, 
    CONFERENCE_ROOM;

    public String getRoomType() {
        switch (this) {
            case LAB:
                return "Laboratory";
            case LECTURE_HALL:
                return "Lecture Hall";
            case SEMINAR_HALL:
                return "Seminar Hall";
            case AUDITORIUM:
                return "Auditorium";
            case CONFERENCE_ROOM:
                return "Conference Room";
            default:
                return "Classroom";
        }
    }
}

