package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com._42students.lms.enums.StatusType;
import javax.persistence.*;
import java.util.List;

@Data
@Entity(name = "new_program_structure")
@Table(name = "new_program_structure")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class NewProgramStructure extends BaseModel {
    @Column(name = "name")
    private String name;
    @Column(name = "program_id")
    private int programId;
    @Column(name = "start_date")
    private String startDate;
    @Column(name = "end_date")
    private String endDate;
    @Column(name = "courseIds", columnDefinition = "json")
    @Type(type = "json")
    public List<Integer> courseIds;
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private StatusType status;
}

