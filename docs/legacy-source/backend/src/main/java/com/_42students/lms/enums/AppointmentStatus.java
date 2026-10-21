package com._42students.lms.enums;

public enum AppointmentStatus {
    CREATED, SCHEDULED, COMPLETED, CANCELLED;

    public String getAppointmentStatus() {
        switch (this) {
            case CREATED:
                return "Created";
            case SCHEDULED:
                return "Scheduled";
            case COMPLETED:
                return "Completed";
            case CANCELLED:
                return "Cancelled";
            default:
                return "Created";
        }
    }
}

