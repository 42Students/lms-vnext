package com._42students.lms.model;

import com._42students.lms.dto.request.MetaData;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;

@Data
@Entity(name = "course")
@Table(name = "course")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class Course extends BaseModel {
    @Column(name = "short_title")
    private String shortTitle;
    @Column(name = "dept_id")
    private int deptId;
    @Column(name = "course_name")
    private String courseName;
//    @Column(name = "meta_data", columnDefinition = "json")
//    @Type(type = "json")
//    private MetaData metaData;
    @Column(name = "parent_course_id")
    private int parentCourseId;
    @Column(name = "created_by_org_id")
    private Integer createdByOrgId;
    @Column(name = "active")
    private Boolean active;
    @Column(name = "enabled")
    private Boolean enabled;
    @Column(name = "allowed_for_display") 
    private Integer allowedForDisplay;
    @Column(name = "slug", unique = true, length = 64)
    private String slug; // Unique URL-safe identifier to replace courseId in URLs
    /**
     * Optimistic lock. Without it two concurrent course edits silently overwrote each other —
     * especially damaging here because setCourseFields reads the stored metaData JSON blob, merges
     * onto it and writes the whole thing back, so a lost update discards a nested object rather
     * than a single column. Must stay null for new entities (Spring Data's isNew() keys off a null
     * version; a non-null default makes it merge() instead of persist()).
     */
    @javax.persistence.Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "contents", columnDefinition = "json")
    @Type(type = "json")
    private MetaData metaData;

    //private Object extraData;
//    public class MetaData {
//        private Integer amount;
//        private String imageUrl;
//        private List<String> takeaways;
//        private String courseCode;
//        private String courseType;
//        private String courseColor;
//        private String imageUrlLp;
//        private String courseCategory;
//        private String courseEndDate;
//        private String courseStartDate;
//        private String introduction_content;
//        private String updatedOn;
//    }
}

