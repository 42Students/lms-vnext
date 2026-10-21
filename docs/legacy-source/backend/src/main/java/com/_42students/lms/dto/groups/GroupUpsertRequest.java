package com._42students.lms.dto.groups;

import lombok.Data;

import java.time.LocalDateTime;

/** Create/update body for a group. {@code kind} is required on create and immutable afterwards. */
@Data
public class GroupUpsertRequest {
    private String kind;
    private String name;
    private String description;
    /** null = unlimited. */
    private Integer capacity;
    private LocalDateTime selfJoinOpenFrom;
    private LocalDateTime selfJoinOpenUntil;
    private String academicYear;
    private Integer semesterNumber;
    /** Feature-owned. The kernel reads only {@code allowWaitlist} and {@code allowSelfLeave} (both default true). */
    private Object configJson;
}
