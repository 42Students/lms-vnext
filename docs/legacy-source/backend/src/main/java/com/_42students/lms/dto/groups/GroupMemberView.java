package com._42students.lms.dto.groups;

import com._42students.lms.model.Learner;
import com._42students.lms.model.groups.LmsGroupMember;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class GroupMemberView {
    private Long id;
    private Long groupId;
    private String memberType;
    private Integer memberId;
    private String state;
    private String source;
    private Boolean isLocked;
    private Integer waitlistPosition;
    private String note;
    private LocalDateTime joinedAt;
    private LocalDateTime createdAt;
    private String name;
    private String rollNumber;
    private String department;
    private Integer classId;

    public static GroupMemberView of(LmsGroupMember m, Learner learner) {
        GroupMemberView v = new GroupMemberView();
        v.id = m.getId();
        v.groupId = m.getGroupId();
        v.memberType = m.getMemberType();
        v.memberId = m.getMemberId();
        v.state = m.getState();
        v.source = m.getSource();
        v.isLocked = m.getIsLocked();
        v.waitlistPosition = m.getWaitlistPosition();
        v.note = m.getNote();
        v.joinedAt = m.getJoinedAt();
        v.createdAt = m.getCreatedAt();
        if (learner != null) {
            String first = learner.getFirstName() == null ? "" : learner.getFirstName();
            String last = learner.getLastName() == null ? "" : learner.getLastName();
            v.name = (first + " " + last).trim();
            v.rollNumber = learner.getRollNumber();
            v.department = learner.getDepartment();
            v.classId = learner.getClassId();
        }
        return v;
    }
}
