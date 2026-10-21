package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;

//INSERT INTO `role` (`id`, `created_at`, `updated_at`, `description`, `name`)
//        VALUES
//        (4, NULL, NULL, 'Admin role', 'admin'),
//        (5, NULL, NULL, 'User role', 'user');

@Data
@Entity(name = "role")
@Table(name = "role")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Role extends BaseModel {


    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;


}

