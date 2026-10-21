package com._42students.lms.dto.tpo;

import com._42students.lms.model.Learner;
import lombok.Getter;

/**
 * What the TPO portal needs to list a student: identity, department and a way to reach them.
 * Deliberately NOT the Learner entity, which also carries date of birth, addresses, blood group,
 * suspension reason, token version and free-form profile fields a placement officer has no use for.
 * Academic values (CGPA etc.) come from learner_academic_record, never from here.
 */
@Getter
public class StudentSummaryDTO {
    private final int id;
    private final String firstName;
    private final String lastName;
    private final String uniqueId;
    private final String rollNumber;
    private final String department;
    private final Integer classId;
    private final Integer programId;
    private final String contactMail;
    private final String contactMobile;
    private final String resumeUrl;

    public StudentSummaryDTO(Learner l) {
        this.id = l.getId();
        this.firstName = l.getFirstName();
        this.lastName = l.getLastName();
        this.uniqueId = l.getUniqueId();
        this.rollNumber = l.getRollNumber();
        this.department = l.getDepartment();
        this.classId = l.getClassId();
        this.programId = l.getProgramId();
        this.contactMail = l.getContactMail();
        this.contactMobile = l.getContactMobile();
        this.resumeUrl = l.getResumeUrl();
    }
}
