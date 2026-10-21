package com._42students.lms.model;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@Entity(name = "college")
@Table(name = "college")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class College extends BaseModel {
    @Column(name = "name")
    private String name;
    @Column(name = "logo")
    private String logo;
    @Column(name = "unique_id", unique = true)
    private String uniqueId;
    @Column(name = "address_line1")
    private String addressLine1;
    @Column(name = "address_line2")
    private String addressLine2;
    @Column(name = "landmark")
    private String landmark;
    @Column(name = "city")
    private String city;
    @Column(name = "state")
    private String state;
    @Column(name = "country")
    private String country;
    @Column(name = "pin_code")
    private String pinCode;
    @Column(name = "college_chair_id")
    private Integer collegeChairId;
    @Column(name = "college_vice_chair_id")
    private Integer collegeViceChairId;
    @Column(name = "org_id")
    private Integer orgId;
}

