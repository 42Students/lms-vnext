package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity(name = "job_preferences")
@Table(name = "job_preferences")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class JobPreferences extends BaseModel {
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false, unique = true)
    private Learner learner;
    
    @Column(name = "role_preference")
    private String rolePreference; // e.g., "Software Engineer", "Data Scientist", "Product Manager"
    
    @Column(name = "specific_role_preference", columnDefinition = "TEXT")
    private String specificRolePreference; // More detailed description
    
    @Column(name = "work_shift_preference")
    private String workShiftPreference; // e.g., "Day Shift", "Night Shift", "Flexible", "Remote"
    
    @Column(name = "preferred_employment_city")
    private String preferredEmploymentCity; // e.g., "Bangalore", "Mumbai", "Remote"
    
    // Additional profile fields
    @Column(name = "exam_slot_preference")
    private String examSlotPreference; // "Morning", "Afternoon", "Evening"
    
    @Column(name = "pap_interest")
    private String papInterest; // "Yes", "No", "Need more info"

    // Previously every job/interview status transition unconditionally emailed/SMSed the
    // learner with no way to opt out. Default true (opt-out, not opt-in) so existing/new
    // learners keep getting notified unless they explicitly turn it off.
    @Column(name = "job_notifications_enabled", nullable = false)
    private Boolean jobNotificationsEnabled = true;
}


