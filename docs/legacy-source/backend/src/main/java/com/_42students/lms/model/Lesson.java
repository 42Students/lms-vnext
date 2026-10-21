package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;
import javax.persistence.Transient;

@Data
@Entity(name = "lesson")
@Table(name = "lesson")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Lesson extends BaseModel {
    @Column(name = "lesson_name")
    private String lessonName;
    @Column(name = "course_id")
    private int courseId;
    @Column(name = "active")
    private boolean active;
    @Column(name = "enabled")
    private boolean enabled;
    @Column(name = "sequence")
    private long sequence;
    @Transient
    private String courseSlug; // Populated for API response; not persisted

    /**
     * Optimistic lock. Without it two concurrent edits to the same lesson silently overwrote each
     * other. Must stay null for new entities — Spring Data's isNew() check keys off a null version,
     * and a non-null default would make it call merge() instead of persist().
     */
    @javax.persistence.Version
    @Column(name = "version", nullable = false)
    private Long version;
    //@Column(name = "contents", columnDefinition = "json")
    //@Type(type = "json")
    //private List<ContentsDTO> contentsDTOs;
}

