package com._42students.lms.dto.response;

import com._42students.lms.dto.request.MetaData;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO that returns program details with structure and courses
 * in a format compatible with the existing frontend expectations
 */
@Data
public class NewProgramDetailsDTO {
    private int id;
    private String name;
    
    @JsonProperty("dept_id")
    private int deptId;
    
    @JsonProperty("duration_years")
    private int durationYears;
    
    @JsonProperty("program_structure")
    private List<ProgramStructureWithCourses> programStructure;
    
    @Data
    public static class ProgramStructureWithCourses {
        private int id;
        private String name;
        
        @JsonProperty("start_date")
        private String startDate;
        
        @JsonProperty("end_date")
        private String endDate;
        
        private String status;
        
        @JsonProperty("course_ids")
        private List<Integer> courseIds;
        
        private List<CourseInfo> courses;
    }
    
    @Data
    public static class CourseInfo {
        private int id;
        
        @JsonProperty("course_name")
        private String courseName;
        
        @JsonProperty("short_title")
        private String shortTitle;
        
        @JsonProperty("formal_title")
        private String formalTitle;
        
        private boolean active;
        private boolean enabled;
        
        @JsonProperty("meta_data")
        private MetaData metaData;
        
        @JsonProperty("created_at")
        private List<Integer> createdAt;
    }
}

