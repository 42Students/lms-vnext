package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.sql.Date;

@Data
@Entity(name = "class")
@Table(name = "class")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class _Class extends BaseModel {
    @Id
    @Column(name = "id", unique = true)
    @GeneratedValue
    private int id;
    @Column(name = "name")
    private String name;
    @Column(name = "description")
    private String description;
    @Column(name = "start_date") 
    private Date startDate;
    @Column(name = "end_date")
    private Date endDate;
    @Column(name = "program_id")
    private int programId;
    @Column(name = "batch_id")
    private Integer batchId;
    @Column(name = "upper_limit")
    private int upperLimit;
    @Column(name = "lower_limit")
    private int lowerLimit;

    public static final String TYPE_SECTION = "SECTION";
    public static final String TYPE_GROUP_BACKED = "GROUP_BACKED";

    /** SECTION (a real section with learner.class_id pointing here) or GROUP_BACKED (roster = a group's members). */
    @Column(name = "class_type", nullable = false, length = 20)
    private String classType = TYPE_SECTION;

    /** GROUP_BACKED only: the lms_group whose ACTIVE members form this class's roster. See RosterSql. */
    @Column(name = "roster_group_id")
    private Long rosterGroupId;

    public boolean isGroupBacked() {
        return TYPE_GROUP_BACKED.equals(classType);
    }
}


