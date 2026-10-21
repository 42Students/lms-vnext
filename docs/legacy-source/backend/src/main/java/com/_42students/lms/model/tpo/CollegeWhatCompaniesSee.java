package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/** What recruiter/companies may see of a student's verified record. Safe defaults; the college opts in. */
@Entity
@Table(name = "college_what_companies_see")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class CollegeWhatCompaniesSee {

    @Id
    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "show_cgpa_exact", nullable = false)
    private Boolean showCgpaExact = false;

    @Column(name = "show_tenth_twelfth", nullable = false)
    private Boolean showTenthTwelfth = true;

    @Column(name = "show_project_links", nullable = false)
    private Boolean showProjectLinks = true;

    @Column(name = "show_assessment_scores", nullable = false)
    private Boolean showAssessmentScores = false;

    @Column(name = "show_attendance", nullable = false)
    private Boolean showAttendance = false;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
