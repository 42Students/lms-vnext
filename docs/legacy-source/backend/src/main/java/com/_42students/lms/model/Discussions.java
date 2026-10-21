package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;

@Data
@Entity(name = "discussions")
@Table(name = "discussions")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Discussions extends BaseModel {
    @Column(name = "lesson_content_id")
    private int lessonContentId;
    @Column(name = "content_text")
    private String contentText;
    @Column(name = "sequence")
    private int sequence;
    @Column(name = "user_id")
    private int userId;
    @Column(name = "user_name")
    private String userName;
    @Column(name = "profile_name")
    private String profileName;

}

