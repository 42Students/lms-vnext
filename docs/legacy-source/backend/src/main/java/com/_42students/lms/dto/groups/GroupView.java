package com._42students.lms.dto.groups;

import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class GroupView {
    private Long id;
    private String kind;
    private String ownerScope;
    private Integer collegeId;
    private String name;
    private String description;
    private String status;
    private Integer capacity;
    private Integer activeCount;
    /** null = unlimited. */
    private Integer seatsLeft;
    private LocalDateTime selfJoinOpenFrom;
    private LocalDateTime selfJoinOpenUntil;
    private boolean selfJoinOpenNow;
    private String academicYear;
    private Integer semesterNumber;
    private Object configJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Learner views only: the caller's own membership, if any. */
    private String myState;
    private Integer myWaitlistPosition;
    private Boolean myLocked;

    public static GroupView of(LmsGroup g, LocalDateTime now) {
        GroupView v = new GroupView();
        v.id = g.getId();
        v.kind = g.getKind();
        v.ownerScope = g.getOwnerScope();
        v.collegeId = g.getCollegeId();
        v.name = g.getName();
        v.description = g.getDescription();
        v.status = g.getStatus();
        v.capacity = g.getCapacity();
        v.activeCount = g.getActiveCount();
        v.seatsLeft = g.seatsLeft();
        v.selfJoinOpenFrom = g.getSelfJoinOpenFrom();
        v.selfJoinOpenUntil = g.getSelfJoinOpenUntil();
        v.selfJoinOpenNow = LmsGroup.STATUS_ACTIVE.equals(g.getStatus())
                && g.getSelfJoinOpenFrom() != null && !now.isBefore(g.getSelfJoinOpenFrom())
                && (g.getSelfJoinOpenUntil() == null || !now.isAfter(g.getSelfJoinOpenUntil()));
        v.academicYear = g.getAcademicYear();
        v.semesterNumber = g.getSemesterNumber();
        v.configJson = g.getConfigJson();
        v.createdAt = g.getCreatedAt();
        v.updatedAt = g.getUpdatedAt();
        return v;
    }

    public GroupView withMembership(LmsGroupMember m) {
        if (m != null) {
            this.myState = m.getState();
            this.myWaitlistPosition = m.getWaitlistPosition();
            this.myLocked = m.getIsLocked();
        }
        return this;
    }
}
