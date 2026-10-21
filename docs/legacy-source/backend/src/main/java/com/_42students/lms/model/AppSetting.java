package com._42students.lms.model;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "app_setting")
@Data
public class AppSetting extends BaseModel {

    @Column(name = "scope_type", nullable = false)
    private String scopeType; // GLOBAL | ORGANIZATION | COLLEGE | DEPARTMENT | PROGRAM | BATCH | CLASS | LEARNER

    @Column(name = "scope_id")
    private Integer scopeId;

    @Column(name = "setting_key", nullable = false)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;
}

