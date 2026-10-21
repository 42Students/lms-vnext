package com._42students.lms.dto.tpo;

import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.model.tpo.JobRoleOption;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/** Create/update payload for Create Drive, shared by the TPO no-login path and recruiter requests. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DriveForm {
    private String jobTitle;
    private String companyName;
    private String companyLogo;
    private Integer companyId;
    private String jobDescription;
    /** The drive happened outside the platform and is only being recorded (placement cell only). */
    private Boolean recordedOutside;
    /** Link to the uploaded job description file. Empty clears it. */
    private String jdUrl;
    private String location;

    /** ON_CAMPUS | POOL | OFF_CAMPUS */
    private String driveMode = "ON_CAMPUS";
    private String hostCollegeName;
    private LocalDateTime reportingAt;
    private String travelNote;
    private String externalApplyUrl;

    private Boolean requiresExternalRegistration = false;
    private String externalPortalName;
    private String externalPortalUrl;

    /** Skills the company wants, for the Applicants tab's skill match. Null leaves them as they are; an empty list clears them. */
    private List<String> wantedSkills;

    /** Full-time | Internship | Internship + full-time | Contract | Apprenticeship (JobTypes). An Internship offer never counts as placed. */
    private String jobType;

    /** REGULAR | DREAM | SUPER_DREAM; null = auto from CTC */
    private String category;
    private String categoryOverrideReason;

    private List<JobRoleOption> roleOptions;
    private JobEligibility eligibility;
    private List<RoundForm> rounds;

    private LocalDateTime applicationDeadline;
    private Long seasonId;

    /** On a live drive, tell everyone who applied that something changed. */
    private Boolean notifyApplicants = false;
}
