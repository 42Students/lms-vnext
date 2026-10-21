package com._42students.lms.dto.response;

import lombok.Data;

import java.util.List;
import java.util.HashMap;

@Data
public class AttendanceDetailsResponseDTO {
    private Integer studentId;
    private String name;
    private List<HashMap<String, HashMap<String, String>>> attendanceList;
    private String courseName;
}
  
